export const PRICES_USD_PER_MILLION = {
  'openai/gpt-oss-120b': { input: 0.15, output: 0.60 },
  'openai/gpt-oss-20b': { input: 0.075, output: 0.30 }
};
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const RETIRED_MODEL = 'llama-3.3-70b-versatile';
function effectiveModel(model) {
  return !model || model === RETIRED_MODEL ? DEFAULT_MODEL : model;
}
export function costInr({ inputTokens = 0, outputTokens = 0 }, model = process.env.GROQ_MODEL || DEFAULT_MODEL) {
  const selectedModel = effectiveModel(model);
  const price = PRICES_USD_PER_MILLION[selectedModel];
  if (!price) throw new Error('No price configuration for Groq model ' + selectedModel);
  const rate = Number(process.env.USD_INR);
  return Math.round(((inputTokens * price.input + outputTokens * price.output) / 1000000 * rate) * 10000) / 10000;
}
export function checkCostConfig() {
  const model = effectiveModel(process.env.GROQ_MODEL || DEFAULT_MODEL);
  if (!PRICES_USD_PER_MILLION[model]) throw new Error('[Cost] No price configured for GROQ_MODEL=' + model);
  for (const key of ['USD_INR','DAILY_CAP_INR']) {
    if (process.env[key] === undefined || process.env[key].trim() === '' || !Number.isFinite(Number(process.env[key])) || Number(process.env[key]) < 0) throw new Error('[Cost] ' + key + ' must be a non-negative number');
  }
}
