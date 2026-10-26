# Decision document

## 1. Scope of version one
**Decision:** Upload one PDF, select one of four roles, receive a role-specific score, found/missing skills, exactly three fixes, and recent history.
**Options considered:** A broad job platform, resume builder, or a focused analyzer.
**Chosen:** Focused analyzer for entry-level developers.
**Why:** A narrow workflow is testable and useful as a first end-to-end product.
**Revisit when:** Users validate the core analysis and request another workflow.

## 2. Architecture and identity
**Decision:** React + Vite talks to an Express API; only the server calls the AI provider and MongoDB.
**Options considered:** Browser-to-AI calls or one function per route.
**Chosen:** A separate Express server deployed as its own Vercel project, with account registration/login and JWT sessions in HttpOnly cookies.
**Why:** Secrets stay server-side, and the backend owns identity, validation, history permissions, rate limits, and cost controls.
**Revisit when:** Traffic or independent scaling needs justify splitting services or moving sessions to a dedicated identity provider.

## 3. Reading the resume
**Decision:** Extract PDF text on the server with pdf-parse v2.
**Options considered:** Send the whole PDF directly to the model or use OCR.
**Chosen:** Validate the PDF signature, cap file size and multipart fields, extract text, and reject scanned PDFs without extractable text.
**Why:** Text is easier to validate and cheaper to send; uploaded files are never persisted.
**Revisit when:** Scanned resumes are a proven user need and OCR can be added safely.

## 4. AI provider and prompt
**Decision:** Call an AI provider through a server-side adapter registry; Groq is the currently supported adapter.
**Options considered:** Hard-wire provider calls into the route or call AI from the browser.
**Chosen:** Keep provider-specific HTTP details in the adapter and version prompts separately (resume-analysis-v1).
**Why:** A new provider can be added without changing route-level request handling, while historical results retain provider/model/prompt metadata.
**Revisit when:** Another provider is implemented and evaluated against the same output contract.

## 5. AI reliability and cost
**Decision:** Validate model output with Zod, retry once, and use a transparent local skill-match fallback if both attempts fail.
**Options considered:** Trusting unvalidated output or returning an error for every provider failure.
**Chosen:** A structured output contract, a 30-second provider timeout, token accounting, a daily spending ledger, and atomic budget reservations.
**Why:** Results stay predictable, failures still provide useful feedback, and concurrent serverless requests are less likely to overspend.
**Revisit when:** Evaluation results or provider pricing justify changing the model or reservation ceiling.

## 6. Rate limits and data
**Decision:** Store analysis metadata and costs only in MongoDB Atlas; use MongoDB-backed rate-limit counters shared across serverless instances.
**Options considered:** Per-process counters, retaining resume files, or relying only on browser-generated identifiers.
**Chosen:** Authenticated per-user history, owner-scoped reads/deletes, hashed identifiers for rate-limit keys, and no persistent resume storage.
**Why:** User identity is verified by the server, and the database stores only information needed for history and cost reporting.
**Revisit when:** Retention requirements, data export/deletion needs, or hosting economics demand a change.

## 7. Hosting
**Decision:** Deploy client and server as separate Vercel projects from one repository.
**Why:** Frontend build variables remain separate from backend secrets, and each layer can deploy independently.

## Cost sheet
Actual costs are calculated from provider-reported token usage and the configured USD_INR rate. Each result records costInr, provider, model, prompt version, and token counts. The daily ledger reserves a conservative maximum for two model attempts before the provider is called, then settles the reservation to actual usage. Formula: ((inputTokens × input USD price) + (outputTokens × output USD price)) / 1,000,000 × USD_INR. Estimated cost for three analyses per user is average cost per request × 3; for 1,000 users, multiply that by 1,000. These are estimates, not a provider invoice.

## Interview questions I can answer
**Why not call the AI from React?** The API key stays on the server because browser code is public. The server centralizes validation, rate limits, and spending checks.

**How is user history protected?** The API verifies a JWT from an HttpOnly cookie and derives the owner ID from the token. History reads and deletes are scoped to that authenticated ID.

**Why extract text from a PDF?** It lets the API validate file signatures and reject empty or oversized resumes before calling the model. The trade-off is that scanned PDFs need OCR, which this version does not include.

**How do you validate AI output?** A Zod schema checks the score, skills, and exactly three fixes. The route retries once if the provider fails and falls back to local skill matching if needed.

**How do you limit cost?** The API estimates a conservative maximum for two attempts, reserves that amount atomically in MongoDB before calling AI, then settles to the actual token cost. This is safer under concurrent serverless requests than a read-then-write sum.
