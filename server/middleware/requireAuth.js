import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const COOKIE_NAME = 'resume_token';
const TOKEN_ISSUER = 'resume-analyzer';
const TOKEN_AUDIENCE = 'resume-analyzer-client';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: 'Authentication is not configured on the server yet.' });
  }

  try {
    const payload = jwt.verify(token, secret, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ['HS256']
    });
    if (typeof payload.sub !== 'string' || !mongoose.isValidObjectId(payload.sub)) {
      return res.status(401).json({ error: 'Your session is invalid. Please sign in again.' });
    }
    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}
