import mongoose from 'mongoose';

const rateLimitCounterSchema = new mongoose.Schema({
  _id: { type: String },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true }
}, { versionKey: false });

rateLimitCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RateLimitCounter', rateLimitCounterSchema);
