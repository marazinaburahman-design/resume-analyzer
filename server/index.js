import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import analyzeRouter from './routes/analyze.js';
import resultsRouter from './routes/results.js';
import authRouter from './routes/auth.js';
import { errors } from './middleware/errors.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { connectDb } from './db.js';
import { checkCostConfig } from './lib/cost.js';
import { checkAIProviderConfig } from './lib/aiProvider.js';

const app = express();
app.set('trust proxy', 1);
app.use(securityHeaders);

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  'https://resume-analyzer-web-two.vercel.app',
  'https://resume-analyzer-web-abdur-rahman7.vercel.app',
  ...(isProduction ? [] : ['http://localhost:5180', 'http://localhost:5174'])
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    console.warn('[CORS] Blocked origin:', origin);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'resume-analyzer-api',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/ready', async (_req, res) => {
  try {
    await connectDb();
    return res.json({ ok: true, database: 'connected' });
  } catch {
    return res.status(503).json({ ok: false, database: 'unavailable' });
  }
});

app.use('/api', async (req, res, next) => {
  if (req.path === '/health' || req.path === '/ready') return next();
  try {
    await connectDb();
    return next();
  } catch {
    return res.status(503).json({ ok: false, error: 'Database unavailable. Please try again later.' });
  }
});

app.use('/api', authRouter);
app.use('/api', analyzeRouter);
app.use('/api', resultsRouter);
app.use(errors);

checkCostConfig();
checkAIProviderConfig();
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`[Server] listening on http://localhost:${port}`));
}

export default app;
