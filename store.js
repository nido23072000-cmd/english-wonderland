const Database = require("better-sqlite3");
const db = new Database("wonderland.sqlite");
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,display_name TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS vocabulary(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,word TEXT NOT NULL,ipa_uk TEXT,ipa_us TEXT,part_of_speech TEXT,level TEXT,meaning TEXT,examples TEXT,synonyms TEXT,antonyms TEXT,collocations TEXT,word_family TEXT,topic TEXT,status TEXT DEFAULT 'learning',next_review TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS grammar_topics(id INTEGER PRIMARY KEY AUTOINCREMENT,level TEXT NOT NULL,title TEXT NOT NULL,category TEXT NOT NULL,description TEXT NOT NULL,sort_order INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS grammar_progress(user_id INTEGER NOT NULL,topic_id INTEGER NOT NULL,completed INTEGER DEFAULT 0,score REAL,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,topic_id));
CREATE TABLE IF NOT EXISTS writing_submissions(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT,topic TEXT,level TEXT,original_text TEXT,feedback_json TEXT,score REAL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS readings(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,topic TEXT,level TEXT,source_note TEXT,english_text TEXT,vietnamese_text TEXT,vocabulary_json TEXT,questions_json TEXT);
CREATE TABLE IF NOT EXISTS reading_progress(user_id INTEGER NOT NULL,reading_id INTEGER NOT NULL,completed INTEGER DEFAULT 0,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,reading_id));
`);

const grammar = {
A1: [
["Subject pronouns and verb to be","Foundations","I am, you are, he/she/it is; affirmative, negative and question forms."],
["Articles: a, an, the","Nouns","Choosing indefinite and definite articles."],
["Singular and plural nouns","Nouns","Regular plurals and common irregular forms."],
["Possessive adjectives and 's","Pronouns","my, your, his, her, our, their and possession."],
["Present simple","Tenses","Habits, routines, facts and third-person -s."],
["Present continuous","Tenses","Actions happening now and temporary situations."],
["There is / There are","Sentence patterns","Describing existence and quantity."],
["Countable and uncountable nouns","Nouns","some, any, much, many and a lot of."],
["Can / can't","Modal verbs","Ability, permission and simple requests."],
["Prepositions of place and time","Prepositions","in, on, at, under, next to and between."],
["Basic question forms","Questions","Wh- questions and yes/no questions."],
["Imperatives and object pronouns","Sentence patterns","Instructions, commands and me, him, her, us, them."]
],
A2: [
["Past simple","Tenses","Completed past actions; regular and irregular verbs."],
["Past continuous","Tenses","Actions in progress at a past time."],
["Future with will and going to","Tenses","Predictions, decisions and plans."],
["Present continuous for arrangements","Tenses","Fixed future arrangements."],
["Comparatives and superlatives","Adjectives","Comparing people, places and things."],
["Adverbs of frequency and manner","Adverbs","How often and how actions happen."],
["Infinitive and gerund basics","Verb patterns","Common verbs followed by to-infinitive or -ing."],
["Should, must and have to","Modal verbs","Advice, obligation and rules."],
["Too and enough","Adjectives","Degree and sufficiency."],
["First conditional","Conditionals","Real future possibilities."],
["Relative clauses with who/which/that","Clauses","Identifying people and things."],
["Present perfect introduction","Tenses","Life experiences and unfinished time."]
],
B1: [
["Present perfect vs past simple","Tenses","Connecting past events to the present."],
["Present perfect continuous","Tenses","Duration and recently ongoing activities."],
["Past perfect","Tenses","An earlier past event."],
["Passive voice: core forms","Voice","Forming passive sentences across common tenses."],
["Reported speech: statements","Reported speech","Backshift, pronouns and time expressions."],
["Second conditional","Conditionals","Unreal or unlikely present/future situations."],
["Third conditional","Conditionals","Imaginary past situations and regrets."],
["Defining and non-defining relative clauses","Clauses","Essential and extra information."],
["Modal verbs of deduction","Modal verbs","must, might, may, could and can't."],
["Used to / be used to / get used to","Verb patterns","Past habits and familiarity."],
["Phrasal verbs and collocations","Vocabulary grammar","Separable and inseparable phrasal verbs."],
["Linking words and complex sentences","Discourse","Although, despite, however, therefore."]
],
B2: [
["Mixed conditionals","Conditionals","Combining different time references."],
["Advanced passive structures","Voice","Reporting structures and have/get something done."],
["Reported questions and commands","Reported speech","Indirect questions, requests and commands."],
["Inversion after negative adverbials","Sentence patterns","Never, rarely, hardly, not only."],
["Cleft sentences","Emphasis","It-clefts and what-clefts."],
["Participle clauses","Clauses","Present and past participle reductions."],
["Advanced modal perfects","Modal verbs","must have, should have, might have."],
["Gerund and infinitive contrasts","Verb patterns","Meaning changes after selected verbs."],
["Wish and if only","Mood","Regrets and hypothetical situations."],
["Concession and contrast","Discourse","Although, even though, whereas, nevertheless."],
["Articles in abstract and general reference","Determiners","Nuanced article use."],
["Advanced comparison structures","Adjectives","The more..., the more...; far/by far."]
],
C1: [
["Subjunctive mood","Mood","Mandative subjunctive and formal recommendations."],
["Advanced inversion","Sentence patterns","Only after, under no circumstances, so/such."],
["Ellipsis and substitution","Discourse","Avoiding repetition with so, do, one and omission."],
["Reduced relative clauses","Clauses","Participle and infinitive reductions."],
["Noun clauses and extraposition","Clauses","That-clauses, wh-clauses and it structures."],
["Advanced clefting and focus","Emphasis","Fronting, pseudo-clefts and information focus."],
["Hedging and stance","Academic English","Qualifying claims and expressing caution."],
["Complex preposition patterns","Prepositions","Formal multi-word prepositions."],
["Nominalisation","Academic English","Turning processes into concise noun phrases."],
["Advanced verb complementation","Verb patterns","Complex patterns and meaning distinctions."],
["Discourse markers and pragmatic meaning","Discourse","Register-sensitive linking and interaction."],
["Register and style","Academic English","Formal, neutral and informal grammar choices."]
],
C2: [
["Advanced information structure","Discourse","Theme-rheme, end-weight and end-focus."],
["Rare and literary inversion","Sentence patterns","Stylistic inversion in formal and literary prose."],
["Complex conditional alternatives","Conditionals","Inverted conditionals and implied conditions."],
["Advanced modality and evidentiality","Modal verbs","Fine distinctions of certainty, source and attitude."],
["Cohesion across extended discourse","Discourse","Reference, substitution, lexical chains and progression."],
["Advanced ellipsis in conversation","Discourse","Context-dependent omission and response forms."],
["Syntactic ambiguity and disambiguation","Syntax","Parsing and resolving ambiguous structures."],
["Formal legal and academic constructions","Register","Dense clauses and precise qualification."],
["Stylistic fronting and postponement","Emphasis","Marked word order for rhetorical effect."],
["Corpus-informed grammar choices","Usage","Frequency, collocation and naturalness."],
["Idiomatic clause patterns","Usage","Conventional patterns and constraints."],
["Editing for precision and elegance","Style","Conciseness, parallelism and rhetorical control."]
]};

const readings = [
["The Power of Small Habits","Personal Development","A2","Original learning text",
"Big changes do not always begin with big decisions. Often, they start with small habits. Reading two pages every evening, walking for ten minutes, or learning three new words can make a difference over time. The secret is consistency. A habit becomes easier when it is connected to a regular part of the day. For example, you can review vocabulary after breakfast. You do not need to be perfect. If you miss one day, simply begin again the next day. Small actions may seem unimportant at first, but they can create meaningful progress.",
"Những thay đổi lớn không phải lúc nào cũng bắt đầu từ những quyết định lớn. Thông thường, chúng bắt đầu từ những thói quen nhỏ. Đọc hai trang sách mỗi tối, đi bộ mười phút hoặc học ba từ mới có thể tạo ra khác biệt theo thời gian. Bí quyết là sự đều đặn. Một thói quen sẽ dễ duy trì hơn khi được gắn với một phần quen thuộc trong ngày. Ví dụ, bạn có thể ôn từ vựng sau bữa sáng. Bạn không cần phải hoàn hảo. Nếu bỏ lỡ một ngày, đơn giản hãy bắt đầu lại vào ngày hôm sau. Những hành động nhỏ ban đầu có vẻ không đáng kể nhưng có thể tạo nên tiến bộ ý nghĩa.",
[["consistency","/kənˈsɪstənsi/","noun","sự đều đặn"],["meaningful","/ˈmiːnɪŋfəl/","adjective","có ý nghĩa"],["over time","/ˌəʊvə ˈtaɪm/","phrase","theo thời gian"]],
[["What is the main idea? ",["Small habits can lead to progress","Only big goals matter","Habits are always difficult","Reading is the only useful habit"],0,"The text explains how small, consistent actions create progress."],["What does consistency mean here?",["Doing something regularly","Doing something once","Doing everything perfectly","Changing plans daily"],0,"Consistency means repeating an action regularly."]]],
["How AI Is Changing Everyday Life","Technology","B1","Original learning text",
"Artificial intelligence is becoming part of everyday life. People use AI tools to translate messages, organise information, learn languages and generate ideas. These tools can save time, but they also require careful use. AI systems may produce inaccurate information or reflect bias in their training data. Users should check important facts and protect personal information. In education, AI can provide extra explanations and practice, while teachers remain important for guidance, feedback and human understanding. The most useful approach is not to let technology think for us, but to use it to support better thinking.",
"Trí tuệ nhân tạo đang dần trở thành một phần của cuộc sống hằng ngày. Mọi người sử dụng các công cụ AI để dịch tin nhắn, sắp xếp thông tin, học ngôn ngữ và tạo ý tưởng. Những công cụ này có thể tiết kiệm thời gian nhưng cũng cần được sử dụng cẩn trọng. Hệ thống AI có thể tạo ra thông tin không chính xác hoặc phản ánh sự thiên lệch trong dữ liệu huấn luyện. Người dùng nên kiểm tra những thông tin quan trọng và bảo vệ dữ liệu cá nhân. Trong giáo dục, AI có thể cung cấp lời giải thích và bài luyện tập bổ sung, trong khi giáo viên vẫn đóng vai trò quan trọng trong việc hướng dẫn, phản hồi và thấu hiểu con người. Cách tiếp cận hữu ích nhất không phải là để công nghệ suy nghĩ thay chúng ta, mà là sử dụng nó để hỗ trợ tư duy tốt hơn.",
[["inaccurate","/ɪnˈækjərət/","adjective","không chính xác"],["bias","/ˈbaɪəs/","noun","sự thiên lệch"],["guidance","/ˈɡaɪdəns/","noun","sự hướng dẫn"]],
[["What is one risk of AI tools?",["They may provide inaccurate information","They always cost too much","They cannot translate","They remove all bias"],0,"The passage warns that AI may produce inaccurate information."],["What role do teachers still play?",["Guidance and feedback","Replacing all technology","Generating all data","Avoiding student questions"],0,"Teachers remain important for guidance, feedback and human understanding."]]],
["A Weekend in Hoi An","Travel & Culture","A1","Original learning text",
"Last weekend, Minh visited Hoi An with his family. They walked through the old town and saw colourful lanterns. In the afternoon, they tried local food and took many photos. Minh liked the quiet streets and friendly people. In the evening, the family watched the lanterns shine along the river. It was a wonderful trip, and Minh hopes to visit again.",
"Cuối tuần trước, Minh đến Hội An cùng gia đình. Họ đi bộ qua phố cổ và ngắm những chiếc đèn lồng đầy màu sắc. Buổi chiều, họ thử các món ăn địa phương và chụp nhiều ảnh. Minh thích những con phố yên tĩnh và người dân thân thiện. Buổi tối, cả gia đình ngắm đèn lồng tỏa sáng dọc bờ sông. Đó là một chuyến đi tuyệt vời và Minh hy vọng sẽ quay lại.",
[["lantern","/ˈlæntən/","noun","đèn lồng"],["local","/ˈləʊkəl/","adjective","địa phương"],["wonderful","/ˈwʌndəfəl/","adjective","tuyệt vời"]],
[["Where did Minh go?",["Hoi An","Ha Noi","Da Nang","Hue"],0,"Minh visited Hoi An."],["Who went with Minh?",["His family","His classmates","His colleagues","Nobody"],0,"He visited with his family."]]],
["Why Sleep Matters","Health & Lifestyle","B1","Original learning text",
"Sleep is not simply a period of rest. It supports memory, concentration and emotional balance. When people regularly sleep too little, they may find it harder to focus, learn new information or manage stress. A consistent sleep schedule can help the body maintain its natural rhythm. Reducing screen use before bedtime and creating a calm sleeping environment may also be helpful. Individual needs vary, but good sleep habits are an important part of a healthy lifestyle.",
"Giấc ngủ không đơn thuần là khoảng thời gian nghỉ ngơi. Nó hỗ trợ trí nhớ, khả năng tập trung và sự cân bằng cảm xúc. Khi mọi người thường xuyên ngủ quá ít, họ có thể gặp khó khăn trong việc tập trung, tiếp thu thông tin mới hoặc kiểm soát căng thẳng. Lịch ngủ đều đặn có thể giúp cơ thể duy trì nhịp sinh học tự nhiên. Giảm sử dụng màn hình trước giờ đi ngủ và tạo môi trường ngủ yên tĩnh cũng có thể hữu ích. Nhu cầu của mỗi người khác nhau, nhưng thói quen ngủ tốt là một phần quan trọng của lối sống lành mạnh.",
[["concentration","/ˌkɒnsənˈtreɪʃən/","noun","sự tập trung"],["emotional balance","/ɪˈməʊʃənəl ˈbæləns/","phrase","sự cân bằng cảm xúc"],["consistent","/kənˈsɪstənt/","adjective","đều đặn, nhất quán"]],
[["Which ability does sleep support?",["Memory","Driving speed","Height","Hearing only"],0,"The text names memory, concentration and emotional balance."],["What may help improve sleep habits?",["Keeping a consistent schedule","Using screens all night","Changing bedtime every day","Drinking more coffee at night"],0,"A consistent sleep schedule supports the body's rhythm."]]],
["The Value of Public Transport","Environment & Society","B2","Original learning text",
"Public transport can make cities more accessible and reduce the number of private vehicles on the road. When buses and trains are reliable, affordable and well connected, people may choose them instead of driving. This can help reduce congestion and local air pollution. However, investment in vehicles alone is not enough. Cities also need safe stations, clear information, convenient routes and services that run frequently. Public transport works best when it is planned around the needs of different communities, including older people and passengers with disabilities.",
"Giao thông công cộng có thể giúp các thành phố dễ tiếp cận hơn và giảm số lượng phương tiện cá nhân trên đường. Khi xe buýt và tàu hỏa đáng tin cậy, có giá cả phải chăng và kết nối tốt, người dân có thể lựa chọn chúng thay vì tự lái xe. Điều này có thể giúp giảm ùn tắc và ô nhiễm không khí tại địa phương. Tuy nhiên, chỉ đầu tư vào phương tiện là chưa đủ. Các thành phố cũng cần nhà ga an toàn, thông tin rõ ràng, tuyến đường thuận tiện và dịch vụ hoạt động thường xuyên. Giao thông công cộng hiệu quả nhất khi được quy hoạch dựa trên nhu cầu của nhiều cộng đồng khác nhau, bao gồm người cao tuổi và hành khách khuyết tật.",
[["accessible","/əkˈsesəbəl/","adjective","dễ tiếp cận"],["congestion","/kənˈdʒestʃən/","noun","sự ùn tắc"],["frequently","/ˈfriːkwəntli/","adverb","thường xuyên"]],
[["What can reliable public transport encourage?",["People to use buses and trains","More private cars","Longer traffic jams","Less access to services"],0,"Reliable, affordable transport can encourage people to choose it over driving."],["What else do cities need besides vehicles?",["Safe stations and convenient routes","Only larger car parks","Fewer services","Unclear information"],0,"The text lists stations, information, routes and frequent services."]]],
["Digital Privacy for Young People","Digital Life","C1","Original learning text",
"Digital convenience often comes with a less visible cost: the collection and use of personal data. Apps may request access to location, contacts or browsing behaviour, sometimes for purposes that users do not fully understand. Privacy is therefore not merely a technical concern; it is also a matter of informed choice. Young people can strengthen their digital habits by reviewing permissions, using unique passwords and thinking carefully before sharing personal details. At the same time, platforms and regulators have a responsibility to make data practices transparent and provide meaningful control.",
"Sự tiện lợi kỹ thuật số thường đi kèm một cái giá ít dễ nhận thấy hơn: việc thu thập và sử dụng dữ liệu cá nhân. Các ứng dụng có thể yêu cầu quyền truy cập vị trí, danh bạ hoặc hành vi duyệt web, đôi khi vì những mục đích mà người dùng chưa hiểu đầy đủ. Vì vậy, quyền riêng tư không chỉ là vấn đề kỹ thuật mà còn là vấn đề về lựa chọn có hiểu biết. Người trẻ có thể củng cố thói quen số an toàn bằng cách xem lại quyền truy cập, sử dụng mật khẩu riêng biệt và suy nghĩ kỹ trước khi chia sẻ thông tin cá nhân. Đồng thời, các nền tảng và cơ quan quản lý có trách nhiệm làm minh bạch hoạt động dữ liệu và cung cấp quyền kiểm soát thực chất.",
[["permission","/pəˈmɪʃən/","noun","quyền cho phép"],["transparent","/trænsˈpærənt/","adjective","minh bạch"],["informed choice","/ɪnˈfɔːmd tʃɔɪs/","phrase","lựa chọn có hiểu biết"]],
[["Why is privacy described as more than a technical concern?",["It involves informed personal choice","It is only about devices","It has no social impact","It removes the need for apps"],0,"The passage connects privacy with informed choice and responsibility."],["What should platforms provide?",["Transparent practices and meaningful control","Unlimited data collection","Hidden settings","No user choices"],0,"The final sentence calls for transparency and meaningful control."]]]
];

function seed() {
  const count = db.prepare("SELECT COUNT(*) n FROM grammar_topics").get().n;
  if (!count) {
    const insert = db.prepare("INSERT INTO grammar_topics(level,title,category,description,sort_order) VALUES(?,?,?,?,?)");
    const tx = db.transaction(() => {
      let n=0;
      for (const level of Object.keys(grammar)) for (const [title,cat,desc] of grammar[level]) insert.run(level,title,cat,desc,++n);
    });
    tx();
  }
  if (!db.prepare("SELECT COUNT(*) n FROM readings").get().n) {
    const insert = db.prepare("INSERT INTO readings(title,topic,level,source_note,english_text,vietnamese_text,vocabulary_json,questions_json) VALUES(?,?,?,?,?,?,?,?)");
    const tx = db.transaction(() => readings.forEach(x=>insert.run(x[0],x[1],x[2],x[3],x[4],x[5],JSON.stringify(x[6]),JSON.stringify(x[7].map(q=>({question:q[0],options:q[1],answer_index:q[2],explanation_vi:q[3]}))))));
    tx();
  }
}
module.exports = { db, seed };
