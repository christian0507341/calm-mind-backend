// src/modules/tasks/controllers/tasks.controller.js
import Task from "../tasks/model/tasks.model.js";
import Notification from "../notifications/model/notification.model.js";
import { DateTime } from "../../utils/luxon.js";
import winston from "winston";

// -------------------- LOGGER SETUP --------------------
const logger = winston.createLogger({
  level: "error",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "error.log" })],
});

// ======================================================
//                    GET TASKS (AUTHENTICATED)
// ======================================================
export const getTasks = async (req, res) => {
  try {
    const user_id = req.user.id; // from token, not query
    const tasks = await Task.find({ user_id });

    const mappedTasks = tasks.map((t) => ({
      _id: t._id,
      title: t.title,
      description: t.description,
      priority: t.priority || "Low",
      start_date: t.start_date ? t.start_date.toISOString() : null,
      due_date: t.due_date ? t.due_date.toISOString() : null,
      status: t.status,
      completed: Boolean(t.status === "completed" || t.completed),
      tags: Array.isArray(t.tags) ? t.tags : [],
      subtasks: t.subtasks || [],
    }));

    res.json(mappedTasks);
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
};

// ======================================================
//                    CREATE TASK
// ======================================================
export const createTask = async (req, res) => {
  try {
    const user_id = req.user.id; // from token
    const { title, due_date, description, priority, subtasks, tags, status } =
      req.body;

    if (!title || !due_date) {
      return res
        .status(400)
        .json({ message: "Title and due date are required." });
    }

    const task = new Task({
      user_id,
      title,
      description: description || "",
      priority: priority || "Low",
      start_date: new Date(),
      due_date,
      status: status || "todo",
      tags: Array.isArray(tags)
        ? tags.filter((t) => typeof t === "string")
        : [],
      subtasks: subtasks || [],
    });

    await task.save();

    // ✅ Create notification for task creation
    await Notification.create({
      user_id,
      message: `Task "${title}" created. Due on ${new Date(
        due_date
      ).toLocaleDateString()}.`,
      type: "general",
    });

    res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(500).json({ message: "Failed to create task." });
  }
};

// ======================================================
//                UPDATE TASK STATUS
// ======================================================
export const updateTaskStatus = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    const { title, description, priority, status, start_date, due_date, tags } = req.body || {};

    const task = await Task.findOne({ _id: id, user_id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (typeof title === "string") task.title = title;
    if (typeof description === "string") task.description = description;
    if (typeof priority === "string") task.priority = priority;
    if (typeof status === "string") task.status = status;
    if (start_date) task.start_date = new Date(start_date);
    if (due_date) task.due_date = new Date(due_date);
    if (Array.isArray(tags)) task.tags = tags.filter((t) => typeof t === "string");

    await task.save();

    if (status === "completed") {
      await Notification.create({
        user_id,
        message: `Task "${task.title}" marked as completed.`,
        type: "general",
      });
    }

    res.json({ task });
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(500).json({ message: "Failed to update task." });
  }
};

// ======================================================
//              RESCHEDULE TASK (due date/subtasks)
// ======================================================
export const rescheduleTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    const { due_date, subtasks } = req.body;

    const task = await Task.findOne({ _id: id, user_id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (due_date) task.due_date = due_date;
    if (subtasks) task.subtasks = subtasks;

    await task.save();

    // ✅ Add notification when task is rescheduled
    await Notification.create({
      user_id,
      message: `Task "${task.title}" has been rescheduled to ${new Date(
        due_date
      ).toLocaleDateString()}.`,
      type: "general",
    });

    res.json({ task });
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(500).json({ message: "Failed to reschedule task." });
  }
};

// ======================================================
//                    SPLIT TASK
// ======================================================
export const splitTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    const { subtasks } = req.body;

    const task = await Task.findOne({ _id: id, user_id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.subtasks = [...task.subtasks, ...(subtasks || [])];
    await task.save();

    // ✅ Notify user when subtasks are added
    await Notification.create({
      user_id,
      message: `Subtasks added to "${task.title}".`,
      type: "general",
    });

    res.json({ task });
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(500).json({ message: "Failed to split task." });
  }
};

// ======================================================
//                    DELETE SINGLE TASK
// ======================================================
export const deleteTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, user_id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // ✅ Create deletion notification
    await Notification.create({
      user_id,
      message: `Task "${task.title}" was deleted.`,
      type: "general",
    });

    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(500).json({ message: "Failed to delete task." });
  }
};

// ======================================================
//                    DELETE ALL TASKS
// ======================================================
export const deleteAllTasks = async (req, res) => {
  try {
    const user_id = req.user.id; // only deletes current user's tasks
    await Task.deleteMany({ user_id });

    // ✅ Notify user that all tasks were deleted
    await Notification.create({
      user_id,
      message: "All your tasks were deleted.",
      type: "general",
    });

    res.json({ message: "All tasks deleted" });
  } catch (err) {
    console.error(err);
    logger.error(err);
    res.status(500).json({ message: "Failed to delete all tasks." });
  }
};
