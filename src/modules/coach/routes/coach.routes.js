import express from 'express';
import { StressLog, StressDaily } from '../../stress/model/stress.model.js';
import Task from '../../tasks/model/tasks.model.js';
import { getCoachResponse } from '../../../llm/llmService.js'; // Updated import path
import { DateTime } from 'luxon';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: 'error.log' })],
});

const router = express.Router();

// Save stress log and update daily aggregates
router.post('/log', async (req, res) => {
  try {
    const { user_id, level, tags, note } = req.body;
    if (!user_id || !level) return res.status(400).json({ error: 'user_id and level required' });

    const now = DateTime.now().setZone('Asia/Manila');
    const log = new StressLog({ user_id, level, tags, note, timestamp: now.toJSDate() });
    await log.save();

    const today = now.startOf('day').toJSDate();
    const todayLogs = await StressLog.find({ user_id, timestamp: { $gte: today } });
    const avg_level = todayLogs.reduce((sum, l) => sum + l.level, 0) / todayLogs.length;
    const peak_level = Math.max(...todayLogs.map((l) => l.level));
    const logs_count = todayLogs.length;

    await StressDaily.findOneAndUpdate(
      { user_id, date_local: today },
      { avg_level, peak_level, logs_count },
      { upsert: true }
    );

    res.json({ success: true, log });
  } catch (err) {
    logger.error(`Log error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get context data
router.get('/context', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const now = DateTime.now().setZone('Asia/Manila');
    const today = now.startOf('day').toJSDate();
    const weekAgo = now.minus({ days: 7 }).startOf('day').toJSDate();
    const twoWeeksAgo = now.minus({ days: 14 }).startOf('day').toJSDate();

    const lastLog = await StressLog.findOne({ user_id }).sort({ timestamp: -1 });
    const todayDaily = await StressDaily.findOne({ user_id, date_local: today });
    const weekLogs = await StressDaily.find({ user_id, date_local: { $gte: weekAgo, $lte: today } });
    const prevWeekLogs = await StressDaily.find({
      user_id,
      date_local: { $gte: twoWeeksAgo, $lt: weekAgo },
    });

    const today_avg = todayDaily?.avg_level || 3.0;
    const week_avg = weekLogs.length
      ? weekLogs.reduce((sum, d) => sum + d.avg_level, 0) / weekLogs.length
      : 2.7;
    const prev_week_avg = prevWeekLogs.length
      ? prevWeekLogs.reduce((sum, d) => sum + d.avg_level, 0) / prevWeekLogs.length
      : null;
    const trend =
      week_avg && prev_week_avg
        ? week_avg - prev_week_avg > 0.5
          ? 'up'
          : week_avg - prev_week_avg < -0.5
          ? 'down'
          : 'flat'
        : 'flat';

    const top_tags = await StressLog.aggregate([
      { $match: { user_id, timestamp: { $gte: weekAgo } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]).then((tags) => tags.map((t) => t._id));

    const tasks = await Task.find({ user_id });
    const due_48h_count = tasks.filter((t) => {
      const due = DateTime.fromJSDate(new Date(t.due_date));
      return due > now && due < now.plus({ hours: 48 });
    }).length;
    const overdue_count = tasks.filter((t) => t.status === 'Overdue').length;
    const next_deadlines = tasks
      .filter((t) => DateTime.fromJSDate(new Date(t.due_date)) > now)
      .map((t) => t.due_date.toISOString().split('T')[0])
      .slice(0, 3);
    const tasks_completed_today = tasks.filter(
      (t) => t.status === 'Completed' && DateTime.fromJSDate(new Date(t.created_at)).hasSame(now, 'day')
    ).length;
    const reschedules = tasks.filter((t) => t.due_date !== t.created_at).length;

    res.json({
      student: { year_level: 'Sophomore', timezone: 'Asia/Manila' },
      now: now.toISO(),
      stress: { last_level: lastLog?.level || 3, today_avg, week_avg, trend, top_tags },
      workload: { due_48h_count, overdue_count, next_deadlines },
      recent_actions: { tasks_completed_today, reschedules },
    });
  } catch (err) {
    logger.error(`Context error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat route
router.post('/chat', async (req, res) => {
  try {
    const { user_id, message, stress, workload } = req.body;
    if (!user_id || !message) return res.status(400).json({ error: 'user_id and message required' });

    const contextRes = await fetch(
      `http://localhost:${process.env.PORT || 4000}/api/coach/context?user_id=${user_id}`,
      { headers: { Authorization: req.headers.authorization } }
    );
    const context = await contextRes.json();

    const { response, stress_band, tone, steps, buttons } = await getCoachResponse(
      { ...context, stress: stress || context.stress, workload: workload || context.workload },
      message
    );

    let finalResponse = response;
    if (stress_band === 5 && /distress|hopeless|suicide/i.test(message)) {
      finalResponse += '\n\nYou’re not alone—reach out: [Crisis Text Line](https://www.crisistextline.org) or a trusted advisor.';
    }

    res.json({ response: finalResponse, stress_band, tone, steps, buttons });
  } catch (err) {
    logger.error(`Chat error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;