// src/modules/stress/routes/stress.routes.js
import express from 'express';
import { StressLog, StressDaily } from '../model/stress.model.js';
import { DateTime } from '../../../utils/luxon.js';
import winston from 'winston';
import { getStressLogs, getStressDaily } from '../../controller/stress.controller.js';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: 'error.log' })]
});

const router = express.Router();

// === GET ALL STRESS LOGS ===
router.get('/logs', getStressLogs);  // ← THIS WAS MISSING

// === GET DAILY AGGREGATES ===
router.get('/daily', getStressDaily);

// === POST NEW STRESS LOG ===
router.post('/log', async (req, res) => {
  try {
    const { user_id, level, tags = [], note = '' } = req.body;
    if (!user_id || !level || level < 1 || level > 5) {
      return res.status(400).json({ error: 'Invalid input: level 1–5 required' });
    }

    const log = new StressLog({ user_id, level, tags, note });
    await log.save();

    const dateLocal = DateTime.now().setZone('Asia/Manila').startOf('day').toJSDate();
    const endOfDay = DateTime.fromJSDate(dateLocal).endOf('day').toJSDate();
    const todayLogs = await StressLog.find({
      user_id,
      timestamp: { $gte: dateLocal, $lte: endOfDay }
    });

    if (todayLogs.length === 0) return res.status(400).json({ error: 'No logs today' });

    const avg_level = todayLogs.reduce((sum, l) => sum + l.level, 0) / todayLogs.length;
    const peak_level = Math.max(...todayLogs.map(l => l.level));
    const logs_count = todayLogs.length;

    await StressDaily.findOneAndUpdate(
      { user_id, date_local: dateLocal },
      { avg_level, peak_level, logs_count },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Stress logged', avg_level, peak_level, logs_count });
  } catch (err) {
    logger.error(`Log stress error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// === GET AGGREGATES (WEEKLY/MONTHLY) ===
router.get('/aggregates', async (req, res) => {
  try {
    const { user_id, period = 'daily' } = req.query;
    if (!user_id || !['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ error: 'Invalid user_id or period' });
    }

    const now = DateTime.now().setZone('Asia/Manila');
    let startDate;
    if (period === 'daily') startDate = now.startOf('day').toJSDate();
    else if (period === 'weekly') startDate = now.minus({ days: 7 }).startOf('day').toJSDate();
    else startDate = now.minus({ months: 1 }).startOf('day').toJSDate();

    const aggregates = await StressDaily.find({ user_id, date_local: { $gte: startDate } });
    const avg = aggregates.length ? aggregates.reduce((sum, d) => sum + d.avg_level, 0) / aggregates.length : null;
    const peak = aggregates.length ? Math.max(...aggregates.map(d => d.peak_level)) : null;
    const logs_count = aggregates.reduce((sum, d) => sum + d.logs_count, 0);
    const variance = aggregates.length ? aggregates.reduce((sum, d) => sum + Math.pow(d.avg_level - avg, 2), 0) / aggregates.length : 0;
    const std_dev = Math.sqrt(variance);

    const top_tags = await StressLog.aggregate([
      { $match: { user_id, timestamp: { $gte: startDate } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    res.json({ period, avg_level: avg, peak_level: peak, logs_count, std_dev, top_tags });
  } catch (err) {
    logger.error(`Aggregates error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;