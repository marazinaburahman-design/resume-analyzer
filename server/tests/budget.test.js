import test from 'node:test';
import assert from 'node:assert/strict';
import { istDayKey, maximumRequestReservationInr } from '../lib/budget.js';

test('IST day key follows the Sri Lanka calendar date', () => {
  assert.equal(istDayKey(new Date('2026-10-26T19:00:00.000Z')), '2026-10-27');
  assert.equal(istDayKey(new Date('2026-10-27T17:00:00.000Z')), '2026-10-27');
});

test('budget reservation covers two maximum-size model attempts', () => {
  const previousRate = process.env.USD_INR;
  process.env.USD_INR = '88';
  try {
    assert.equal(maximumRequestReservationInr('openai/gpt-oss-120b'), 0.6864);
  } finally {
    if (previousRate === undefined) delete process.env.USD_INR;
    else process.env.USD_INR = previousRate;
  }
});
