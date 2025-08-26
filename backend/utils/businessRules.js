// backend/utils/businessRules.js

/**
 * 🎯 YOUR ENGINEERING TASK: Business Logic Validation
 * 
 * LEARNING OBJECTIVES:
 * - Separation of business logic from API logic
 * - Pure functions for testability
 * - State machine implementation
 * - Business rule enforcement
 */

// TODO: Define valid state transitions
const VALID_TRANSITIONS = {
  // TODO: Define which states can transition to which other states
  // EXAMPLE: available can go to assigned, assigned can go to occupied or available, etc.
  // YOUR CODE HERE:
};

// TODO: Validate table state transition
const validateStateTransition = (currentState, newState) => {
  // TODO: Check if transition is allowed
  // RETURN: { valid: boolean, error?: string }
  // YOUR CODE HERE:
};

// TODO: Calculate waiter table load
const calculateWaiterLoad = async (waiterId) => {
  // TODO: Count tables assigned to waiter
  // TODO: Consider party sizes for load balancing
  // YOUR CODE HERE:
};

// TODO: Validate waiter assignment
const validateWaiterAssignment = async (waiterId, partySize) => {
  // TODO: Check waiter exists and is active
  // TODO: Check waiter table limit (max 5 tables)
  // TODO: Consider waiter's current load
  // YOUR CODE HERE:
};

// TODO: Calculate estimated wait time
const calculateEstimatedWait = (partySize, currentWaitlist) => {
  // TODO: Algorithm based on party size, current wait, available tables
  // YOUR CODE HERE:
};

module.exports = {
  validateStateTransition,
  calculateWaiterLoad,
  validateWaiterAssignment,
  calculateEstimatedWait,
  VALID_TRANSITIONS
};