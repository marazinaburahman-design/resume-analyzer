import { Router } from 'express';
import mongoose from 'mongoose';
import Result from '../models/Result.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/results', requireAuth, async (req, res, next) => {
  try {
    const results = await Result.find({ userId: req.user.id })
      .select('targetRole score verdict skillsFound skillsMissing topFixes fallback costInr createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    return res.json({ results });
  } catch (error) {
    return next(error);
  }
});

router.delete('/results/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid result ID.' });
    }
    const deleted = await Result.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Review not found.' });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
