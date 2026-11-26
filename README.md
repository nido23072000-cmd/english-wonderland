# English Wonderland — Full Edition

A cartoon-inspired English-learning web app with a real Express + SQLite backend.

## Included
- Account registration and sign-in (bcrypt password hashing, JWT sessions)
- Personal vocabulary dictionary with CRUD, AI enrichment, IPA fields, bilingual examples, synonyms, antonyms, collocations, word families, topics and review status
- 72 grammar topics across CEFR A1–C2, lesson generation and progress tracking
- Writing prompt generation, AI evaluation, corrections, rubric feedback and improved version
- Original bilingual reading library, vocabulary notes, comprehension quizzes, progress tracking and AI article generation
- Browser text-to-speech for English words and reading passages
- Responsive cartoon-inspired UI and dark mode

## Requirements
- Node.js 20+
- An OpenAI API key for AI-powered enrichment, lessons, writing feedback and generated readings

## Run locally
1. Extract the project.
2. Open a terminal in the project folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Set `JWT_SECRET` to a long random secret.
6. Add your `OPENAI_API_KEY` to `.env`.
7. Run `npm start`.
8. Open `http://localhost:3000`.

The SQLite database `wonderland.sqlite` is created automatically on first start.

## Important configuration
- `OPENAI_MODEL` defaults to `gpt-4.1-mini`; change it to a model available to your API account.
- `OPENAI_BASE_URL` defaults to the OpenAI API base URL. Keep the API key on the server; never put it in browser JavaScript.
- AI features return a clear configuration error when no key is set. Account, vocabulary storage, seeded grammar topics and seeded reading texts can still be explored without AI.

## Deploy
Deploy the Node app to a host that supports persistent disk storage. Configure the environment variables in the host dashboard. Ensure the SQLite file is stored on a persistent volume and configure HTTPS. For a multi-instance production deployment, replace SQLite with PostgreSQL and add rate limiting, email verification, password reset, backups, monitoring and automated tests.

## Content and copyright
Seeded reading passages are original learning texts. AI-generated readings should be original summaries or learning passages. For external news, podcasts, reality shows and music, add links and short lawful excerpts or summaries rather than copying full copyrighted articles, transcripts or song lyrics.

## Scope note
This is a runnable full-stack starter, not a hosted public website. You must configure the API key and deploy it to a hosting provider to make it available online. Review AI-generated educational content before relying on it for formal assessment.
