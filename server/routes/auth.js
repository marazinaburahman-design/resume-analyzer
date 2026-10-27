import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTrustedOrigin } from '../middleware/requireTrustedOrigin.js';
import { mongoRateLimit } from '../middleware/mongoRateLimit.js';

const router = Router();
const COOKIE_NAME = 'resume_token';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const authLimiter = mongoRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyPrefix: 'auth',
  keyGenerator: req => req.ip || 'unknown-ip',
  message: 'Too many sign-in attempts. Please wait 15 minutes and try again.'
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72)
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72)
});

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    const error = new Error('JWT_SECRET must be configured with at least 32 characters.');
    error.status = 503;
    throw error;
  }
  return secret;
}

function cookieOptions() {
  const production = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    partitioned: production,
    path: '/',
    maxAge: SESSION_MS
  };
}

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email };
}

function setSession(res, user) {
  const token = jwt.sign({ sub: String(user._id) }, getJwtSecret(), {
    expiresIn: '7d',
    issuer: 'resume-analyzer',
    audience: 'resume-analyzer-client'
  });
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

router.post('/auth/register', requireTrustedOrigin, authLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Enter a name, a valid email, and a password of at least 8 characters.' });
    }
    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase();
    const existing = await User.exists({ email });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json({ message: 'Account created. Please sign in.' });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
    return next(error);
  }
});

router.post('/auth/login', requireTrustedOrigin, authLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' });

    const email = parsed.data.email.toLowerCase();
    const user = await User.findOne({ email }).select('+passwordHash');
    const matches = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
    if (!matches) return res.status(401).json({ error: 'Email or password is incorrect.' });

    setSession(res, user);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/auth/logout', requireTrustedOrigin, (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  return res.json({ ok: true });
});

router.get('/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('name email');
    if (!user) {
      res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
      return res.status(401).json({ error: 'Account not found. Please sign in again.' });
    }
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

export default router;
