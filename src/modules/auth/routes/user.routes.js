// src/modules/auth/routes/user.routes.js
import { Router } from "express";
import {
  registerUser,
  getUsers,
  loginUser,
  getUserProfile,
  logoutUser,
  createUserBySuperAdmin,
  completeUserProfile,
  updateUserPassword,
} from "../../controller/user.controller.js";

import { authenticateToken, authorizeRole } from "../../../middleware/auth.js";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/update-password", authenticateToken, updateUserPassword);

// Protected routes
router.post("/logout", authenticateToken, logoutUser);
router.get("/profile", authenticateToken, getUserProfile);
router.get("/", authenticateToken, authorizeRole(["admin", "superadmin"]), getUsers);

// Superadmin-only route
router.post("/create", authenticateToken, authorizeRole(["superadmin"]), createUserBySuperAdmin);

// User completes profile
router.put("/complete-profile", authenticateToken, completeUserProfile);

export default router;
