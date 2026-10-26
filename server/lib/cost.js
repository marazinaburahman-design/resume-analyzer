export const PRICES_USD_PER_MILLION = {
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 }
};
export function costInr({ inputTokens = 0, outputTokens = 0 }, model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile') {
  const price = PRICES_USD_PER_MILLION[model];
  if (!price) throw new Error(`No price configuration for Groq model ${model}`);
  const rate = Number(process.env.USD_INR);
  return Math.round(((inputTokens * price.input + outputTokens * price.output) / 1_000_000 * rate) * 10000) / 10000;
}
export function checkCostConfig() {
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  if (!PRICES_USD_PER_MILLION[model]) throw new Error(`[Cost] No price configured for GROQ_MODEL=${model}`);
  for (const key of ['USD_INR','DAILY_CAP_INR']) if (process.env[key] === undefined || process.env[key].trim() === '' || !Number.isFinite(Number(process.env[key])) || Number(process.env[key]) < 0) throw new Error(`[Cost] ${key} must be a non-negative number`);
}
