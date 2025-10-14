import { verifyToken, extractToken } from '../utils/jwt.js';

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

