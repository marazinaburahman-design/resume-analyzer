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

// CORS alone does not stop a browser from sending every kind of cross-site
// request. Validate the Origin header before state-changing cookie-auth requests.
export function requireTrustedOrigin(req, res, next) {
  const origin = req.get('origin');
  if (!origin) return next(); // Non-browser clients such as Postman may omit Origin.
  if (!allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'This request origin is not allowed.' });
  }
  return next();
}
