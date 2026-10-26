import test from 'node:test';
import assert from 'node:assert/strict';
import { requireTrustedOrigin } from '../middleware/requireTrustedOrigin.js';

function runOrigin(origin) {
  const req = { get: name => name === 'origin' ? origin : undefined };
  const result = { statusCode: 200, body: null, nextCalled: false };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; }
  };
  requireTrustedOrigin(req, res, () => { result.nextCalled = true; });
  return result;
}

test('allows the configured production frontend origin', () => {
  assert.equal(runOrigin('https://resume-analyzer-web-two.vercel.app').nextCalled, true);
});

test('rejects an untrusted browser origin', () => {
  const result = runOrigin('https://attacker.example');
  assert.equal(result.statusCode, 403);
  assert.equal(result.nextCalled, false);
});

test('allows non-browser clients without an Origin header', () => {
  assert.equal(runOrigin(undefined).nextCalled, true);
});
