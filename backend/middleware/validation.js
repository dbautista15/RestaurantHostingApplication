// backend/middleware/validation.js

/**
 * 🎯 YOUR ENGINEERING TASK: Request Validation Middleware
 * 
 * LEARNING OBJECTIVES:
 * - Input validation patterns
 * - Middleware composition
 * - Data sanitization
 * - Security best practices
 */

// TODO: Implement validation for login requests
const validateLogin = (req, res, next) => {
  // TODO: Validate clockNumber and password present
  // TODO: Sanitize inputs
  // TODO: Check format requirements
  // YOUR CODE HERE:
  
  next();
};

// TODO: Implement validation for table state updates
const validateTableStateUpdate = (req, res, next) => {
  // TODO: Validate newState is valid enum value
  // TODO: Validate required fields for each state
  // TODO: Validate waiter assignment data
  // YOUR CODE HERE:
  
  next();
};

// TODO: Implement validation for waitlist entries
const validateWaitlistEntry = (req, res, next) => {
  // TODO: Validate party name and size
  // TODO: Validate phone number format (if provided)
  // TODO: Check party size limits
  // YOUR CODE HERE:
  
  next();
};

module.exports = {
  validateLogin,
  validateTableStateUpdate,
  validateWaitlistEntry
};