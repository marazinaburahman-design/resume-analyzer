import Result from '../models/Result.js';
export function todayStartIst() { const now = new Date(); const istNow = new Date(now.getTime() + 330 * 60 * 1000); const startIstAsUtc = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - 330 * 60 * 1000; return new Date(startIstAsUtc); }
export async function spentTodayInr() { const rows = await Result.aggregate([{ $match: { createdAt: { $gte: todayStartIst() } } }, { $group: { _id: null, total: { $sum: '$costInr' } } }]); return rows[0]?.total || 0; }
