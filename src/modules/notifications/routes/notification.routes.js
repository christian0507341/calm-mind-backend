import express from "express";
import {
  getNotifications,
  markAsRead,
  deleteNotifications,
} from "../../notifications/controller/notification.controller.js";
import { authenticateToken } from "../../../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.delete("/", deleteNotifications);

export default router;
