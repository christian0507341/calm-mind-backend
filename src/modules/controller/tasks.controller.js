// src/modules/tasks/controllers/tasks.controller.js
import Task from '../tasks/model/tasks.model.js';
import { DateTime } from '../../utils/luxon.js';
import winston from 'winston';

// Logger for errors
const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [new winston.transports.File({ filename: 'error.log' })]
});
// ===== GET TASKS =====
// ===== GET TASKS =====
export const getTasks = async (req, res) => {
    try {
        const { user_id } = req.query;
        const tasks = await Task.find({ user_id });

        // Map to frontend-friendly fields
        const mappedTasks = tasks.map(t => ({
            _id: t._id,
            title: t.title,
            description: t.description,
            priority: t.priority || "Low",
            start_date: t.start_date ? t.start_date.toISOString() : null,  // <-- ISO string
            due_date: t.due_date ? t.due_date.toISOString() : null,        // <-- ISO string
            status: t.status,
            subtasks: t.subtasks || []
        }));

        res.json(mappedTasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch tasks." });
    }
};

// ===== CREATE TASK =====
export const createTask = async (req, res) => {
    try {
        const { user_id, title, due_date, description, priority, subtasks } = req.body;

        const task = new Task({
            user_id,
            title,
            description: description || "",
            priority: priority || "Low",
            start_date: new Date(), // NEW: automatically set start date
            due_date,
            status: "todo",
            subtasks: subtasks || []
        });


        await task.save();
        res.status(201).json({ task });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create task." });
    }
};


// ===== UPDATE TASK STATUS =====
export const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        if (status) task.status = status;
        await task.save();

        res.json({ task });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update task status." });
    }
};

// ===== RESCHEDULE TASK (update due date, optionally subtasks) =====
export const rescheduleTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { due_date, subtasks } = req.body;

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        if (due_date) task.due_date = due_date;
        if (subtasks) task.subtasks = subtasks;

        await task.save();
        res.json({ task });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to reschedule task." });
    }
};

// ===== SPLIT TASK =====
export const splitTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { subtasks } = req.body;

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        task.subtasks = [...task.subtasks, ...subtasks];
        await task.save();

        res.json({ task });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to split task." });
    }
};

// ===== DELETE TASK =====
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await Task.findByIdAndDelete(id);
        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete task." });
    }
};

// ===== DELETE ALL TASKS =====
export const deleteAllTasks = async (req, res) => {
    try {
        const { user_id } = req.query;
        await Task.deleteMany({ user_id });
        res.json({ message: "All tasks deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete all tasks." });
    }
};