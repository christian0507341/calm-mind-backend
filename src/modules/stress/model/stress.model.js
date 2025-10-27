import mongoose from 'mongoose';

const stressLogSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 5 },
  tags: [{ type: String }], // Removed enum for custom tags
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});
stressLogSchema.index({ user_id: 1, timestamp: -1 });

const stressDailySchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  date_local: { type: Date, required: true },
  avg_level: { type: Number, required: true },
  peak_level: { type: Number, required: true },
  logs_count: { type: Number, required: true },
});
stressDailySchema.index({ user_id: 1, date_local: 1 });

export const StressLog = mongoose.model('StressLog', stressLogSchema);
export const StressDaily = mongoose.model('StressDaily', stressDailySchema);