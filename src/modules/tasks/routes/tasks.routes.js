import express from 'express';
import {
  getTasks,
  createTask,
  splitTask,
  rescheduleTask,
  updateTaskStatus, 
  deleteTask,
  deleteAllTasks
} from '../controller/tasks.controller.js';

const router = express.Router();

// Routes
router.get('/', getTasks);             // Get tasks
router.post('/', createTask);          // Create task
router.post('/:id/split', splitTask);  // Split task
router.put('/:id', updateTaskStatus);  // Update status 
router.put('/:id/reschedule', rescheduleTask); // Reschedule
router.delete('/:id', deleteTask);     // Delete one
router.delete('/', deleteAllTasks);    // Delete all

export default router;
