// src/modules/controller/user.controller.js
import User from "../auth/model/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.js";

// Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // ✅ DO NOT manually hash here — let the model handle it
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password, // plain text — will be hashed by pre('save')
      role: role || "user",
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully. Please log in to continue.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
};

// Get all users (no password returned)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    email = email.toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Get user profile (protected route)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

// Logout user
export const logoutUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    console.log(`User ${userId} logged out at ${new Date().toISOString()}`);

    res.status(200).json({
      message: "Logout successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Error logging out",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

// ✅ Superadmin creates Admin or Professor
export const createUserBySuperAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Only superadmin allowed
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied. Superadmin only." });
    }

    if (!["admin", "professor"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be admin or professor." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
    });

    await newUser.save();

    res.status(201).json({
      message: `${role} account created successfully.`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

// ✅ Complete user profile (after signup)
export const completeUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { department, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.department = department || user.department;
    user.phone = phone || user.phone;
    user.profileCompleted = true;

    await user.save();

    res.status(200).json({
      message: "Profile completed successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    res.status(500).json({ message: "Error completing profile", error: error.message });
  }
};

// ✅ Change password (protected route)
export const updateUserPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};


