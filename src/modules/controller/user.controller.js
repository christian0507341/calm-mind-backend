// src/modules/controller/user.controller.js
import User from "../auth/model/user.model.js";
import GetStartedProfile from "../getStarted/model/getStarted.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.js";
import crypto from "crypto";

// -------------------- EMAIL SENDER (TERMINAL) --------------------
const sendEmail = async (to, subject, text) => {
  // For testing, print emails to terminal
  console.log("--------------------------------------------------");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text: ${text}`);
  console.log("--------------------------------------------------");
};

// -------------------- REGISTER --------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });
    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || "user",
    });

    // Generate verification token
    const verificationToken = newUser.generateVerificationToken();
    await newUser.save();

    const verificationUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/users/verify-email/${verificationToken}`;
    await sendEmail(
      newUser.email,
      "Verify your email",
      `Click here to verify your email: ${verificationUrl}`
    );

    res.status(201).json({
      message:
        "User registered successfully. Check terminal to simulate email verification.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

// -------------------- VERIFY EMAIL --------------------
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({ verificationToken: hashedToken });
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("Email verification error:", err);
    res
      .status(500)
      .json({ message: "Error verifying email", error: err.message });
  }
};

// -------------------- LOGIN --------------------
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    email = email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });
    if (!user.isVerified)
      return res
        .status(401)
        .json({ message: "Please verify your email first" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    let profileCompleted = user.profileCompleted || false;
    if (user.role === "user") {
      const profile = await GetStartedProfile.findOne({ userId: user._id });
      profileCompleted = !!profile;
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

// -------------------- FORGOT PASSWORD (Generate + Log 6-digit Code) --------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate 6-digit code using the model method
    const code = user.generateResetCode();
    await user.save();

    // Print the reset code in the terminal instead of sending email
    console.log("--------------------------------------------------");
    console.log(`Password reset code for ${user.email}: ${code}`);
    console.log("This code will expire in 10 minutes.");
    console.log("--------------------------------------------------");

    res.status(200).json({
      message:
        "Verification code generated. Check terminal to simulate email delivery.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({
      message: "Error generating verification code",
      error: err.message,
    });
  }
};

// -------------------- RESET PASSWORD (Verify code + Set New Password) --------------------
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, code, and new password are required" });
    }

    // Find the user by email and valid reset code
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetCode: code,
      resetCodeExpire: { $gt: Date.now() }, // check if code is still valid
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    // Update password and clear reset code fields
    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    await user.save();

    res.status(200).json({
      message: "Password reset successful. You can now log in.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      message: "Error resetting password",
      error: err.message,
    });
  }
};

// -------------------- GET USERS --------------------
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
};

// -------------------- PROFILE MANAGEMENT --------------------
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    let profileCompleted = user.profileCompleted || false;
    if (user.role === "user") {
      const profile = await GetStartedProfile.findOne({ userId: user._id });
      profileCompleted = !!profile;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: err.message });
  }
};

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
        profileCompleted: true,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error completing profile", error: err.message });
  }
};

// -------------------- CHANGE PASSWORD --------------------
export const updateUserPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json({ message: "Current and new password are required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect current password" });

    if (newPassword.length < 6)
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });

    // Don't hash manually — let the pre-save hook handle it
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error changing password",
      error: err.message,
    });
  }
};

// -------------------- LOGOUT --------------------
export const logoutUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "User not authenticated" });

    console.log(`User ${userId} logged out at ${new Date().toISOString()}`);
    res.status(200).json({
      message: "Logout successful",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging out", error: err.message });
  }
};

// -------------------- SUPERADMIN CREATION --------------------
export const createUserBySuperAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (req.user.role !== "superadmin")
      return res
        .status(403)
        .json({ message: "Access denied. Superadmin only." });
    if (!["admin", "professor"].includes(role))
      return res
        .status(400)
        .json({ message: "Invalid role. Must be admin or professor." });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

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
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};
