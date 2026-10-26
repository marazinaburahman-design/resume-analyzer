import { Router } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { ROLES } from '../lib/roles.js';
import { readResume } from '../lib/readResume.js';
import { askGroq } from '../lib/askGroq.js';
import { fallbackAnalysis } from '../lib/fallbackAnalysis.js';
import { verdictFor } from '../lib/verdict.js';
import { costInr } from '../lib/cost.js';
import { spentTodayInr } from '../lib/spend.js';
import Result from '../models/Result.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
export const analyzeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  skipFailedRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Five analyses per 10 minutes. Please try again soon.' }
});

router.post('/analyze', requireAuth, analyzeLimiter, upload.single('resume'), async (req, res, next) => {
  const started = Date.now();
  try {
    const { targetRole } = req.body || {};
    const userId = req.user.id;

    if (!req.file || req.file.mimetype !== 'application/pdf' || !req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Upload your resume as a PDF.' });
    }
    if (!Object.hasOwn(ROLES, targetRole)) return res.status(400).json({ error: 'Pick a role from the list.' });

    let text;
    try { text = await readResume(req.file.buffer); }
    catch { return res.status(400).json({ error: 'This PDF could not be read. Try exporting it again.' }); }

    if (text.length < 100) return res.status(422).json({ error: 'We could not find any text in this PDF. Is it a scanned image?' });
    if (text.length > 20000) return res.status(413).json({ error: 'This resume is too long. Keep it to 3 pages.' });

    const cap = Number(process.env.DAILY_CAP_INR);
    const spent = await spentTodayInr();
    if (spent >= cap) {
      console.warn('[Cost] daily cap reached');
      return res.status(503).json({ error: "We've hit today's AI budget. Please try again tomorrow." });
    }

    let analysis, usage = { input_tokens: 0, output_tokens: 0 }, fallback = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await askGroq(text, targetRole);
        analysis = response.analysis;
        usage.input_tokens += response.usage?.input_tokens || 0;
        usage.output_tokens += response.usage?.output_tokens || 0;
        break;
      } catch (error) {
        usage.input_tokens += error.usage?.input_tokens || 0;
        usage.output_tokens += error.usage?.output_tokens || 0;
        console.error(`[AI] Groq attempt ${attempt} failed: ${error.message}`);
        if (attempt === 2) { analysis = fallbackAnalysis(text, targetRole); fallback = true; }
      }
    }

    if (!fallback) analysis.verdict = verdictFor(analysis.score);
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const cost = costInr({ inputTokens: usage.input_tokens, outputTokens: usage.output_tokens }, model);
    const saved = await Result.create({
      userId,
      targetRole,
      score: analysis.score,
      verdict: analysis.verdict,
      skillsFound: analysis.skillsFound,
      skillsMissing: analysis.skillsMissing,
      topFixes: analysis.topFixes.slice(0, 3),
      fallback,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costInr: cost
    });
    const total = await spentTodayInr();
    console.log(`[AI] Groq analysed ${text.length} chars for ${targetRole} in ${Date.now() - started} ms`);
    console.log(`[Cost] ₹${cost.toFixed(4)} for this request, ₹${total.toFixed(4)} today`);
    return res.json({
      targetRole, score: analysis.score, verdict: analysis.verdict,
      skillsFound: analysis.skillsFound, skillsMissing: analysis.skillsMissing,
      topFixes: analysis.topFixes.slice(0, 3), fallback, costInr: cost, id: saved._id
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
