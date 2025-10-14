// src/modules/controller/user.controller.js
import User from "../auth/model/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.js";

// Register new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with hashed password
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
    });

    await newUser.save();

    // Generate JWT token for immediate login after registration
    const token = generateToken({
      id: newUser._id,
      email: newUser.email,
      role: newUser.role
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
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
    console.log("Login attempt with email:", email);
    console.log("Password entered:", password);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      console.log("Password mismatch for user:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    console.log("Login successful for:", email);

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
        role: user.role 
      }
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
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: "Error logging out", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
