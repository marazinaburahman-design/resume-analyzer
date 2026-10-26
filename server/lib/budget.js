import DailyBudget from '../models/DailyBudget.js';
import { costInr } from './cost.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_INPUT_TOKENS_PER_ATTEMPT = 20_000;
const MAX_OUTPUT_TOKENS_PER_ATTEMPT = 1_500;
const MAX_AI_ATTEMPTS = 2;

export function istDayKey(now = new Date()) {
  return new Date(now.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);
}

export function maximumRequestReservationInr(model) {
  return costInr({
    inputTokens: MAX_INPUT_TOKENS_PER_ATTEMPT * MAX_AI_ATTEMPTS,
    outputTokens: MAX_OUTPUT_TOKENS_PER_ATTEMPT * MAX_AI_ATTEMPTS
  }, model);
}

export async function reserveDailyBudget(capInr, amountInr, now = new Date()) {
  const dayKey = istDayKey(now);
  const expiresAt = new Date(now.getTime() + 3 * DAY_MS);

  try {
    await DailyBudget.updateOne(
      { dayKey },
      { $setOnInsert: { dayKey, reservedInr: 0, expiresAt } },
      { upsert: true }
    );
  } catch (error) {
    // A parallel request may have inserted today's document first.
    if (error?.code !== 11000) throw error;
  }

  const updated = await DailyBudget.findOneAndUpdate(
    {
      dayKey,
      $expr: { $lte: [{ $add: [{ $ifNull: ['$reservedInr', 0] }, amountInr] }, capInr] }
    },
    { $inc: { reservedInr: amountInr } },
    { new: true }
  ).lean();

  if (!updated) return null;
  return { dayKey, amountInr };
}

export async function settleDailyBudget(reservation, actualCostInr = 0) {
  if (!reservation) return;
  const actual = Math.max(0, Number(actualCostInr) || 0);
  const delta = actual - reservation.amountInr;
  await DailyBudget.updateOne(
    { dayKey: reservation.dayKey },
    { $inc: { reservedInr: delta } }
  );
}
