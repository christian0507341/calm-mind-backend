import mongoose from 'mongoose';

const stressLogSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 5 },
  tags: [{ type: String, enum: ['Workload', 'Deadline', 'Group', 'Personal'] }],
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const stressDailySchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  date_local: { type: Date, required: true },
  avg_level: { type: Number, required: true },
  peak_level: { type: Number, required: true },
  logs_count: { type: Number, required: true }
});

export const StressLog = mongoose.model('StressLog', stressLogSchema);
export const StressDaily = mongoose.model('StressDaily', stressDailySchema);