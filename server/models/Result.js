import mongoose from 'mongoose';
const resultSchema = new mongoose.Schema({ userId: { type: String, required: true, index: true }, targetRole: { type: String, required: true }, score: { type: Number, default: null }, verdict: String, skillsFound: [String], skillsMissing: [String], topFixes: [String], fallback: { type: Boolean, default: false }, inputTokens: { type: Number, default: 0 }, outputTokens: { type: Number, default: 0 }, costInr: { type: Number, default: 0 } }, { timestamps: true });
resultSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.model('Result', resultSchema);
