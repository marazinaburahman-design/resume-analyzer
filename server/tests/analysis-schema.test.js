import test from 'node:test';
import assert from 'node:assert/strict';
import { AnalysisSchema } from '../lib/analysisSchema.js';
import { buildResumeMessages, PROMPT_VERSION } from '../lib/prompts/resumeAnalysisV1.js';

test('accepts a valid structured resume analysis', () => {
  const result = AnalysisSchema.safeParse({
    score: 82,
    skillsFound: ['JavaScript', 'React'],
    skillsMissing: ['Testing'],
    topFixes: ['Add measurable outcomes to recent project bullets.', 'Clarify the role you owned.', 'Include relevant testing examples.']
  });
  assert.equal(result.success, true);
});

test('rejects scores outside the supported range and wrong fix count', () => {
  assert.equal(AnalysisSchema.safeParse({
    score: 120,
    skillsFound: [],
    skillsMissing: [],
    topFixes: ['One', 'Two', 'Three']
  }).success, false);

  assert.equal(AnalysisSchema.safeParse({
    score: 70,
    skillsFound: [],
    skillsMissing: [],
    topFixes: ['Only one fix']
  }).success, false);
});

test('builds a versioned prompt for a supported role', () => {
  const messages = buildResumeMessages('Resume sample text', 'Full-stack developer');
  assert.equal(PROMPT_VERSION, 'resume-analysis-v1');
  assert.equal(messages.length, 2);
  assert.match(messages[0].content, /untrusted data/i);
  assert.match(messages[1].content, /Resume sample text/);
});

test('rejects unsupported target roles before calling the provider', () => {
  assert.throws(() => buildResumeMessages('Resume sample text', 'CEO'));
});
