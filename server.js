require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { db, seed } = require("./store");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "development-only-change-this-secret";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
seed();

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Please sign in to continue." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "14d" });
}
async function ai(messages, temperature = 0.3) {
  if (!process.env.OPENAI_API_KEY) throw new Error("AI is not configured yet. Add OPENAI_API_KEY to your .env file.");
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const r = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", messages, temperature })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "AI provider request failed.");
  return data.choices?.[0]?.message?.content || "";
}
function jsonFromText(s) {
  const clean = s.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{"), end = clean.lastIndexOf("}");
  return JSON.parse(start >= 0 ? clean.slice(start, end + 1) : clean);
}
const levels = ["A1","A2","B1","B2","C1","C2"];

// Auth
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (!password || password.length < 8) return res.status(400).json({ error: "Password must contain at least 8 characters." });
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare("INSERT INTO users(email,password_hash,display_name) VALUES(?,?,?)").run(email.toLowerCase(), hash, (displayName || "Learner").slice(0,60));
    const user = db.prepare("SELECT id,email,display_name FROM users WHERE id=?").get(result.lastInsertRowid);
    res.json({ token: signToken(user), user });
  } catch (e) { res.status(400).json({ error: e.code === "SQLITE_CONSTRAINT_UNIQUE" ? "An account with this email already exists." : e.message }); }
});
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email=?").get((email || "").toLowerCase());
  if (!user || !(await bcrypt.compare(password || "", user.password_hash))) return res.status(401).json({ error: "Incorrect email or password." });
  res.json({ token: signToken(user), user: { id:user.id, email:user.email, display_name:user.display_name } });
});
app.get("/api/auth/me", auth, (req,res) => {
  const user = db.prepare("SELECT id,email,display_name,created_at FROM users WHERE id=?").get(req.user.id);
  res.json({ user });
});

// Dashboard
app.get("/api/dashboard", auth, (req,res) => {
  const uid = req.user.id;
  const vocabulary = db.prepare("SELECT COUNT(*) n FROM vocabulary WHERE user_id=?").get(uid).n;
  const mastered = db.prepare("SELECT COUNT(*) n FROM vocabulary WHERE user_id=? AND status='mastered'").get(uid).n;
  const writing = db.prepare("SELECT COUNT(*) n FROM writing_submissions WHERE user_id=?").get(uid).n;
  const reading = db.prepare("SELECT COUNT(*) n FROM reading_progress WHERE user_id=? AND completed=1").get(uid).n;
  const due = db.prepare("SELECT COUNT(*) n FROM vocabulary WHERE user_id=? AND (next_review IS NULL OR next_review<=datetime('now'))").get(uid).n;
  res.json({ vocabulary, mastered, writing, reading, due });
});

