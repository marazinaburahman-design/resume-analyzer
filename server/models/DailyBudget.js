import mongoose from 'mongoose';

const dailyBudgetSchema = new mongoose.Schema({
  dayKey: { type: String, required: true, unique: true },
  reservedInr: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

dailyBudgetSchema.index({ dayKey: 1 }, { unique: true });
dailyBudgetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('DailyBudget', dailyBudgetSchema);
