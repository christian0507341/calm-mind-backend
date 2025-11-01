// src/modules/tasks/routes/tasks.routes.js
import express from "express";
import {
  getTasks,
  createTask,
  splitTask,
  rescheduleTask,
  updateTaskStatus,
  deleteTask,
  deleteAllTasks,
} from "../../controller/tasks.controller.js";
import { authenticateToken } from "../../../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes below
router.use(authenticateToken);

// -------------------- TASK ROUTES --------------------

// Get all tasks for the logged-in user
router.get("/", getTasks);

// Create a new task (linked to logged-in user)
router.post("/", createTask);

// Split a task into subtasks
router.post("/:id/split", splitTask);

// Update a task’s status (todo → in_progress → completed, etc.)
router.put("/:id", updateTaskStatus);

// Reschedule a task (change due_date or subtasks)
router.put("/:id/reschedule", rescheduleTask);

// Delete a single task
router.delete("/:id", deleteTask);

// Delete all tasks belonging to the logged-in user
router.delete("/", deleteAllTasks);

export default router;
