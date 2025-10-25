import mongoose from "mongoose";
import GetStartedProfile from "../model/getStarted.model.js";
import User from "../../auth/model/user.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";



// 🟢 Multer setup for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads/profileImages";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({ storage });

// 🟢 Create Profile
export const createProfile = async (req, res) => {
  try {
    const {
      course,
      yearLevel,
      studentNumber,
      address,
      contactNumber,
      userId,
    } = req.body;

    const profileImage = req.file ? req.file.path : "";

    if (!course || !yearLevel || !studentNumber || !address || !contactNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await GetStartedProfile.findOne({ studentNumber });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Profile already exists for this student number" });
    }

    const newProfile = await GetStartedProfile.create({
      course,
      yearLevel,
      studentNumber,
      address,
      contactNumber,
      profileImage,
      userId: userId || null,
    });

    res.status(201).json({
      message: "Profile created successfully",
      data: newProfile,
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🟡 Get Profile by Student Number
export const getProfileByStudentNumber = async (req, res) => {
  try {
    const { studentNumber } = req.params;
    const profile = await GetStartedProfile.findOne({ studentNumber }).populate(
      "userId",
      "email"
    );
    if (!profile)
      return res.status(404).json({ message: "Profile not found" });
    res.json({ data: profile });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🟣 Get Profile by User ID (for dashboard reflection)
export const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const profile = await GetStartedProfile.findOne({ userId }).populate(
      "userId",
      "email"
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ data: profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🟠 Update Profile (editable fields)
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (req.file) {
      updates.profileImage = req.file.path;
    }

    const updatedProfile = await GetStartedProfile.findOneAndUpdate(
      { userId },
      updates,
      { new: true }
    );

    if (!updatedProfile)
      return res.status(404).json({ message: "Profile not found" });

    res.json({ message: "Profile updated successfully", data: updatedProfile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔵 Update Password
export const updatePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