// Vocabulary
app.get("/api/vocabulary", auth, (req,res) => {
  const { q="", topic="", status="" } = req.query;
  let sql = "SELECT * FROM vocabulary WHERE user_id=?";
  const args = [req.user.id];
  if (q) { sql += " AND (word LIKE ? OR meaning LIKE ?)"; args.push(`%${q}%`,`%${q}%`); }
  if (topic) { sql += " AND topic=?"; args.push(topic); }
  if (status) { sql += " AND status=?"; args.push(status); }
  sql += " ORDER BY created_at DESC";
  res.json({ items: db.prepare(sql).all(...args) });
});
app.post("/api/vocabulary/enrich", auth, async (req,res) => {
  const word = String(req.body.word || "").trim();
  if (!word || word.length > 100) return res.status(400).json({ error: "Enter a word or short phrase (up to 100 characters)." });
  try {
    const prompt = `You are an expert English lexicographer teaching a Vietnamese learner. Return ONLY valid JSON with keys: word, ipa_uk, ipa_us, part_of_speech, level (A1/A2/B1/B2/C1/C2), meanings (array of concise Vietnamese meanings), examples (array of 2 objects {en,vi}), synonyms (array of {word,vi}), antonyms (array of {word,vi}), collocations (array of {en,vi}), word_family (array of {word,pos,vi}), topic. Be accurate; if no natural antonym exists, return an empty array. Input: ${word}`;
    const result = jsonFromText(await ai([{ role:"system", content:"Return valid JSON only. Do not invent an antonym when none exists." }, { role:"user", content:prompt }]));
    res.json({ item: result });
  } catch(e) { res.status(503).json({ error:e.message }); }
});
app.post("/api/vocabulary", auth, (req,res) => {
  const x = req.body || {};
  if (!x.word || !x.meaning) return res.status(400).json({ error:"Word and Vietnamese meaning are required." });
  const r = db.prepare(`INSERT INTO vocabulary(user_id,word,ipa_uk,ipa_us,part_of_speech,level,meaning,examples,synonyms,antonyms,collocations,word_family,topic)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(req.user.id, x.word, x.ipa_uk||"", x.ipa_us||"", x.part_of_speech||"", x.level||"B1", x.meaning,
    JSON.stringify(x.examples||[]),JSON.stringify(x.synonyms||[]),JSON.stringify(x.antonyms||[]),JSON.stringify(x.collocations||[]),JSON.stringify(x.word_family||[]),x.topic||"General");
  res.json({ item: db.prepare("SELECT * FROM vocabulary WHERE id=?").get(r.lastInsertRowid) });
});
app.patch("/api/vocabulary/:id", auth, (req,res) => {
  const { status } = req.body || {};
  if (!["learning","review","mastered"].includes(status)) return res.status(400).json({error:"Invalid vocabulary status."});
  const intervals = { learning: 0, review: 1, mastered: 7 };
  db.prepare("UPDATE vocabulary SET status=?, next_review=datetime('now', ?) WHERE id=? AND user_id=?")
    .run(status, `+${intervals[status]} days`, req.params.id, req.user.id);
  res.json({ ok:true });
});
app.delete("/api/vocabulary/:id", auth, (req,res) => {
  db.prepare("DELETE FROM vocabulary WHERE id=? AND user_id=?").run(req.params.id,req.user.id);
  res.json({ ok:true });
});

// Grammar curriculum and progress
app.get("/api/grammar", (req,res) => {
  const { level } = req.query;
  const rows = level ? db.prepare("SELECT * FROM grammar_topics WHERE level=? ORDER BY sort_order").all(level) : db.prepare("SELECT * FROM grammar_topics ORDER BY sort_order").all();
  res.json({ items: rows });
});
app.get("/api/grammar/progress", auth, (req,res) => {
  res.json({ items: db.prepare("SELECT topic_id,completed,score FROM grammar_progress WHERE user_id=?").all(req.user.id) });
});
app.post("/api/grammar/progress", auth, (req,res) => {
  const { topicId, completed, score } = req.body || {};
  db.prepare(`INSERT INTO grammar_progress(user_id,topic_id,completed,score) VALUES(?,?,?,?)
    ON CONFLICT(user_id,topic_id) DO UPDATE SET completed=excluded.completed,score=excluded.score,updated_at=CURRENT_TIMESTAMP`)
    .run(req.user.id,topicId,completed?1:0,Number.isFinite(score)?score:null);
  res.json({ ok:true });
});
app.post("/api/grammar/lesson", async (req,res) => {
  const { title, level } = req.body || {};
  try {
    const content = await ai([
      {role:"system",content:"You are a precise English grammar teacher for Vietnamese learners. Use clear sections: Overview, Form, Uses, Examples (English + Vietnamese), Common mistakes, Mini quiz (5 questions with answer key and explanations)."},
      {role:"user",content:`Teach the grammar topic "${title}" at CEFR ${level}. Explain in Vietnamese while keeping English examples.`}
    ]);
    res.json({ content });
  } catch(e) { res.status(503).json({error:e.message}); }
});

// Writing
app.post("/api/writing/prompt", async (req,res) => {
  const { topic="Daily Life", level="B1", type="paragraph" } = req.body || {};
  try {
    const content = await ai([{role:"system",content:"Create practical English writing prompts. Return a concise prompt, instructions, suggested word count, and useful vocabulary with Vietnamese meanings."},{role:"user",content:`Create one ${type} writing task about ${topic} for CEFR ${level}.` }]);
    res.json({ prompt:content });
  } catch(e) { res.status(503).json({error:e.message}); }
});
app.post("/api/writing/evaluate", auth, async (req,res) => {
  const { title="Untitled writing", topic="General", level="B1", text="" } = req.body || {};
  if (!text.trim()) return res.status(400).json({error:"Write something before submitting."});
  try {
    const content = await ai([
      {role:"system",content:`You are a rigorous but encouraging English writing examiner for Vietnamese learners. Return ONLY JSON with keys: overall_score (0-100), level_estimate, summary_vi, criteria (array of {name,score,max,feedback_vi}), corrections (array of {original,corrected,reason_vi}), improved_version, vocabulary_suggestions (array of {word,meaning_vi,example}), next_steps (array of strings). Do not over-penalize stylistic alternatives.`},
      {role:"user",content:`Topic: ${topic}\nTarget level: ${level}\nTitle: ${title}\nWriting:\n${text}`}
    ]);
    const result = jsonFromText(content);
    db.prepare("INSERT INTO writing_submissions(user_id,title,topic,level,original_text,feedback_json,score) VALUES(?,?,?,?,?,?,?)")
      .run(req.user.id,title,topic,level,text,JSON.stringify(result),result.overall_score||0);
    res.json({ result });
  } catch(e) { res.status(503).json({error:e.message}); }
});
app.get("/api/writing/history", auth, (req,res) => {
  res.json({ items: db.prepare("SELECT id,title,topic,level,score,created_at FROM writing_submissions WHERE user_id=? ORDER BY created_at DESC LIMIT 30").all(req.user.id) });
});

// Reading
app.get("/api/readings", (req,res) => {
  const { topic, level } = req.query;
  let sql = "SELECT * FROM readings WHERE 1=1", args=[];
  if(topic){sql+=" AND topic=?";args.push(topic);}
  if(level){sql+=" AND level=?";args.push(level);}
  res.json({items:db.prepare(sql+" ORDER BY id").all(...args).map(x=>({...x,questions:JSON.parse(x.questions_json)}))});
});
app.post("/api/readings/:id/complete", auth, (req,res) => {
  db.prepare(`INSERT INTO reading_progress(user_id,reading_id,completed) VALUES(?,?,1)
    ON CONFLICT(user_id,reading_id) DO UPDATE SET completed=1,updated_at=CURRENT_TIMESTAMP`).run(req.user.id,req.params.id);
  res.json({ok:true});
});
app.post("/api/readings/generate", async (req,res) => {
  const { topic="Technology", level="B1" } = req.body || {};
  try {
    const content = await ai([
      {role:"system",content:"Create an original bilingual English-learning reading. Return ONLY JSON with title, topic, level, source_note, english_text, vietnamese_text, vocabulary (array of {word,ipa,pos,meaning_vi}), questions (array of {question,options (array of 4),answer_index,explanation_vi}). Do not imitate or reproduce copyrighted articles, songs, or transcripts."},
      {role:"user",content:`Write an original 250-350 word reading about ${topic} at CEFR ${level}. Provide a faithful Vietnamese translation and 5 comprehension questions.`}
    ]);
    const x=jsonFromText(content);
    const r=db.prepare("INSERT INTO readings(title,topic,level,source_note,english_text,vietnamese_text,vocabulary_json,questions_json) VALUES(?,?,?,?,?,?,?,?)")
      .run(x.title,x.topic||topic,x.level||level,x.source_note||"Original learning text",x.english_text,x.vietnamese_text,JSON.stringify(x.vocabulary||[]),JSON.stringify(x.questions||[]));
    res.json({item:{id:r.lastInsertRowid,...x}});
  } catch(e){res.status(503).json({error:e.message});}
});

app.get("/api/health", (req,res)=>res.json({ok:true,aiConfigured:!!process.env.OPENAI_API_KEY}));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`English Wonderland running at http://localhost:${PORT}`));
