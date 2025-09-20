// backend/utils/businessRules.js
const User = require('../models/User');
const Table = require('../models/Table');

/**
 * ✅ COMPLETED: Business Logic Validation
 * Simple, safe restaurant rules - nothing complex
 */

// ✅ COMPLETED: Define valid state transitions
const VALID_TRANSITIONS = {
  'available': ['assigned'],           // Available tables can be assigned
  'assigned': ['occupied', 'available'], // Assigned can be seated or cleared
  'occupied': ['available']            // Occupied can be cleared
};

// ✅ COMPLETED: Validate table state transition
const validateStateTransition = (currentState, newState) => {
  // Check if transition is allowed
  const allowedStates = VALID_TRANSITIONS[currentState];
  
  if (!allowedStates || !allowedStates.includes(newState)) {
    return {
      valid: false,
      error: `Cannot change table from '${currentState}' to '${newState}'. Valid transitions: ${allowedStates ? allowedStates.join(', ') : 'none'}`
    };
  }
  
  return { valid: true };
};

// ✅ COMPLETED: Calculate waiter table load
const calculateWaiterLoad = async (waiterId) => {
  try {
    // Count tables assigned to waiter
    const assignedTables = await Table.find({ 
      assignedWaiter: waiterId,
      state: { $in: ['assigned', 'occupied'] }
    });
    
    const tableCount = assignedTables.length;
    const totalPartySize = assignedTables.reduce((sum, table) => {
      return sum + (table.partySize || 0);
    }, 0);
    
    return {
      tableCount,
      totalPartySize,
      averagePartySize: tableCount > 0 ? totalPartySize / tableCount : 0
    };
  } catch (error) {
    console.error('Error calculating waiter load:', error);
    return { tableCount: 0, totalPartySize: 0, averagePartySize: 0 };
  }
};

// ✅ COMPLETED: Validate waiter assignment
const validateWaiterAssignment = async (waiterId, partySize) => {
  try {
    // Check waiter exists and is active
    const waiter = await User.findById(waiterId);
    if (!waiter) {
      return {
        valid: false,
        error: 'Waiter not found'
      };
    }
    
    if (!waiter.isActive) {
      return {
        valid: false,
        error: 'Waiter is not active'
      };
    }
    
    if (waiter.role !== 'waiter') {
      return {
        valid: false,
        error: 'User is not a waiter'
      };
    }
    
    // Check waiter table limit (max 5 tables)
    const waiterLoad = await calculateWaiterLoad(waiterId);
    if (waiterLoad.tableCount >= 5) {
      return {
        valid: false,
        error: `Waiter already has maximum tables (${waiterLoad.tableCount}/5)`
      };
    }
    
    // Basic party size validation
    if (partySize < 1 || partySize > 20) {
      return {
        valid: false,
        error: 'Party size must be between 1 and 20'
      };
    }
    
    return { 
      valid: true,
      waiterLoad 
    };
  } catch (error) {
    console.error('Error validating waiter assignment:', error);
    return {
      valid: false,
      error: 'Unable to validate waiter assignment'
    };
  }
};

// ✅ COMPLETED: Calculate estimated wait time
const calculateEstimatedWait = (partySize, currentWaitlist) => {
  // Simple algorithm based on party size and current wait
  const baseWaitTime = 45; // Base 15 minutes
  const waitlistLength = currentWaitlist ? currentWaitlist.length : 0;
  
  // Add time based on waitlist length
  const waitlistPenalty = waitlistLength * 15; // 30 minutes per party ahead
  
  // Add time for larger parties (they take longer to seat)
  const partySizePenalty = partySize > 4 ? (partySize - 4) * 5 : 0;
  
  // Check for priority parties ahead
  const priorityAhead = currentWaitlist ? 
    currentWaitlist.filter(party => 
      party.priority === 'coworker' || party.priority === 'large_party'
    ).length : 0;
  
  const priorityPenalty = priorityAhead * 3; // 3 minutes per priority party
  
  const estimatedWait = baseWaitTime + waitlistPenalty + partySizePenalty + priorityPenalty;
  
  // Cap at reasonable maximum
  return Math.min(estimatedWait, 120); // Max 2 hours
};

// ✅ COMPLETED: Validate complete transition (combines multiple checks)
const validateCompleteTransition = async (table, newState, options = {}) => {
  const { waiterId, partySize } = options;
  
  // 1. Validate state transition is allowed
  const stateValidation = validateStateTransition(table.state, newState);
  if (!stateValidation.valid) {
    return stateValidation;
  }
  
  // 2. If assigning to waiter, validate waiter
  if (newState === 'assigned' && waiterId) {
    const waiterValidation = await validateWaiterAssignment(waiterId, partySize);
    if (!waiterValidation.valid) {
      return waiterValidation;
    }
  }
  
  // 3. Validate party size fits table
  if (partySize && table.capacity) {
    if (partySize > table.capacity) {
      return {
        valid: false,
        error: `Party size (${partySize}) exceeds table capacity (${table.capacity})`
      };
    }
  }
  
  return { valid: true };
};

module.exports = {
  validateStateTransition,
  calculateWaiterLoad,
  validateWaiterAssignment,
  calculateEstimatedWait,
  validateCompleteTransition,
  VALID_TRANSITIONS
};