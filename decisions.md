# Decision document

## 1. Scope of version one
**Decision:** Upload one PDF, select one of four roles, receive a role-specific score, found/missing skills, and exactly three fixes, with recent history.
**Options considered:** A broad job platform, resume builder, or a focused analyzer.
**Chosen:** Focused analyzer for entry-level developers.
**Why:** A narrow workflow is testable and useful as a first end-to-end product.
**Revisit when:** Users validate the core analysis and request another workflow.

## 2. Architecture
**Decision:** React + Vite talks to our own Express API; only the server calls the AI and MongoDB.
**Options considered:** Browser-to-AI calls or one function per route.
**Chosen:** A separate Express server deployed as its own Vercel project.
**Why:** Secrets stay server-side and validation, rate limits, cost controls, and logs have one home.
**Revisit when:** Traffic or independent scaling needs justify splitting services.

## 3. Reading the resume
**Decision:** Extract PDF text on the server with pdf-parse v2.
**Options considered:** Send the whole PDF directly to the model or use OCR.
**Chosen:** Extract text and reject scanned PDFs without extractable text.
**Why:** Text is easier to validate and cheaper to send; uploaded files are never persisted.
**Revisit when:** Scanned resumes are a proven user need and OCR can be added safely.

## 4. AI reliability and cost
**Decision:** Use Claude Haiku, validate the response with Zod, retry once at the application layer, and fall back to a transparent skill match.
**Options considered:** A larger model or trusting unvalidated output.
**Chosen:** A small model with schema checks, usage accounting, a daily cap, and fallback.
**Why:** The result shape is predictable and outages still provide useful, clearly labelled feedback.
**Revisit when:** Evaluation tests show another model materially improves results per rupee.

## 5. Data and hosting
**Decision:** Store result metadata and costs only in MongoDB Atlas; deploy client and server as separate Vercel projects.
**Options considered:** Store resumes, use a VPS/Render, or combine both project roots.
**Chosen:** No resume storage, Atlas persistence, and two Vercel projects from one repository.
**Why:** Avoid retaining sensitive resume content and keep frontend build variables separate from server secrets.
**Revisit when:** Authenticated accounts, retention requirements, or hosting economics demand a change.

## Cost sheet
Actual costs are calculated from token usage and the configured `USD_INR` rate. Each result records `costInr`; use server logs and Atlas records to report measured costs. Formula: `((inputTokens × input USD price) + (outputTokens × output USD price)) / 1,000,000 × USD_INR`. Estimated cost for three analyses per user is `average cost per request × 3`; for 1,000 users, multiply that by 1,000. These are estimates, not a provider invoice.

## Interview questions I can answer
**Why not call the AI from React?** I keep the API key on the server because browser code is public. The server also centralizes validation, rate limits, and spending checks.

**Why extract text from a PDF?** It lets me reject empty or oversized resumes before calling the model. The trade-off is that scanned PDFs need OCR, which this version does not include.

**How do you validate AI output?** I check the response against a Zod schema and retry once if it fails. If both attempts fail, I return a skill match without inventing a score.

**Why store results but not resumes?** Resume files contain personal information that is not required for history. I store only the analysis metadata and token costs needed by the product.

**How do you limit cost?** I calculate cost from reported token usage and store it in MongoDB. Before each AI call, the API sums today's spending in Sri Lanka time and checks the configured daily cap.
