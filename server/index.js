import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import analyzeRouter from './routes/analyze.js';
import resultsRouter from './routes/results.js';
import { errors } from './middleware/errors.js';
import { connectDb } from './db.js';
import { checkCostConfig } from './lib/cost.js';

const app = express();
app.set('trust proxy', 1);

// Keep production and local development origins available even if the Vercel
// CLIENT_ORIGIN setting is missing or contains only one of the deployed URLs.
const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
 .split(',')
 .map(value => value.trim())
 .filter(Boolean);
const allowedOrigins = new Set([
 ...configuredOrigins,
 'https://resume-analyzer-web-two.vercel.app',
 'https://resume-analyzer-web-abdur-rahman7.vercel.app',
 'http://localhost:5180',
 'http://localhost:5174'
]);
app.use(cors({
 origin(origin, callback) {
  if (!origin || allowedOrigins.has(origin)) return callback(null, true);
  console.warn('[CORS] Blocked origin:', origin);
  return callback(new Error('Origin not allowed by CORS'));
 }
}));
app.use(express.json({ limit: '32kb' }));

// Liveness: confirms the Vercel function can start without depending on Atlas.
app.get('/api/health', (_req, res) => {
 res.json({ ok: true, service: 'resume-analyzer-api', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Readiness: explicitly tests whether Atlas is reachable.
app.get('/api/ready', async (_req, res) => {
 try {
  await connectDb();
  return res.json({ ok: true, database: 'connected' });
 } catch {
  return res.status(503).json({ ok: false, database: 'unavailable' });
 }
});

// Database-backed API routes connect on demand so a database outage does not crash
// the entire serverless function (including the liveness endpoint).
app.use('/api', async (req, res, next) => {
 if (req.path === '/health' || req.path === '/ready') return next();
 try {
  await connectDb();
  return next();
 } catch {
  return res.status(503).json({ ok: false, error: 'Database unavailable. Please try again later.' });
 }
});

app.use('/api', analyzeRouter);
app.use('/api', resultsRouter);
app.use(errors);

checkCostConfig();
if (!process.env.VERCEL) {
 const port = Number(process.env.PORT) || 4000;
 app.listen(port, () => console.log(`[Server] listening on http://localhost:${port}`));
}
export default app;
