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
    partyName:{
      type:String,
      required:true,
    },
    partySize:{
      type:Number,
      required:true,
      min:1
    },
    phoneNumber:{
      type:String,
      required:true
    },
  // TODO: Define wait time estimation
  // REQUIREMENTS: estimatedWait (Number, minutes)
  // YOUR CODE HERE:
  estimatedWait:{
      type:Number
    },
  // TODO: Define priority system
  // REQUIREMENTS: priority enum ('normal', 'coworker', 'large_party')
  // YOUR CODE HERE:
  priority:{
    type:String,
    enum:['normal','large_party','coworker']
  },
  // TODO: Define status tracking
  // REQUIREMENTS: status enum ('waiting', 'seated', 'cancelled', 'no_show')
  // YOUR CODE HERE:
  partyStatus:{
    type:String,
    enum:['waiting','seated','cancelled','no-show'],
    default: 'waiting'  // Add default
  },
  // TODO: Define who added the entry
  // REQUIREMENTS: addedBy reference to User model
  // YOUR CODE HERE:
  addedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
  seatedAt:{
    type: Date
  },
}, {
  timestamps: true
});

// TODO: Add virtual for actual wait time
// ENGINEERING CONCEPT: Calculate time since added
waitlistEntrySchema.virtual('actualWaitTime').get(function() {
  // TODO: Calculate minutes since addedAt
  // YOUR CODE HERE:
  return Math.floor((new Date() - this.createdAt) / (1000 * 60));
});

// TODO: Add methods for waitlist operations
waitlistEntrySchema.methods.seat = async function() {
  // TODO: Mark as seated and set timestamp
  // YOUR CODE HERE:
  this.seatedAt = Date.now();
  this.partyStatus = 'seated';
  return await this.save();
};

waitlistEntrySchema.methods.cancel = async function(reason) {
  // TODO: Mark as cancelled
  // YOUR CODE HERE:
  this.partyStatus = 'cancelled';
  return await this.save();
};

// TODO: Add static methods for waitlist management
waitlistEntrySchema.statics.getActiveWaitlist = function() {
  // TODO: Get all waiting parties ordered by priority and time
  // YOUR CODE HERE:
  return this.find({ partyStatus: 'waiting' }).sort({ priority: -1, createdAt: 1 });
};

const WaitlistEntry = mongoose.model('WaitlistEntry', waitlistEntrySchema);
module.exports = WaitlistEntry;