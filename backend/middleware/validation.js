// backend/middleware/validation.js
const User = require('../models/User');

const validateLogin = (req, res, next) => {
  const errors = [];
  
  // Sanitize inputs
  const clockInNumber = req.body.clockInNumber ? req.body.clockInNumber.toString().trim() : '';
  const password = req.body.password ? req.body.password.toString() : '';
  
  // Validate clockInNumber and password present
  if (!clockInNumber) {
    errors.push({
      field: 'clockInNumber',
      message: 'Clock-in number is required'
    });
  } else {
    // Updated regex to allow flexible formats: 
    // - Pure numbers (1-6 digits): 1, 123, 9999
    // - Letter + numbers: H001, W042
    if (!/^[A-Z]?\d{1,6}$/.test(clockInNumber)) {
      errors.push({
        field: 'clockInNumber',
        message: 'Clock-in number must be 1-6 digits, optionally prefixed with a letter'
      });
    }
  }
  
  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is required'
    });
  } else {
    if (password.length < 6) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 6 characters'
      });
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input and try again',
      details: errors
    });
  }
  
  // Store the sanitized data back to req.body
  req.body.clockInNumber = clockInNumber;
  req.body.password = password;
  
  next();
};

const validateTableStateUpdate = (req, res, next) => {
  const errors = [];
  
  const VALID_STATES = ['available', 'assigned', 'occupied'];  
  
  const newState = req.body.newState ? req.body.newState.toString().trim().toLowerCase() : '';
  const waiterId = req.body.waiterId ? req.body.waiterId.toString().trim() : '';
  const partySize = req.body.partySize ? parseInt(req.body.partySize) : null;
  
  if (!newState) {
    errors.push({
      field: 'newState',
      message: 'New state is required'
    });
  } else {
    if (!VALID_STATES.includes(newState)) {
      errors.push({
        field: 'newState',
        message: `State must be one of: ${VALID_STATES.join(', ')}`
      });
    }
  }
  
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
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid table state update request',
      details: errors
    });
  }
  
  req.body.newState = newState;
  if (waiterId) req.body.waiterId = waiterId;
  if (partySize) req.body.partySize = partySize;
  
  next();
};

const validateWaitlistEntry = (req, res, next) => {
  const errors = [];
  
  const partyName = req.body.partyName ? req.body.partyName.toString().trim() : '';
  const partySize = req.body.partySize ? parseInt(req.body.partySize) : null;
  const phoneNumber = req.body.phoneNumber ? req.body.phoneNumber.toString().trim() : '';
  const specialRequests = req.body.specialRequests ? req.body.specialRequests.toString().trim() : '';
  
  if (!partyName) {
    errors.push({
      field: 'partyName',
      message: 'Party name is required'
    });
  } else {
    if (partyName.length < 2) {
      errors.push({
        field: 'partyName',
        message: 'Party name must be at least 2 characters'
      });
    }
    if (partyName.length > 50) {
      errors.push({
        field: 'partyName',
        message: 'Party name cannot exceed 50 characters'
      });
    }
  }
  
  if (!partySize || partySize < 1) {
    errors.push({
      field: 'partySize',
      message: 'Party size must be at least one person'
    });
  } else if (partySize > 20) {
    errors.push({
      field: 'partySize',
      message: 'Large parties (20+) require advance reservation'
    });
  }
  
  if (phoneNumber) {
    const phoneRegex = /^(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    if (!phoneRegex.test(phoneNumber)) {
      errors.push({
        field: 'phoneNumber',
        message: 'Please enter a valid US phone number (e.g., 123-456-7890)'
      });
    }
  }
  
  if (specialRequests && specialRequests.length > 200) {
    errors.push({
      field: 'specialRequests',
      message: 'Special requests cannot exceed 200 characters'
    });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your waitlist entry and try again',
      details: errors
    });
  }
  
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