// src/modules/auth/routes/user.routes.js
import { Router } from "express";
import {
  registerUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getUsers,
  loginUser,
  getUserProfile,
  logoutUser,
  createUserBySuperAdmin,
  updateUserPassword,
} from "../../controller/user.controller.js";

import { authenticateToken, authorizeRole } from "../../../middleware/auth.js";

const router = Router();

// -------------------- PUBLIC ROUTES --------------------

// Register new user
router.post("/register", registerUser);

// Verify email
router.get("/verify-email/:token", verifyEmail);

// Login
router.post("/login", loginUser);

// Forgot password
router.post("/forgot-password", forgotPassword);

// ✅ FIXED: Reset password (use body with email, code, newPassword)
router.post("/reset-password", resetPassword);

// Update password (requires authentication)
router.put("/update-password", authenticateToken, updateUserPassword);

// -------------------- PROTECTED ROUTES --------------------

// Logout
router.post("/logout", authenticateToken, logoutUser);

// Get user profile
router.get("/profile", authenticateToken, getUserProfile);

// Get all users (admin/superadmin only)
router.get(
  "/",
  authenticateToken,
  authorizeRole(["admin", "superadmin"]),
  getUsers
);

// Superadmin creates Admin or Professor
router.post(
  "/create",
  authenticateToken,
  authorizeRole(["superadmin"]),
  createUserBySuperAdmin
);

export default router;
