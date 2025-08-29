// backend/models/WaitlistEntry.js
const mongoose = require('mongoose');
const User = require('./User');
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
  partyDetails:{
    Type:String,
    partyName:String,
    partySiz:Number,
    phoneNumber:Number
    },
  // TODO: Define wait time estimation
  // REQUIREMENTS: estimatedWait (Number, minutes)
  // YOUR CODE HERE:
  waitTime:{
    type:Number,
    estimatedWait:Number
  },
  // TODO: Define priority system
  // REQUIREMENTS: priority enum ('normal', 'vip', 'large_party')
  // YOUR CODE HERE:
  prioritySystem:{
    type:String,
    enum:['normal','large_party','coworker']
  },
  // TODO: Define status tracking
  // REQUIREMENTS: status enum ('waiting', 'seated', 'cancelled', 'no_show')
  // YOUR CODE HERE:
  statusTracking:{
    type:String,
    enum:['waiting','seated','cancelled','no-show']
  },
  // TODO: Define who added the entry
  // REQUIREMENTS: addedBy reference to User model
  // YOUR CODE HERE:
  addedBy:{
    addedAt:Date,
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  }
}, {
  timestamps: true
});

// TODO: Add virtual for actual wait time
// ENGINEERING CONCEPT: Calculate time since added
waitlistEntrySchema.virtual('actualWaitTime').get(function() {
  // TODO: Calculate minutes since addedAt
  // YOUR CODE HERE:
  return Math.floor((new Date()-this.addedAt)/(1000*60));
});

// TODO: Add methods for waitlist operations
waitlistEntrySchema.methods.seat = async function() {
  // TODO: Mark as seated and set timestamp
  // YOUR CODE HERE:
  timestamp = Date.now;
  this.statusTracking = 'seated';
  return await this.save();
};

waitlistEntrySchema.methods.cancel = async function(reason) {
  // TODO: Mark as cancelled
  // YOUR CODE HERE:
  timestamp = Date.now;
  this.statusTracking = 'cancelled';
  return await this.save();
};

// TODO: Add static methods for waitlist management
waitlistEntrySchema.statics.getActiveWaitlist = function() {
  // TODO: Get all waiting parties ordered by priority and time
  // YOUR CODE HERE:
  return this.find({waitTime,prioritySystem});
};

const WaitlistEntry = mongoose.model('WaitlistEntry', waitlistEntrySchema);
module.exports = WaitlistEntry;