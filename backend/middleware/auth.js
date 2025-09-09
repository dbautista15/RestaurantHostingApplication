// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 🎯 YOUR ENGINEERING TASK: Authentication & Authorization Middleware
 * 
 * LEARNING OBJECTIVES:
 * - JWT token verification and validation
 * - Middleware design patterns in Express
 * - Stateless authentication architecture  
 * - Role-based access control (RBAC)
 * - Error handling in middleware chain
 * 
 * REQUIREMENTS FROM YOUR SPECS:
 * - JWT-based authentication for shift workers
 * - Role-based permissions (hosts vs waiters)
 * - Token validation for protected routes
 * - Graceful error handling for invalid/expired tokens
 * 
 * MIDDLEWARE PIPELINE CONCEPT:
 * Request → authenticateToken → requireRole → Route Handler → Response
 */

/**
 * TODO: Implement JWT Authentication Middleware
 * 
 * ENGINEERING REQUIREMENTS:
 * 1. Extract JWT token from Authorization header
 * 2. Verify token signature and expiration
 * 3. Look up user in database to ensure still active
 * 4. Attach user object to req.user for downstream middleware
 * 5. Handle all error cases appropriately
 * 
 * EXPECTED BEHAVIOR:
 * - Success: req.user populated, call next()
 * - No token: 401 Unauthorized
 * - Invalid token: 403 Forbidden  
 * - User not found/inactive: 403 Forbidden
 */
const authenticateToken = async (req, res, next) => {
  try {
    // TODO: Extract token from Authorization header
    // HINT: Format is "Bearer <token>"
    // HINT: Use req.headers['authorization']
    // YOUR CODE HERE:
    const authHeader = req.headers['authorization'];
    if(!authHeader || !authHeader.startsWith('Bearer ')){
      return res.status(401).json({
        error: 'Access Denied',
        message: 'No token provided or invalid format'
      });
    }
    // TODO: Check if token exists
    // RETURN: 401 status with error message if no token
    // YOUR CODE HERE:
    const token = authHeader.subString(7); // "Bearer ".length = 7 
    // TODO: Verify JWT token
    // HINT: Use jwt.verify() with your secret
    // HINT: Handle JWT errors (expired, malformed, etc.)
    // YOUR CODE HERE:
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // TODO: Look up user in database
    // HINT: Use decoded.userId to find user
    // HINT: Check user exists and isActive
    // YOUR CODE HERE:
    const user = await User.findById(decoded.userId);
    if(!user){
      return res.status(403).json({
        error: 'Access Denied',
        message: 'User not found'
      });
    }
    if(!user.isActive){
      return res.status(403).json({
        error: 'Access denied',
        message: ' Account is deactivated'
      });
    }
    // TODO: Attach user to request object
    // HINT: req.user = user;
    // YOUR CODE HERE:
    req.user = user;
    // TODO: Continue to next middleware
    // YOUR CODE HERE:
    next();
  } catch (error) {
    // TODO: Handle different types of errors
    // ENGINEERING DECISION: What status codes for what errors?
    // JWT errors vs database errors vs user not found
    // YOUR CODE HERE:
    if(error.name === 'TokenExpiredError'){
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    if(error.name === 'JsonWebTokenError'){
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Token is malformed or invalid'
      });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({
      error:'Internal server error',
      message: 'Authentication service unavailable'
    });
  }
};

/**
 * TODO: Implement Role-Based Authorization Middleware
 * 
 * ENGINEERING PATTERN: Higher-order function that returns middleware
 * USAGE: requireRole(['host']) or requireRole(['host', 'manager'])
 * 
 * REQUIREMENTS:
 * 1. Check if user has required role(s)
 * 2. Allow access if user role matches any in allowed array
 * 3. Return 403 if insufficient permissions
 * 4. Assume authenticateToken already ran (req.user exists)
 */
const requireRole = (allowedRoles) => {
  //validate input
  if(!Array.isArray(allowedRoles) || allowedRoles.length === 0){
    throw new Error('requireRole: allowedRoles must be a non-empty array');
  }

  return (req, res, next) => {
    // TODO: Validate input
    // HINT: What if allowedRoles is empty or req.user doesn't exist?
    // YOUR CODE HERE:
    if(!req.user){
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }
    // TODO: Check if user role is in allowed roles
    // HINT: Array.includes() or Array.some()
    // YOUR CODE HERE:
    if(!allowedRoles.includes(req.user.role)){
      return res.status(403).json({
        error: 'Insufficient permissions',
        message:`Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      })
    }
    // TODO: Handle insufficient permissions
    // RETURN: 403 status with descriptive error
    // YOUR CODE HERE:
    
    // TODO: Continue if authorized
    // YOUR CODE HERE:
    next();
  };
};

/**
 * TODO: Optional - Implement Additional Security Middleware
 * 
 * IDEAS FOR ADVANCED IMPLEMENTATION:
 * - Rate limiting per user/IP
 * - Shift-based access (only during work hours)
 * - Device/location validation
 * - Audit logging of authentication attempts
 */

// TODO: Optional - Request logging middleware
const requestLogger = (req, res, next) => {
  // TODO: Log relevant request information
  // HINT: timestamp, method, url, user info, IP address
  // ENGINEERING DECISION: What's worth logging vs performance cost?
  // YOUR CODE HERE:
  const timeStamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.header['user-agent'] || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  // log user info if available ( after authentication)
  const userId = req.user ? req.user._id: 'Anonymous';
  const userRole = req.user ? req.user.role : 'N/A';
  console.log(`[${timeStamp}] ${method} ${url} - User: ${userId} (${userRole}) - IP: ${ip} - UA: ${userAgent}`);

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requestLogger
};

/**
 * 🧪 TESTING YOUR MIDDLEWARE:
 * 
 * 1. Test with no token:
 *    curl -X GET http://localhost:3001/api/tables
 *    Expected: 401 Unauthorized
 * 
 * 2. Test with invalid token:
 *    curl -H "Authorization: Bearer invalid" http://localhost:3001/api/tables
 *    Expected: 403 Forbidden
 * 
 * 3. Test with valid token but wrong role:
 *    (Waiter token trying to access host-only endpoint)
 *    Expected: 403 Insufficient permissions
 * 
 * 4. Test with valid token and correct role:
 *    Expected: Success, req.user populated
 * 
 * 📚 LEARNING RESOURCES:
 * - JWT Guide: https://jwt.io/introduction
 * - Express Middleware: https://expressjs.com/en/guide/writing-middleware.html
 * - Node.js JWT Library: https://github.com/auth0/node-jsonwebtoken
 * 
 * 💭 ARCHITECTURAL DECISIONS YOU'RE MAKING:
 * - Stateless vs stateful authentication (JWT = stateless)
 * - Where to store JWT secret (environment variables)
 * - Token expiration strategy (shift-based for restaurant)
 * - Error response format and HTTP status codes
 * - Performance vs security tradeoffs
 * 
 * 🚀 PRODUCTION CONSIDERATIONS:
 * - JWT secret should be cryptographically strong
 * - Consider token refresh mechanisms
 * - Rate limiting to prevent brute force attacks
 * - Audit logging for security monitoring
 * - HTTPS only in production
 */