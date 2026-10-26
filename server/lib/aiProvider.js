import { askGroq } from './askGroq.js';

const PROVIDERS = Object.freeze({
  groq: askGroq
});

export function configuredAIProvider() {
  return (process.env.AI_PROVIDER || 'groq').trim().toLowerCase();
}

export function checkAIProviderConfig() {
  const provider = configuredAIProvider();
  if (!Object.hasOwn(PROVIDERS, provider)) {
    throw new Error(`[AI] Unsupported AI_PROVIDER="${provider}". Supported providers: ${Object.keys(PROVIDERS).join(', ')}`);
  }
}

export async function analyzeWithAI(text, targetRole) {
  const provider = configuredAIProvider();
  const adapter = PROVIDERS[provider];
  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  const result = await adapter(text, targetRole);
  return {
    ...result,
    provider,
    model: result.model,
    promptVersion: result.promptVersion
  };
}
