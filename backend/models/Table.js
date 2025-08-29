// backend/models/Table.js
const mongoose = require('mongoose');
const User = require('./User');

/**
 * 🎯 YOUR ENGINEERING TASK: Table Schema Design
 * 
 * LEARNING OBJECTIVES:
 * - Database schema design and validation
 * - Mongoose schema definition and methods
 * - Data relationships and references
 * - Business rule enforcement at database level
 * 
 * REQUIREMENTS FROM YOUR SPECS:
 * - Table number (unique identifier)
 * - Section (A, B, or C)  
 * - Capacity (number of seats)
 * - Current state (available, assigned, occupied)
 * - Assigned waiter (reference to User)
 * - Party size (when assigned)
 * - Timestamp tracking for state changes
 * 
 * ENGINEERING DECISIONS TO MAKE:
 * - What fields should be required vs optional?
 * - How to enforce state transition rules at DB level?
 * - What validations prevent invalid data?
 * - How to handle relationships to User model?
 */

const tableSchema = new mongoose.Schema({
  // TODO: Define tableNumber field
  // REQUIREMENTS: Number, unique, required
  // HINT: Use unique: true and required: true
  // YOUR CODE HERE:
  tableNumber:{
	unique:true,
	type:String,
  required:true
  },
  // TODO: Define section field  
  // REQUIREMENTS: Number goes by order of arrival of waiters
  // HINT: Use enum validation
  // YOUR CODE HERE:
  section:{
	type:Number,
  enum:[1,2,3,4,5,6,7]
  },
  // TODO: Define capacity field
  // REQUIREMENTS: Number, required, minimum 2, maximum 10
  // HINT: Use min and max validators
  // YOUR CODE HERE:
  capacity:{
	type:Number,
	required:true,
	min:2,
	max:15
  },
  // TODO: Define state field
  // REQUIREMENTS: String, enum of ['available', 'assigned', 'occupied'], default 'available'
  // HINT: This enforces your state machine at database level
  // YOUR CODE HERE:
  state:{
	type:String,
	enum:['available','assigned','occupied'],
	default:'available'
  },
  // TODO: Define assignedWaiter field
  // REQUIREMENTS: Reference to User model, optional (only when assigned/occupied)
  // HINT: Use mongoose.Schema.Types.ObjectId with ref
  // YOUR CODE HERE:
  assignedWaiter:{
    type:mongoose.Schema.Types.ObjectId,
	  ref:'User'
  },
  // TODO: Define partySize field
  // REQUIREMENTS: Number, optional, minimum 1 when present
  // HINT: Only required when state is 'assigned' or 'occupied'
  // YOUR CODE HERE:
  partySize:{
	type:Number,
	min:1,
  },
  // TODO: Define timestamp fields
  // REQUIREMENTS: Track when table was assigned and last state change
  // HINT: assignedAt (Date, optional), lastStateChange (Date, default now)
  // YOUR CODE HERE:
    assignedAt:{
      type:Date
    },
    lastStateChange:{
      type:Date,
      default: Date.now
    }
}, {
  // Mongoose options
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// TODO: Add virtual fields (computed properties)
// ENGINEERING CONCEPT: Virtual fields are computed at query time, not stored
// EXAMPLE: isAvailable, timeInCurrentState, etc.
// YOUR CODE HERE:
tableSchema.virtual('isAvailable').get(function(){
  return this.state === 'available';
});
tableSchema.virtual('timeInCurrentState').get(function(){
  if(!this.assignedAt) return 0;
  return Math.floor((new Date()-this.assignedAt)/(1000*60));
});
// TODO: Add schema methods (instance methods)
// ENGINEERING CONCEPT: Methods that can be called on individual table documents
// EXAMPLE: table.canTransitionTo('occupied'), table.assignTo(waiterId, partySize)
// YOUR CODE HERE:
tableSchema.methods.canTransitionTo = function(newState){
  const validTransitions = {
    'available':['assigned'],
    'assigned': ['occupied','available'],
    'occupied': ['available']
  };
  return validTransitions[this.state]?.includes(newState)|| false;
};

tableSchema.methods.transitionTo = async function(newState){
  if(!this.canTransitionTo(newState)){
    throw new Error(`Invalid transition: ${this.state}->${newState}`);
  }
  this.state = newState;
  return await this.save();
};
tableSchema.methods.assignTo =async function(waiterId,partySize){
  this.assignedWaiter = waiterId;
  this.partySize = partySize;
  this.state = 'assigned';
  return await this.save();
};
// TODO: Add static methods (model methods) 
// ENGINEERING CONCEPT: Methods called on the Table model itself
// EXAMPLE: Table.getAvailableInSection('A'), Table.getWaiterWorkload(waiterId)
// YOUR CODE HERE:
tableSchema.statics.getAvailableInSection = function(section){
  return this.find({section:section,state:'available'});

};
tableSchema.statics.getWaiterWorkload = function(waiterId){
  return this.find({assignedWaiter:waiterId});
};
// TODO: Add pre/post middleware hooks
// ENGINEERING CONCEPT: Code that runs before/after save, update, etc.
// EXAMPLE: Validate state transitions, log changes, update timestamps
// YOUR CODE HERE:
tableSchema.pre('save',async function(next){
  if(this.isModified('state')){
    this.lastStateChange = new Date();

  }
  next();
});

// TODO: Add indexes for query performance
// ENGINEERING CONCEPT: Database indexes speed up common queries
// HINT: What queries will you run most often in a restaurant?
// EXAMPLE: Finding available tables, tables by section, tables by waiter
// YOUR CODE HERE:
tableSchema.index({section:1,state:1});
const Table = mongoose.model('Table', tableSchema);

module.exports = Table;

/**
 * 🧪 TESTING YOUR SCHEMA:
 * 1. Try creating table with invalid section - should fail
 * 2. Try setting capacity to 15 - should fail  
 * 3. Try invalid state transition - should be handled by business logic
 * 4. Test virtual fields work correctly
 * 5. Test your custom methods
 * 
 * 📚 LEARNING RESOURCES:
 * - Mongoose Schema Guide: https://mongoosejs.com/docs/guide.html
 * - Validation: https://mongoosejs.com/docs/validation.html
 * - Middleware: https://mongoosejs.com/docs/middleware.html
 * 
 * 💭 ENGINEERING PATTERNS YOU'RE LEARNING:
 * - Data validation at multiple layers (client, API, database)
 * - Schema design that enforces business rules
 * - Performance optimization through strategic indexing
 * - Separation of concerns (data model vs business logic)
 * 
 * 🎯 ADVANCED CHALLENGES (AFTER BASIC SCHEMA WORKS):
 * - Add validation that prevents double-booking
 * - Add compound indexes for complex queries
 * - Add schema versioning for future changes
 * - Add soft delete functionality
 */
