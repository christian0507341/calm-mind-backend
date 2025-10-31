// src/modules/coach/routes/coach.routes.js
import express from 'express';
import { StressLog, StressDaily } from '../../stress/model/stress.model.js';
import { getCoachContext, chatWithCoach } from '../../controller/coach.controller.js'; // Correct path
import { DateTime } from 'luxon';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: 'error.log' })],
});

const router = express.Router();

// === POST: Log manual stress entry ===
router.post('/log', async (req, res) => {
  try {
    const { user_id, level, tags = [], note = '' } = req.body;
    if (!user_id || !level || level < 1 || level > 5) {
      return res.status(400).json({ error: 'user_id and level (1–5) required' });
    }

    const now = DateTime.now().setZone('Asia/Manila');
    const log = new StressLog({
      user_id,
      level,
      tags,
      note,
      timestamp: now.toJSDate(),
    });
    await log.save();

    const today = now.startOf('day').toJSDate();
    const todayLogs = await StressLog.find({
      user_id,
      timestamp: { $gte: today },
    });

    const avg_level = todayLogs.reduce((sum, l) => sum + l.level, 0) / todayLogs.length;
    const peak_level = Math.max(...todayLogs.map(l => l.level));
    const logs_count = todayLogs.length;

    await StressDaily.findOneAndUpdate(
      { user_id, date_local: today },
      { avg_level, peak_level, logs_count },
      { upsert: true, new: true }
    );

    res.json({ success: true, log, avg_level, peak_level, logs_count });
  } catch (err) {
    logger.error(`Stress log error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// === GET: Context for LLM (stress + workload) ===
router.get('/context', getCoachContext);

// === POST: Chat with Coach Alex ===
router.post('/chat', chatWithCoach);

export default router;