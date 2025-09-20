// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * ✅ COMPLETED: JWT Authentication Middleware
 * Simple, standard JWT verification - no fancy features
 */
const authenticateToken = async (req, res, next) => {
  try {
    // ✅ COMPLETED: Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'No token provided or invalid format'
      });
    }

    // ✅ COMPLETED: Check if token exists
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    if (!token) {
      return res.status(401).json({
        error: 'Access Denied',
        message: 'No token provided'
      });
    }

    // ✅ COMPLETED: Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // ✅ COMPLETED: Look up user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'Account is not active'
      });
    }

    // ✅ COMPLETED: Attach user to request object
    req.user = user;

    // ✅ COMPLETED: Continue to next middleware
    next();
  } catch (error) {
    // ✅ COMPLETED: Handle different types of errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Token is malformed or invalid'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable'
    });
  }
};

/**
 * ✅ COMPLETED: Role-Based Authorization Middleware
 * Simple role checking - no hierarchy, just exact matches
 */
const requireRole = (allowedRoles) => {
  // Validate input
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error('requireRole: allowedRoles must be a non-empty array');
  }

  return (req, res, next) => {
    // ✅ COMPLETED: Validate input
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    // ✅ COMPLETED: Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      });
    }

    // ✅ COMPLETED: Continue if authorized
    next();
  };
};

/**
 * ✅ COMPLETED: Simple request logging middleware
 * Basic logging for debugging - nothing fancy
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  // Log user info if available (after authentication)
  const userId = req.user ? req.user._id : 'Anonymous';
  const userRole = req.user ? req.user.role : 'N/A';
  
  console.log(`[${timestamp}] ${method} ${url} - User: ${userId} (${userRole}) - IP: ${ip}`);
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requestLogger
};