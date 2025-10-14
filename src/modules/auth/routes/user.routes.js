// src/modules/auth/routes/user.routes.js
import { Router } from "express";
import { 
  registerUser, 
  getUsers, 
  loginUser, 
  getUserProfile, 
  logoutUser 
} from "../../controller/user.controller.js";
import { authenticateToken, authorizeRole } from "../../../middleware/auth.js";

const router = Router();

// Public routes
// POST /api/users/register → Register user/admin
router.post("/register", registerUser);

// POST /api/users/login → Login user
router.post("/login", loginUser);

// POST /api/users/logout → Logout user (requires authentication)
router.post("/logout", authenticateToken, logoutUser);

// Protected routes
// GET /api/users/profile → Get current user profile
router.get("/profile", authenticateToken, getUserProfile);

// GET /api/users → Get all users (admin only)
router.get("/", authenticateToken, authorizeRole(['admin']), getUsers);

export default router;

