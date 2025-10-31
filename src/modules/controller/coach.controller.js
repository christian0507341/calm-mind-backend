// src/modules/controller/coach.controller.js
import Task from '../tasks/model/tasks.model.js';
import { StressLog, StressDaily } from '../stress/model/stress.model.js';
import { ChatLog } from '../coach/model/coachLog.model.js';
import { getCoachResponse } from '../../llm/llmService.js';
import { calculateDailyStress, aggregateStress } from '../../utils/stressCalculator.js';
import { DateTime } from 'luxon';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [new winston.transports.File({ filename: 'error.log' })],
});

async function buildCoachContext(user_id) {
    const now = DateTime.now().setZone('Asia/Manila');
    const today = now.startOf('day').toJSDate();
    const weekAgo = now.minus({ days: 7 }).startOf('day').toJSDate();

    const tasks = await Task.find({ user_id });

    const dailyStress = calculateDailyStress(tasks.map(t => ({
        _id: t._id,
        priority: t.priority,
        dueDate: t.due_date,
        completed: t.completed,
        status: t.status
    })));

    const weekLogs = await StressDaily.find({ user_id, date_local: { $gte: weekAgo, $lte: today } });
    const weekAvg = weekLogs.length ? weekLogs.reduce((s, d) => s + d.avg_level, 0) / weekLogs.length : 3.0;

    const topTags = await StressLog.aggregate([
        { $match: { user_id, timestamp: { $gte: weekAgo } } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
    ]).then(tags => tags.map(t => t._id));

    const nextDeadlines = tasks
        .filter(t => !t.completed && t.due_date && new Date(t.due_date) > now)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 3)
        .map(t => ({ title: t.title, due: new Date(t.due_date).toISOString().split('T')[0] }));

    return {
        student: { year_level: 'University', timezone: 'Asia/Manila' },
        now: now.toISO(),
        stress: {
            today_avg: dailyStress.normalized,
            percentage: dailyStress.percentage,
            week_avg: weekAvg,
            trend: weekAvg > dailyStress.normalized ? 'up' : 'down',
            top_tags: topTags,
            task_stress: dailyStress.taskStresses
        },
        workload: {
            due_48h_count: dailyStress.metrics.due48h,
            overdue_count: dailyStress.metrics.overdueTasks,
            next_deadlines: nextDeadlines,
            total_tasks: tasks.length
        }
    };
}

/**
 * GET /coach/context — Build full stress + workload context for LLM
 */
export const getCoachContext = async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id required' });
        const payload = await buildCoachContext(user_id);
        res.json(payload);
    } catch (err) {
        logger.error(`Context error: ${err.message}`);
        res.status(500).json({ error: 'Failed to build context' });
    }
};

/**
 * POST /coach/chat — Main chatbot endpoint
 */
export const chatWithCoach = async (req, res) => {
    try {
        const { user_id, message, stress, workload } = req.body;
        if (!user_id || !message) return res.status(400).json({ error: 'user_id and message required' });

        // Build fresh context in-process (avoid internal HTTP)
        const context = await buildCoachContext(user_id);

        // Use provided stress/workload or fallback to context
        const finalContext = {
            ...context,
            stress: stress || context.stress,
            workload: workload || context.workload
        };

        const llmResult = await getCoachResponse(finalContext, message);

        // Save chat log
        const chatLog = new ChatLog({
            user_id,
            message,
            response: llmResult,
            stress_band: llmResult.stress_band
        });
        await chatLog.save();

        // Auto-log stress using the current band and update today's aggregates
        try {
            const level = Math.max(1, Math.min(5, Number(llmResult.stress_band) || 3));
            const tags = Array.isArray(llmResult.resources) && llmResult.resources.length ? ['resources'] : [];
            const note = 'auto:chat';

            const nowLocal = DateTime.now().setZone('Asia/Manila');
            const log = new StressLog({ user_id, level, tags, note, timestamp: nowLocal.toJSDate() });
            await log.save();

            const start = nowLocal.startOf('day').toJSDate();
            const end = nowLocal.endOf('day').toJSDate();
            const todayLogs = await StressLog.find({ user_id, timestamp: { $gte: start, $lte: end } });
            if (todayLogs.length > 0) {
                const avg_level = todayLogs.reduce((s, l) => s + l.level, 0) / todayLogs.length;
                const peak_level = Math.max(...todayLogs.map(l => l.level));
                const logs_count = todayLogs.length;
                await StressDaily.findOneAndUpdate(
                    { user_id, date_local: start },
                    { avg_level, peak_level, logs_count },
                    { upsert: true, new: true }
                );
            }
        } catch (aggErr) {
            logger.error(`Auto stress log/aggregate error: ${aggErr.message}`);
        }

        res.json(llmResult);
    } catch (err) {
        logger.error(`Chat error: ${err.message}`);
        res.status(500).json({ error: 'Chat failed' });
    }
};