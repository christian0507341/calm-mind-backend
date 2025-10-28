import express from "express";
import {
  upload,
  createProfile,
  getProfileByStudentNumber,
  getProfileByUserId,
  updateProfile,
  updatePassword,
} from "../../controller/getStarted.controller.js";

import { authenticateToken, authorizeRole } from "../../../utils/jwt.js"; // adjust relative path if needed

const router = express.Router();

/**
 * 🟢 Create Student Profile
 * Only accessible by logged-in users with the "student" role.
 * Automatically links profile to req.user._id.
 */
router.post(
  "/",
  authenticateToken,
  authorizeRole(["user"]),
  upload.single("profileImage"),
  createProfile
);

/**
 * 🟡 Get Profile by Student Number
 * Example: GET /api/profile/2023-00123
 */
router.get("/:studentNumber", authenticateToken, getProfileByStudentNumber);

/**
 * 🟣 Get Profile by User ID
 * Example: GET /api/profile/user/64f1b5...
 */
router.get("/user/:userId", authenticateToken, getProfileByUserId);

/**
 * 🟠 Update Profile (address, image, etc.)
 * Only the logged-in student who owns the profile can update.
 */
router.put(
  "/update-profile/:userId",
  authenticateToken,
  authorizeRole(["student"]),
  upload.single("profileImage"),
  updateProfile
);

/**
 * 🔵 Update Password
 * For security, must be logged in and the correct user.
 */
router.put(
  "/update-password/:userId",
  authenticateToken,
  authorizeRole(["student"]),
  updatePassword
);

export default router;
