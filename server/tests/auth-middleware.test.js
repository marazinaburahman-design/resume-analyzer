import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/requireAuth.js';

const SECRET = 'test-only-secret-that-is-at-least-32-characters';
const USER_ID = '507f1f77bcf86cd799439011';

function invoke(token) {
  const req = { cookies: token ? { resume_token: token } : {} };
  const result = { statusCode: null, body: null, user: null, nextCalled: false };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; return this; }
  };
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = SECRET;
  try {
    requireAuth(req, res, () => { result.nextCalled = true; result.user = req.user; });
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
  return result;
}

function tokenFor(options = {}) {
  return jwt.sign({ sub: USER_ID }, SECRET, {
    expiresIn: '5m',
    issuer: 'resume-analyzer',
    audience: 'resume-analyzer-client',
    ...options
  });
}

test('rejects requests without a session cookie', () => {
  const result = invoke();
  assert.equal(result.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test('accepts a correctly signed session with the expected issuer and audience', () => {
  const result = invoke(tokenFor());
  assert.equal(result.nextCalled, true);
  assert.equal(result.user.id, USER_ID);
});

test('rejects a token signed for a different audience', () => {
  const result = invoke(tokenFor({ audience: 'another-application' }));
  assert.equal(result.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test('rejects a token with an invalid user identifier', () => {
  const result = invoke(jwt.sign({ sub: 'not-an-object-id' }, SECRET, {
    expiresIn: '5m',
    issuer: 'resume-analyzer',
    audience: 'resume-analyzer-client'
  }));
  assert.equal(result.statusCode, 401);
  assert.equal(result.nextCalled, false);
});
