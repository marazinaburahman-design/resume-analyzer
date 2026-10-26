import { AnalysisSchema } from './analysisSchema.js';
import { buildResumeMessages, PROMPT_VERSION } from './prompts/resumeAnalysisV1.js';

const RETIRED_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const configuredModel = process.env.GROQ_MODEL;
const MODEL = !configuredModel || configuredModel === RETIRED_MODEL ? DEFAULT_MODEL : configuredModel;

export async function askGroq(text, targetRole) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: buildResumeMessages(text, targetRole)
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error?.message || `Groq API request failed (${response.status})`);
      error.usage = data.usage;
      throw error;
    }

    const usage = data.usage || {};
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content) {
      const error = new Error('Groq response contained no JSON content');
      error.usage = usage;
      throw error;
    }

    let parsed;
    try {
      parsed = AnalysisSchema.safeParse(JSON.parse(content));
    } catch {
      const error = new Error('Groq response was not valid JSON');
      error.usage = usage;
      throw error;
    }
    if (!parsed.success) {
      const error = new Error(`Groq response schema failed: ${parsed.error.issues[0]?.message}`);
      error.usage = usage;
      throw error;
    }

    parsed.data.score = Math.round(Math.min(100, Math.max(0, parsed.data.score)));
    return {
      analysis: parsed.data,
      usage: {
        input_tokens: usage.prompt_tokens || 0,
        output_tokens: usage.completion_tokens || 0
      },
      model: MODEL,
      promptVersion: PROMPT_VERSION
    };
  } finally {
    clearTimeout(timeout);
  }
}
