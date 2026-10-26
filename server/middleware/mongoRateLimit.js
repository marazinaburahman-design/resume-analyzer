import { createHash } from 'node:crypto';
import RateLimitCounter from '../models/RateLimitCounter.js';

export function mongoRateLimit({ windowMs, limit, keyPrefix, keyGenerator, message }) {
  return async function mongoRateLimitMiddleware(req, res, next) {
    const identity = keyGenerator(req);
    if (!identity) return res.status(401).json({ error: 'Unable to identify this request.' });

    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const rawKey = `${keyPrefix}:${identity}:${windowStart}`;
    const key = createHash('sha256').update(rawKey).digest('hex');
    const expiresAt = new Date(windowStart + windowMs * 2);

    try {
      let counter;
      try {
        counter = await RateLimitCounter.findOneAndUpdate(
          { _id: key },
          { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
      } catch (error) {
        // Simultaneous first requests can race to upsert the same unique _id.
        if (error?.code !== 11000) throw error;
        counter = await RateLimitCounter.findOneAndUpdate(
          { _id: key },
          { $inc: { count: 1 } },
          { new: true }
        ).lean();
      }

      if (!counter) throw new Error('Rate-limit counter could not be updated');
      if (counter.count > limit) {
        const retryAfter = Math.max(1, Math.ceil((windowStart + windowMs - Date.now()) / 1000));
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({ error: message });
      }
      return next();
    } catch (error) {
      console.error('[Security] Distributed rate limiter unavailable:', error?.message || 'unknown error');
      return res.status(503).json({ error: 'Security checks are temporarily unavailable. Please try again shortly.' });
    }
  };
}
