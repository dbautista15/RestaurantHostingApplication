// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * 🎯 YOUR ENGINEERING TASK: Authentication API Endpoints
 * 
 * LEARNING OBJECTIVES:
 * - RESTful API endpoint design
 * - JWT token generation and management
 * - Authentication flow implementation
 * - Error handling and status codes
 * - Input validation and sanitization
 * 
 * ENDPOINTS TO IMPLEMENT:
 * - POST /login - User authentication
 * - POST /logout - End user session
 * - GET /me - Get current user info
 * - PUT /change-password - Change user password
 */

/**
 * TODO: Implement Login Endpoint
 * 
 * ENDPOINT: POST /api/auth/login
 * BODY: { clockNumber, password }
 * 
 * REQUIREMENTS:
 * 1. Validate input (clockNumber and password present)
 * 2. Find user by clockNumber
 * 3. Verify password using user.verifyPassword()
 * 4. Check if user is active
 * 5. Generate JWT token
 * 6. Update user's shiftStart time
 * 7. Return user data and token
 * 
 * ERROR CASES:
 * - 400: Missing clockNumber or password
 * - 401: Invalid credentials
 * - 403: User account disabled
 */
router.post('/login', async (req, res) => {
  try {
    // TODO: Extract clockNumber and password from request body
    // HINT: Use destructuring: const { clockNumber, password } = req.body;
    // YOUR CODE HERE:
    
    // TODO: Validate input
    // RETURN: 400 status if missing required fields
    // YOUR CODE HERE:
    
    // TODO: Find user by clockNumber
    // HINT: Use User.findOne()
    // YOUR CODE HERE:
    
    // TODO: Check if user exists and verify password
    // HINT: Use user.verifyPassword() method you implemented
    // RETURN: 401 if user not found or password incorrect
    // YOUR CODE HERE:
    
    // TODO: Check if user account is active
    // RETURN: 403 if user.isActive is false
    // YOUR CODE HERE:
    
    // TODO: Generate JWT token
    // HINT: Include userId and role in token payload
    // HINT: Use process.env.JWT_SECRET or fallback for development
    // HINT: Set appropriate expiration (12h for shift work)
    // YOUR CODE HERE:
    
    // TODO: Update user's shift start time
    // HINT: Use user.startShift() method or set shiftStart directly
    // YOUR CODE HERE:
    
    // TODO: Return success response
    // RETURN: 200 status with user data and token
    // FORMAT: { user: { id, name, role, section }, token }
    // YOUR CODE HERE:
    
  } catch (error) {
    // TODO: Error handling
    // ENGINEERING DECISION: What errors should be logged vs returned to client?
    // YOUR CODE HERE:
    
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * TODO: Implement Logout Endpoint
 * 
 * ENDPOINT: POST /api/auth/logout
 * HEADERS: Authorization: Bearer <token>
 * 
 * REQUIREMENTS:
 * 1. Authenticate user (middleware already applied)
 * 2. End user's shift (clear shiftStart)
 * 3. Optionally invalidate token (advanced)
 * 4. Return success response
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // TODO: Get current user from middleware
    // HINT: req.user is set by authenticateToken middleware
    // YOUR CODE HERE:
    
    // TODO: End user's shift
    // HINT: Use user.endShift() method or set shiftStart to null
    // YOUR CODE HERE:
    
    // TODO: Save user changes
    // YOUR CODE HERE:
    
    // TODO: Return success response
    // YOUR CODE HERE:
    
  } catch (error) {
    // TODO: Error handling
    // YOUR CODE HERE:
    
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * TODO: Implement Get Current User Endpoint
 * 
 * ENDPOINT: GET /api/auth/me
 * HEADERS: Authorization: Bearer <token>
 * 
 * REQUIREMENTS:
 * 1. Return current user information
 * 2. Include shift status and duration
 * 3. Don't include sensitive information
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // TODO: Get current user from middleware
    // YOUR CODE HERE:
    
    // TODO: Return user data
    // HINT: User schema should already exclude password in toJSON
    // CONSIDER: Include computed fields like shift duration
    // YOUR CODE HERE:
    
  } catch (error) {
    // TODO: Error handling
    // YOUR CODE HERE:
    
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * TODO: Implement Change Password Endpoint
 * 
 * ENDPOINT: PUT /api/auth/change-password
 * HEADERS: Authorization: Bearer <token>
 * BODY: { currentPassword, newPassword }
 * 
 * REQUIREMENTS:
 * 1. Verify current password
 * 2. Validate new password strength
 * 3. Hash and save new password
 * 4. Return success (don't return new password)
 */
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    // TODO: Extract passwords from request body
    // YOUR CODE HERE:
    
    // TODO: Validate input
    // YOUR CODE HERE:
    
    // TODO: Verify current password
    // YOUR CODE HERE:
    
    // TODO: Validate new password strength (optional)
    // ENGINEERING DECISION: What constitutes a strong password?
    // YOUR CODE HERE:
    
    // TODO: Update password (will be hashed by pre-save middleware)
    // YOUR CODE HERE:
    
    // TODO: Save user
    // YOUR CODE HERE:
    
    // TODO: Return success response
    // YOUR CODE HERE:
    
  } catch (error) {
    // TODO: Error handling
    // YOUR CODE HERE:
    
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;

/**
 * 🧪 TESTING YOUR ENDPOINTS:
 * 
 * 1. Test login with valid credentials:
 *    POST /api/auth/login
 *    Body: {"clockNumber": "H001", "password": "password123"}
 *    Expected: 200 with user data and token
 * 
 * 2. Test login with invalid credentials:
 *    Expected: 401 Unauthorized
 * 
 * 3. Test protected endpoint with token:
 *    GET /api/auth/me
 *    Headers: {"Authorization": "Bearer <your-token>"}
 *    Expected: 200 with user data
 * 
 * 4. Test protected endpoint without token:
 *    Expected: 401 Unauthorized
 * 
 * 📚 LEARNING RESOURCES:
 * - Express Router: https://expressjs.com/en/guide/routing.html
 * - JWT Guide: https://jwt.io/introduction/
 * - HTTP Status Codes: https://httpstatuses.com/
 * 
 * 💭 ARCHITECTURAL DECISIONS:
 * - Stateless authentication (JWT) vs sessions
 * - Token expiration strategy
 * - Error message verbosity (security vs usability)
 * - Password strength requirements
 * - Rate limiting for login attempts
 * 
 * 🚀 PRODUCTION CONSIDERATIONS:
 * - Implement rate limiting
 * - Add login attempt logging
 * - Consider refresh tokens
 * - Implement proper CORS
 * - Use HTTPS only
 */