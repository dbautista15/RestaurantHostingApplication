// backend/middleware/validation.js
const User = require('../models/User');
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
  const errors = [];
  // TODO: Sanitize inputs
  const clockNumber = req.body.clockNumber ? req.body.clockNumber.toString().trim() : '';
  const password = req.body.password ? req.body.password.toString() : '';
  // TODO: Validate clockNumber and password present
  if(!clockNumber){
    errors.push({
      field:'clocknumber',
      message: 'Clock number is required'
    });
  } else {
    if (!/^\d{3,6}$/.test(clockNumber)) {
      errors.push({
        field: 'clockNumber',
        message: 'Clock number must be 3-6 digits'
      });
    }
  }
  // TODO: Check format requirements
  // YOUR CODE HERE:
  if(!password){
    errors.push({
      field: 'password',
      message: 'Password is required'
    });
  } else {
    //security rule minimum password length 
    if(password.length < 6){
      errors.push({
        field:'password',
        message: 'Password must be atleast 6 characters'
      });
    }
  }
  //if validation fails then return errors immiediatly
  if(errors.length > 0){
    return res.stauts(400).json({
      error:'Validation failed',
      message: 'Please check your input and try again',
      details: errors
    });
  }
  //store the sanitized data back to the req.body for donwstream middleware
  req.body.clockNumber = clockNumber;
  req.body.password = password;
  next();
};

// TODO: Implement validation for table state updates
const validateTableStateUpdate = (req, res, next) => {
  const errors = [];
  //define the valid table states for my restaurant
  const VALID_STATES = ['available','occupied','reserved','cleaning'];
  //extract and sanitize inputs
  const newState = req.body.newState ? req.body.newState.toString().trim().toLowerCase() : '';
  const waiterId = req.body.waiterId ? req.body.waiterId.toString().trim() : '';
  const partySize = req.body.partySize ? parseInt(req.body.partySize) : null;
  // TODO: Validate newState is valid enum value
  if(!newState){
    errors.push({
      field: 'newState',
      message:'New state is required'
    });
  } else {
    // business rule where the state must be from valid enum
    if(!VALID_STATES.includes(newState)){
      errors.push({
        field:'newState',
        message: `State must be one of ${VALID_STATES.join(', ')}`
      });
    }
  }
  if(newState === 'ocupied'){
    if(!waiterId){
      errors.push({
        field: 'waiterId',
        message: 'Waiter assignment is required when table is occupied'
      });
    }
    if(!partySize || partySize < 1 || partySize > 12){
      errors.push({
        field: 'partySize',
        message: 'Party size must be between 1 and 12 people'
      });
    }
  }
  //conditional validation if setting to reserved might need future timestamp
  if(newState === 'reserved'){
    const reservationTime = req.body.reservationTime;
    if(reservationTime){
      const reservationDate = new Date(reservationTime);
      if(isNaN(reservationDate.getTime()) || reservationDate < new Date()){
        errors.push({
          field: 'reservationTime',
          message: 'Reservation time must be a valid future date'
        });
      }
    }
  }
  //if validation fails return all the errors
  if(errors.length > 0){
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid table state update request',
      details: errors
    });
  }
  //store the sanitized data
  if(waiterId) req.body.waiterId = waiterId;
  if(partySize) req.body.partySize = partySize;
  // TODO: Validate required fields for each state
  // TODO: Validate waiter assignment data
  // YOUR CODE HERE:
  
  next();
};

// TODO: Implement validation for waitlist entries
const validateWaitlistEntry = (req, res, next) => {
  const errors = [];
  // extract and santize inputs
  const partyName = req.body.partyName ? req.body.partyName.toString().trim() : '';
  const partySize = req.body.partySize ? parseInt(req.body.partySize) : null;
  const phoneNumber = req.body.phoneNumber ? req.body.phoneNumber.toString().trim() : '';
  const specialRequests = req.body.specialRequests ? req.body.specialRequests.toString().trim() : '';
  // TODO: Validate party name and size
  if(!partyName){
    errors.push({
      field: 'partyName',
      message:'Party name is required'
    });
  } else{
    //business rule where the name length limit is 
    if(partyName.length< 2){
      errors.push({
        field:'partyName',
        message: 'Party name must atleasy be 2 characters'
      });
    }
    if(partyName.length > 50){
      errors.push({
        field:'partyName',
        message: 'Party name cannot exceed 50 characters'
      });
    }
  }
  // TODO: Check party size limits
  // YOUR CODE HERE:
  //validation rule party size is required and reasonable
  if(!partySize || partySize < 1){
    errors.push({
      field:'partySize',
      message: 'party size must be atleast one person'
    });
  } else if(partySize > 20){
    errors.push({
      field:'partySize',
      message:'Large parties (20+) require advanced reservation'
    });
  }
  // TODO: Validate phone number format (if provided)
  //optional validation 
  if(phoneNumber){
    const phoneRegex = /^(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    if(!phoneRegex.test(phoneNumber)){
      errors.push({
        field:'phoneNumber',
        message: 'Please enter a valid US phone number (e.g., 123-456-7890'
      });
    }
  }
  if(specialRequests && specialRequests.length > 200){
    errors.push({
      field:'specialRequests',
      message: 'Special requests cannot exceed 200 characters'
    });
  }
  //if validation fails return errors
  if(errors.length > 0){
    return res.status(400).json({
      error:'Validation failed',
      message: 'Please check your waitlist entry and try again',
      details: errors
    });
  }
  //store the sanitized data back to the req.body
  req.body.partyName = partyName;
  req.body.partySize = partySize;
  if(phoneNumber) req.body.phoneNumber = phoneNumber;
  if(specialRequests) req.body.specialRequests = specialRequests;

  next();
};

module.exports = {
  validateLogin,
  validateTableStateUpdate,
  validateWaitlistEntry
};