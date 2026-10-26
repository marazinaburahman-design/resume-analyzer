import { Router } from 'express';
import multer from 'multer';
import { ROLES } from '../lib/roles.js';
import { readResume } from '../lib/readResume.js';
import { analyzeWithAI, configuredAIProvider, configuredAIModel } from '../lib/aiProvider.js';
import { fallbackAnalysis } from '../lib/fallbackAnalysis.js';
import { verdictFor } from '../lib/verdict.js';
import { costInr } from '../lib/cost.js';
import { spentTodayInr } from '../lib/spend.js';
import { maximumRequestReservationInr, reserveDailyBudget, settleDailyBudget } from '../lib/budget.js';
import Result from '../models/Result.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTrustedOrigin } from '../middleware/requireTrustedOrigin.js';
import { mongoRateLimit } from '../middleware/mongoRateLimit.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
const analyzeLimiter = mongoRateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  keyPrefix: 'analysis',
  keyGenerator: req => req.user?.id,
  message: 'Five analyses per 10 minutes. Please try again soon.'
});

router.post('/analyze', requireTrustedOrigin, requireAuth, analyzeLimiter, upload.single('resume'), async (req, res, next) => {
  const started = Date.now();
  let reservation = null;
  let reservationSettled = false;
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
    const provider = configuredAIProvider();
    let model = configuredAIModel();
    const reservationAmount = maximumRequestReservationInr(model);
    reservation = await reserveDailyBudget(cap, reservationAmount);
    if (!reservation) {
      console.warn('[Cost] daily budget cap reached or reserved by concurrent requests');
      return res.status(503).json({ error: "We've hit today's AI budget. Please try again tomorrow." });
    }

    let analysis, usage = { input_tokens: 0, output_tokens: 0 }, fallback = false;
    let promptVersion = 'resume-analysis-v1';
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await analyzeWithAI(text, targetRole);
        analysis = response.analysis;
        usage.input_tokens += response.usage?.input_tokens || 0;
        usage.output_tokens += response.usage?.output_tokens || 0;
        model = response.model || model;
        promptVersion = response.promptVersion || promptVersion;
        break;
      } catch (error) {
        usage.input_tokens += error.usage?.input_tokens || 0;
        usage.output_tokens += error.usage?.output_tokens || 0;
        console.error(`[AI] ${provider} attempt ${attempt} failed: ${error.message}`);
        if (attempt === 2) { analysis = fallbackAnalysis(text, targetRole); fallback = true; }
      }
    }

    if (!fallback) analysis.verdict = verdictFor(analysis.score);
    const cost = costInr({ inputTokens: usage.input_tokens, outputTokens: usage.output_tokens }, model);
    await settleDailyBudget(reservation, cost);
    reservationSettled = true;

    const saved = await Result.create({
      userId,
      targetRole,
      score: analysis.score,
      verdict: analysis.verdict,
      skillsFound: analysis.skillsFound,
      skillsMissing: analysis.skillsMissing,
      topFixes: analysis.topFixes.slice(0, 3),
      fallback,
      aiProvider: provider,
      aiModel: model,
      promptVersion,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costInr: cost
    });
    const total = await spentTodayInr();
    console.log(`[AI] ${provider} analysed ${text.length} chars for ${targetRole} in ${Date.now() - started} ms (model ${model}; prompt ${promptVersion})`);
    console.log(`[Cost] ₹${cost.toFixed(4)} for this request, ₹${total.toFixed(4)} today`);
    return res.json({
      targetRole, score: analysis.score, verdict: analysis.verdict,
      skillsFound: analysis.skillsFound, skillsMissing: analysis.skillsMissing,
      topFixes: analysis.topFixes.slice(0, 3), fallback, costInr: cost, id: saved._id
    });
  } catch (error) {
    return next(error);
  } finally {
    if (reservation && !reservationSettled) {
      try { await settleDailyBudget(reservation, 0); }
      catch (error) { console.error('[Cost] Failed to release budget reservation:', error?.message || 'unknown error'); }
    }
  }
});

export default router;
