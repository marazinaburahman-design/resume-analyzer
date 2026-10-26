import { Router } from 'express';
import { validate as isUuid } from 'uuid';
import Result from '../models/Result.js';
const router = Router();
router.get('/results', async (req, res, next) => { try { const userId = req.query.userId; if (!isUuid(typeof userId === 'string' ? userId : '')) return res.status(400).json({ error: 'Missing or invalid userId.' }); const results = await Result.find({ userId }).select('targetRole score verdict skillsFound skillsMissing topFixes fallback costInr createdAt').sort({ createdAt: -1 }).limit(10).lean(); res.json({ results }); } catch (error) { next(error); } });
export default router;
