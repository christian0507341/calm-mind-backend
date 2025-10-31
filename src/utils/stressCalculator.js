import { DateTime } from 'luxon';

// Priority weights for tasks
const PRIORITY_WEIGHTS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
};

// Stress factor constants
const STRESS_FACTORS = {
  DEADLINE_48H: 0.05,    // 5% increase for tasks due within 48 hours
  OVERDUE: 0.10,         // 10% increase for overdue tasks
  COMPLETION_OVERDUE: 0.10 // 10% increase for incomplete overdue tasks
};

/**
 * Calculate deadline proximity factor for a task
 * @param {Date} dueDate - Task due date
 * @param {boolean} isCompleted - Task completion status
 * @returns {number} - Deadline proximity stress factor
 */
export function calculateDeadlineProximityFactor(dueDate, isCompleted) {
  if (isCompleted) return 0;

  const now = DateTime.now();
  const due = DateTime.fromJSDate(new Date(dueDate));
  const hoursUntilDue = due.diff(now, 'hours').hours;

  if (hoursUntilDue < 0) {
    // Task is overdue
    return STRESS_FACTORS.OVERDUE;
  } else if (hoursUntilDue <= 48) {
    // Task is due within 48 hours
    return STRESS_FACTORS.DEADLINE_48H;
  }
  return 0;
}

/**
 * Calculate completion factor for a task
 * @param {Date} dueDate - Task due date
 * @param {boolean} isCompleted - Task completion status
 * @returns {number} - Completion stress factor
 */
export function calculateCompletionFactor(dueDate, isCompleted) {
  if (isCompleted) return 0;

  const now = DateTime.now();
  const due = DateTime.fromJSDate(new Date(dueDate));

  if (due < now) {
    // Task is overdue and incomplete
    return STRESS_FACTORS.COMPLETION_OVERDUE;
  }
  return 0;
}

/**
 * Calculate stress value for a single task
 * @param {Object} task - Task object with priority, dueDate, and completed status
 * @returns {number} - Calculated stress value for the task
 */
export function calculateTaskStress(task) {
  const priorityStress = PRIORITY_WEIGHTS[task.priority.toUpperCase()] || PRIORITY_WEIGHTS.MEDIUM;
  const deadlineStress = calculateDeadlineProximityFactor(task.dueDate, task.completed);
  const completionStress = calculateCompletionFactor(task.dueDate, task.completed);

  // Additive model as per spec: Stress = Priority + Deadline Factor + Completion Factor
  return priorityStress + deadlineStress + completionStress;
}

/**
 * Calculate daily stress level from tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Object} - Stress metrics including total, normalized value, and factors
 */
export function calculateDailyStress(tasks) {
  const taskStresses = tasks.map(task => ({
    taskId: task._id,
    stress: calculateTaskStress(task),
    factors: {
      priority: PRIORITY_WEIGHTS[task.priority.toUpperCase()] || PRIORITY_WEIGHTS.MEDIUM,
      deadline: calculateDeadlineProximityFactor(task.dueDate, task.completed),
      completion: calculateCompletionFactor(task.dueDate, task.completed)
    }
  }));

  const totalStress = taskStresses.reduce((sum, t) => sum + t.stress, 0);

  // Percentage and normalized (1–5) based on additive model
  // Max per-task stress = 3 (HIGH) + 0.10 (overdue) + 0.10 (completion overdue) = 3.2
  const maxPerTask = 3.2;
  const maxTotal = Math.max(1, (tasks?.length || 0) * maxPerTask);
  const percentage = Math.max(0, Math.min(100, (totalStress / maxTotal) * 100));
  const normalizedStress = 1 + (percentage / 100) * 4; // map 0–100% to 1–5

  return {
    raw: totalStress,
    normalized: normalizedStress,
    percentage,
    taskStresses,
    metrics: {
      totalTasks: tasks.length,
      overdueTasks: tasks.filter(t => new Date(t.dueDate) < new Date() && !t.completed).length,
      due48h: tasks.filter(t => {
        const due = DateTime.fromJSDate(new Date(t.dueDate));
        const now = DateTime.now();
        return due > now && due <= now.plus({ hours: 48 });
      }).length
    }
  };
}

/**
 * Aggregate stress levels over time
 * @param {Array} dailyStresses - Array of daily stress calculations
 * @param {string} period - 'week' or 'month'
 * @returns {Object} - Aggregated stress metrics
 */
export function aggregateStress(dailyStresses, period) {
  const stressValues = dailyStresses.map(d => d.normalized);

  return {
    average: stressValues.reduce((sum, v) => sum + v, 0) / stressValues.length,
    max: Math.max(...stressValues),
    min: Math.min(...stressValues),
    trend: stressValues.length > 1
      ? (stressValues[stressValues.length - 1] - stressValues[0]) / stressValues.length
      : 0
  };
}