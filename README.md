# Resume Analyzer

An AI-assisted resume analyzer for entry-level developers. Upload a PDF, choose a target role, get role-specific feedback, and review past analyses. The application stores analysis metadata and costs in MongoDB Atlas; it never stores the PDF or extracted resume text.

## Stack
- Client: React 19, Vite, Tailwind CSS v4
- Server: Node.js 20+, Express 5, PDF Parse v2, Zod
- Database: MongoDB Atlas + Mongoose
- AI: Groq chat-completions API through a provider adapter (server-side only)
- Hosting: Vercel (separate `client` and `server` projects)

## Requirements
Node.js 20+ and a MongoDB Atlas connection string. A Groq API key enables AI scoring; if the AI is unavailable, the app returns a clearly labelled local skill-match fallback.

## Run locally
1. Copy `server/.env.example` to `server/.env` and fill in your credentials. Generate a private random `JWT_SECRET` of at least 32 characters.
2. In MongoDB Atlas, allow your development IP and create a database user.
3. In a terminal: `cd server && npm install && npm run dev`.
4. In another terminal: `cd client && npm install && npm run dev`.
5. Open `http://localhost:5180`. The Vite proxy forwards `/api` to port 4000.

## Vercel deployment
Create two Vercel projects from this same repository. Set the backend root directory to `server` and frontend root directory to `client`. Add backend variables listed in `server/.env.example`; set `CLIENT_ORIGIN` to the deployed frontend URL. Add `VITE_API_URL` to the frontend project with the backend URL (no trailing slash). Redeploy after changing environment variables.

## Privacy and safeguards
- PDF uploads are held in memory and are not written to disk.
- The database stores role, score, skills, fixes, fallback status, AI provider/model, prompt version, token counts, cost, and timestamps only.
- File size is capped at 4 MB; extracted text is capped at 20,000 characters.
- Analysis and sign-in rate limits use MongoDB counters shared across serverless instances.
- Daily AI spending is reserved atomically before provider calls to reduce concurrent overspend.
- Account history is protected by a verified JWT session stored in an HttpOnly cookie. Users can only read or delete their own reviews.
- Prompt instructions explicitly treat resume text as untrusted data. Structured AI output is validated with Zod.

See `decisions.md` for architecture choices and trade-offs.
