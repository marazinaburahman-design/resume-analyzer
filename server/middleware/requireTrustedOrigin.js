const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

const allowedOrigins = new Set([
  ...configuredOrigins,
  'https://resume-analyzer-web-two.vercel.app',
  'https://resume-analyzer-web-abdur-rahman7.vercel.app',
  ...(isProduction ? [] : ['http://localhost:5180', 'http://localhost:5174'])
]);

// CORS alone does not stop every kind of cross-site request. Validate Origin on
// state-changing cookie-auth requests; localhost is allowed only in development.
export function requireTrustedOrigin(req, res, next) {
  const origin = req.get('origin');
  if (!origin) return next(); // Non-browser clients such as Postman may omit Origin.
  if (!allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'This request origin is not allowed.' });
  }
  return next();
}
