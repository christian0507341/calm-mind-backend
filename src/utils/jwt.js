// src/utils/jwt.js
import jwt from "jsonwebtoken";
import User from "../modules/auth/model/user.model.js";

/**
 * 🔑 Generate JWT token
 * payload typically includes { id, email, role }
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

/**
 * ✅ Verify token (returns decoded payload)
 * Use this if you just need to decode a token manually.
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * 🧩 Extract token string from request headers
 */
export const extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

/**
 * 🛡 Authenticate request middleware
 * Verifies token, fetches full user document, attaches to req.user.
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    req.user = user; // ✅ full user object available in controllers
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * 🎯 Role-based authorization
 * Example: authorizeRole(["admin", "student"])
 */
export const authorizeRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    next();
  };
};
