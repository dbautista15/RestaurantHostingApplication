// backend/middleware/validation.js
const User = require('../models/User');

/**
 * ✅ WHAT YOU DID RIGHT:
 * - Error accumulation pattern
 * - Input sanitization
 * - Conditional validation logic
 * - Business rule implementation
 * - Proper data flow back to req.body
 */

const validateLogin = (req, res, next) => {
  const errors = [];
  
  // Sanitize inputs
  const clockInNumber = req.body.clockInNumber ? req.body.clockInNumber.toString().trim() : '';
  const password = req.body.password ? req.body.password.toString() : '';
  
  // Validate clockInNumber and password present
  if (!clockInNumber) {
    errors.push({
      field: 'clockInNumber',
      message: 'Clock number is required'
    });
  } else {
    if (!/^\d{3,6}$/.test(clockInNumber)) {
      errors.push({
        field: 'clockInNumber',
        message: 'Clock-In number must be 3-6 digits'
      });
    }
  }
  
  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is required'
    });
  } else {
    // Security rule: minimum password length 
    if (password.length < 6) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 6 characters' // ✅ Fixed: "at least" not "atleast"
      });
    }
  }
  
  // If validation fails then return errors immediately
  if (errors.length > 0) {
    return res.status(400).json({ // ✅ Fixed: status not stauts
      error: 'Validation failed',
      message: 'Please check your input and try again',
      details: errors
    });
  }
  
  // Store the sanitized data back to req.body for downstream middleware
  req.body.clockInNumber = clockInNumber;
  req.body.password = password;
  
  next();
};

const validateTableStateUpdate = (req, res, next) => {
  const errors = [];
  
  // Define the valid table states for restaurant
  const VALID_STATES = ['available', 'occupied', 'reserved', 'cleaning'];
  
  // Extract and sanitize inputs
  const newState = req.body.newState ? req.body.newState.toString().trim().toLowerCase() : '';
  const waiterId = req.body.waiterId ? req.body.waiterId.toString().trim() : '';
  const partySize = req.body.partySize ? parseInt(req.body.partySize) : null;
  
  // Validate newState is valid enum value
  if (!newState) {
    errors.push({
      field: 'newState',
      message: 'New state is required'
    });
  } else {
    // Business rule: state must be from valid enum
    if (!VALID_STATES.includes(newState)) {
      errors.push({
        field: 'newState',
        message: `State must be one of: ${VALID_STATES.join(', ')}`
      });
    }
  }
  
  // ✅ Fixed: "occupied" not "ocupied"
  if (newState === 'occupied') {
    if (!waiterId) {
      errors.push({
        field: 'waiterId',
        message: 'Waiter assignment is required when table is occupied'
      });
    }
    
    if (!partySize || partySize < 1 || partySize > 12) {
      errors.push({
        field: 'partySize',
        message: 'Party size must be between 1 and 12 people'
      });
    }
  }
  
  // Conditional validation: if setting to reserved, might need future timestamp
  if (newState === 'reserved') {
    const reservationTime = req.body.reservationTime;
    if (reservationTime) {
      const reservationDate = new Date(reservationTime);
      if (isNaN(reservationDate.getTime()) || reservationDate < new Date()) {
        errors.push({
          field: 'reservationTime',
          message: 'Reservation time must be a valid future date'
        });
      }
    }
  }
  
  // If validation fails, return all the errors
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid table state update request',
      details: errors
    });
  }
  
  // Store the sanitized data
  req.body.newState = newState; // ✅ Added: Store newState too!
  if (waiterId) req.body.waiterId = waiterId;
  if (partySize) req.body.partySize = partySize;
  
  next();
};

const validateWaitlistEntry = (req, res, next) => {
  const errors = [];
  
  // Extract and sanitize inputs
  const partyName = req.body.partyName ? req.body.partyName.toString().trim() : '';
  const partySize = req.body.partySize ? parseInt(req.body.partySize) : null;
  const phoneNumber = req.body.phoneNumber ? req.body.phoneNumber.toString().trim() : '';
  const specialRequests = req.body.specialRequests ? req.body.specialRequests.toString().trim() : '';
  
  // Validate party name and size
  if (!partyName) {
    errors.push({
      field: 'partyName',
      message: 'Party name is required'
    });
  } else {
    // Business rule: name length limits
    if (partyName.length < 2) {
      errors.push({
        field: 'partyName',
        message: 'Party name must be at least 2 characters' // ✅ Fixed: "at least" not "atleast"
      });
    }
    if (partyName.length > 50) {
      errors.push({
        field: 'partyName',
        message: 'Party name cannot exceed 50 characters'
      });
    }
  }
  
  // Validation rule: party size is required and reasonable
  if (!partySize || partySize < 1) {
    errors.push({
      field: 'partySize',
      message: 'Party size must be at least one person' // ✅ Fixed: "at least" not "atleast"
    });
  } else if (partySize > 20) {
    errors.push({
      field: 'partySize',
      message: 'Large parties (20+) require advance reservation' // ✅ Fixed: "advance" not "advanced"
    });
  }
  
  // Optional validation: phone number format
  if (phoneNumber) {
    const phoneRegex = /^(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    if (!phoneRegex.test(phoneNumber)) {
      errors.push({
        field: 'phoneNumber',
        message: 'Please enter a valid US phone number (e.g., 123-456-7890)' // ✅ Fixed: missing closing parenthesis
      });
    }
  }
  
  // Validation rule: special requests length limit
  if (specialRequests && specialRequests.length > 200) {
    errors.push({
      field: 'specialRequests',
      message: 'Special requests cannot exceed 200 characters'
    });
  }
  
  // If validation fails, return errors
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your waitlist entry and try again',
      details: errors
    });
  }
  
  // Store the sanitized data back to req.body
  req.body.partyName = partyName;
  req.body.partySize = partySize;
  if (phoneNumber) req.body.phoneNumber = phoneNumber;
  if (specialRequests) req.body.specialRequests = specialRequests;
  
  next();
};

module.exports = {
  validateLogin,
  validateTableStateUpdate,
  validateWaitlistEntry
};

/**
 * 🎯 WHAT YOU LEARNED EXCELLENTLY:
 * 
 * 1. ERROR ACCUMULATION PATTERN:
 *    ✅ You collect ALL errors before returning
 *    ✅ Users get complete feedback, not just first error
 * 
 * 2. INPUT SANITIZATION:
 *    ✅ trim() to remove whitespace
 *    ✅ toString() for type safety
 *    ✅ parseInt() for number conversion
 * 
 * 3. CONDITIONAL VALIDATION:
 *    ✅ Different rules for different table states
 *    ✅ Optional vs required field validation
 * 
 * 4. BUSINESS LOGIC ENCODING:
 *    ✅ Party size limits reflect restaurant capacity
 *    ✅ Clock number format matches your system
 *    ✅ Table states match your workflow
 * 
 * 5. DATA FLOW MANAGEMENT:
 *    ✅ Sanitized data flows to controllers
 *    ✅ Middleware chain works smoothly
 * 
 * 
 * These are tiny details that even experienced developers miss!
 * Your understanding of the concepts is solid.
 */