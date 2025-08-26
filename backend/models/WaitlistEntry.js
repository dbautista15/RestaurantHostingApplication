// backend/models/WaitlistEntry.js
const mongoose = require('mongoose');

/**
 * 🎯 YOUR ENGINEERING TASK: Waitlist Management Schema
 * 
 * LEARNING OBJECTIVES:
 * - Queue-like data structures
 * - Time-based calculations
 * - Status tracking and workflows
 */

const waitlistEntrySchema = new mongoose.Schema({
  // TODO: Define party details
  // REQUIREMENTS: partyName (String), partySize (Number), phoneNumber (String, optional)
  // YOUR CODE HERE:
  
  // TODO: Define wait time estimation
  // REQUIREMENTS: estimatedWait (Number, minutes)
  // YOUR CODE HERE:
  
  // TODO: Define priority system
  // REQUIREMENTS: priority enum ('normal', 'vip', 'large_party')
  // YOUR CODE HERE:
  
  // TODO: Define status tracking
  // REQUIREMENTS: status enum ('waiting', 'seated', 'cancelled', 'no_show')
  // YOUR CODE HERE:
  
  // TODO: Define who added the entry
  // REQUIREMENTS: addedBy reference to User model
  // YOUR CODE HERE:
  
}, {
  timestamps: true
});

// TODO: Add virtual for actual wait time
// ENGINEERING CONCEPT: Calculate time since added
waitlistEntrySchema.virtual('actualWaitTime').get(function() {
  // TODO: Calculate minutes since addedAt
  // YOUR CODE HERE:
});

// TODO: Add methods for waitlist operations
waitlistEntrySchema.methods.seat = function() {
  // TODO: Mark as seated and set timestamp
  // YOUR CODE HERE:
};

waitlistEntrySchema.methods.cancel = function(reason) {
  // TODO: Mark as cancelled
  // YOUR CODE HERE:
};

// TODO: Add static methods for waitlist management
waitlistEntrySchema.statics.getActiveWaitlist = function() {
  // TODO: Get all waiting parties ordered by priority and time
  // YOUR CODE HERE:
};

const WaitlistEntry = mongoose.model('WaitlistEntry', waitlistEntrySchema);
module.exports = WaitlistEntry;