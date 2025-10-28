import express from "express";
import {
  upload,
  createProfile,
  getProfileByStudentNumber,
  getProfileByUserId,
  updateProfile,
  updatePassword,
} from "../../controller/getStarted.controller.js";

const router = express.Router();

// 🟢 Create Profile
router.post("/", upload.single("profileImage"), createProfile);

// 🟡 Get profile by student number
router.get("/:studentNumber", getProfileByStudentNumber);

// 🟣 Get profile by userId
router.get("/profile/:userId", getProfileByUserId);

// 🟠 Update profile (name, address, image, etc.)
router.put("/update-profile/:userId", upload.single("profileImage"), updateProfile);

// 🔵 Update password
router.put("/update-password/:userId", updatePassword);

export default router;
