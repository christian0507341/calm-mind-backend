import express from "express";
import multer from "multer";
import path from "path";
import { getProfile, updateProfile } from "../controller/profile.controller.js";

const router = express.Router();

// ---------------- MULTER CONFIGURATION ----------------

// Storage configuration — saves uploaded images to "uploads/" folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // ensure this folder exists at project root
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter — only accept image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image uploads are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ---------------- ROUTES ----------------

// GET profile (used by frontend)
router.get("/profile/:userId", getProfile);

// PUT update profile (with image upload)
router.put(
  "/update-profile/:userId",
  upload.single("profileImage"),
  updateProfile
);

export default router;
