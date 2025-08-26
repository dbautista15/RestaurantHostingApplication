// backend/models/AuditEvent.js
const mongoose = require('mongoose');

/**
 * 🎯 YOUR ENGINEERING TASK: Audit Event Schema
 * 
 * LEARNING OBJECTIVES:
 * - Event sourcing patterns
 * - Immutable data logging
 * - Audit trail design
 * - Data relationships and population
 */

const auditEventSchema = new mongoose.Schema({
  // TODO: Define event type field
  // REQUIREMENTS: String, required, enum of event types
  // EXAMPLES: 'STATE_TRANSITION', 'ASSIGNMENT', 'WAITLIST_ADD'
  // YOUR CODE HERE:
  
  // TODO: Define tableId reference
  // REQUIREMENTS: ObjectId reference to Table model
  // YOUR CODE HERE:
  
  // TODO: Define userId reference  
  // REQUIREMENTS: ObjectId reference to User model (who performed action)
  // YOUR CODE HERE:
  
  // TODO: Define state transition fields
  // REQUIREMENTS: fromState and toState strings (optional, for state changes)
  // YOUR CODE HERE:
  
  // TODO: Define metadata field
  // REQUIREMENTS: Mixed type for flexible additional data
  // EXAMPLES: party size, waiter info, cancellation reason
  // YOUR CODE HERE:
  
  // TODO: Add IP address and device info for security
  // YOUR CODE HERE:
  
}, {
  timestamps: true, // Immutable timestamp when event occurred
  // Make schema immutable - events should never be modified
});

// TODO: Add indexes for common queries
// HINT: Query by table, by user, by date range, by event type
// YOUR CODE HERE:

// TODO: Add static methods for common audit queries
auditEventSchema.statics.getTableHistory = function(tableId, limit = 50) {
  // TODO: Get recent events for a specific table
  // YOUR CODE HERE:
};

auditEventSchema.statics.getUserActivity = function(userId, startDate, endDate) {
  // TODO: Get user activity in date range
  // YOUR CODE HERE:
};

const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);
module.exports = AuditEvent;