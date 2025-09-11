// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin, validateTableStateUpdate } = require('./middleware/validation');
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
    const { clockInNumber, password } = req.body;
    // TODO: Validate input
    // RETURN: 400 status if missing required fields
    // YOUR CODE HERE:
    // TODO: Check if user exists and verify password
    // HINT: Use user.verifyPassword() method you implemented
    // RETURN: 401 if user not found or password incorrect
    // YOUR CODE HERE:
    ////////////////////////////////////////
    //concept here is the fail fast validation: 
    //why? it helps us stop the processing immiediatly is the reqs arent met.
    //this saves resources and provides feedback
    if(!clockInNumber || !password){
      return res.status(400).json({
        error:'Missing requires fields',
        required:['clockInNumber','password']
      });
    }    
    
    // TODO: Find user by clockNumber
    // HINT: Use User.findOne()
    // YOUR CODE HERE:
////////////////////////////////////////////
    //concept here is database query why clockInNumber? because in this business context its the best way to id someone.
    const user = await User.findOne({clockInNumber});


    // TODO: Check if user account is active
    // RETURN: 403 if user.isActive is false
    // YOUR CODE HERE:
    ////////////////////////
    //critical concept here is security through obscurity is bad!? by checking user and password together we avoid user enumeration attacks which basically means a attacker shouldnt know if the username or password is wrong. 
    if(!user || !await user.verifyPassword(password)){
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
//authorization vs authentication one asks who are you? and the other asks what are you allowed to do?
    if(!user.isActive){
      return res.status(403).json({
        error: 'Account disabled. Please contact an admin.'
      });
    }

    //concept JWT token strucutre and security asks the important questions like who is this token for? what can they do?
    // where do they work? and when was this issued? 
    const payload = {
      userId: user._id,
      role: user.role,
      section:user.section,
      iat: Math.floor(Date.now() / 1000)
    };

    // TODO: Generate JWT token
    // HINT: Include userId and role in token payload
    // HINT: Use process.env.JWT_SECRET or fallback for development
    // HINT: Set appropriate expiration (12h for shift work)
    // YOUR CODE HERE:

    //enviorment based configuration 
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(payload,jwtSecretKey,{
      expiresIn:'10h',
      issuer: 'RESTHOSTAPP',
      audience:'RESTHOSTAPP-users'
    });

    // TODO: Update user's shift start time
    // HINT: Use user.startShift() method or set shiftStart directly
    // YOUR CODE HERE:

    //concept here is business logic shift manegment why update shiftstart here? login= start of work session
    user.shiftStart = new Date();
    await user.save();
    // TODO: Return success response
    // RETURN: 200 status with user data and token
    // FORMAT: { user: { id, name, role, section }, token }
    // YOUR CODE HERE:

    //concept: response shape what the client needs, why this specific format? frontend needs user info + auth token
    res.status(200).json({
      success: true,

      user:{
        id: user._id,
        role:user.role,
        section:user.section,
        shiftStart:user.shiftStart
      }, 
      token
    });
  } catch (error) {
    // TODO: Error handling
    // ENGINEERING DECISION: What errors should be logged vs returned to client?
    // YOUR CODE HERE:
    console.error('Login error:',error);
    res.status(500).json({
      error: 'Authentication service unavailable'
    });
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
    //middleware dependancy  why req.user exists? authenticatetoken middleware populated it
    const user = await User.findById(req.user.userId);
    if(!user){
      return res.status(404).json({
        error:'User not found'
      });
    }
    // TODO: End user's shift
    // HINT: Use user.endShift() method or set shiftStart to null
    // YOUR CODE HERE:
    //concept here is bussiness logic: end work session
    //why clear shiftstart()? logout = end of the work session
    user.shiftStart = null;
    user.lastLogout = new Date(); // track for security reasons
    // TODO: Save user changes
    // YOUR CODE HERE:
    await user.save();
    // TODO: Return success response
    // YOUR CODE HERE:
    //concept here is client side responsibility, why? tell client to destroy token? JWT is stateless on our server.
    res.status(200).json({
      success:true,
      message:'Logged out successfully. Please clear your session.'
    });
  } catch (error) {
    // TODO: Error handling
    // YOUR CODE HERE:
    console.error('Logout Error:',error);
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
    const user = await User.findById(req.user.userId);
    if(!user){
      return res.status(404).json({
        error:'User not found.'
      });
    }
    // TODO: Return user data
    // HINT: User schema should already exclude password in toJSON
    // CONSIDER: Include computed fields like shift duration
    // YOUR CODE HERE:
    //concept computed properties why calculate shift duration? busines logic the client needs.
    const shiftDuration = user.shiftStart ? Math.floor((Date.now()-user.shiftStart.getTime())/(1000*60)) : null; //grabs it in minutes
    res.status(200).json({
      user:{
        id:user._id,
        role:user.role,
        section:user.section,
        shiftStart:user.shiftStart,
        shiftDurationMinutes:shiftDuration,
        isOnShift:!!user.shiftStart
      }
    });
  } catch (error) {
    // TODO: Error handling
    // YOUR CODE HERE:
    console.error('Get user error:',error);
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
    //security update: changing password
    //conceept: password management best practices whhy require current password? prevents session highjacking password changes
    // TODO: Validate input
    // YOUR CODE HERE:
    const {currentPassword,newPassword} = req.body;
    //concept here is input validation
    if(!currentPassword || !newPassword){
      return res.status(400).json({
        error:'Both current and new passwords required'
      });
    }

    const user = await User.findById(req.user.userId);
    if(!user){
      return res.status(404).json({
        error:'User not found.'
      });
    }
    // TODO: Verify current password
    // YOUR CODE HERE:
    //concept here is verification before modification why verify current? ensures the legimate useris making the change
    if(!await user.verifyPassword(currentPassword)){
      return res.status(401).json({
        error:'Current password is incorrect'
      });
    }
    // TODO: Validate new password strength (optional)
    // ENGINEERING DECISION: What constitutes a strong password?
    // YOUR CODE HERE:
    //concept here is password strength validation why these rules? balance security with usability
    if(newPassword.length < 8){
      return res.status(400).json({
        error:'New password must be atleast 8 characters'
      });
    }
    if(newPassword === currentPassword){
      return res.status(400).json({
        error:'New password must be different from the current password'
      });
    }
    // TODO: Update password (will be hashed by pre-save middleware)
    // YOUR CODE HERE:
    //concept here is about mongoose presave hooks and why just assign? the User model's presave middleware will hash it hopefully lol
    user.password = newPassword;
    user.passwordChangedAt = new Date();

    // TODO: Save user
    // YOUR CODE HERE:
    await user.save();
    // TODO: Return success response
    // YOUR CODE HERE:
    res.status(200).json({
      success:true,
      message:'Password updated successfully'
    });
  } catch (error) {
    // TODO: Error handling
    // YOUR CODE HERE:
    console.error('Password change error:',error);
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