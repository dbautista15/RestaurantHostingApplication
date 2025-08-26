// backend/models/Table.js
const mongoose = require('mongoose');

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
  
  // TODO: Define section field  
  // REQUIREMENTS: String, must be 'A', 'B', or 'C', required
  // HINT: Use enum validation
  // YOUR CODE HERE:
  
  // TODO: Define capacity field
  // REQUIREMENTS: Number, required, minimum 2, maximum 10
  // HINT: Use min and max validators
  // YOUR CODE HERE:
  
  // TODO: Define state field
  // REQUIREMENTS: String, enum of ['available', 'assigned', 'occupied'], default 'available'
  // HINT: This enforces your state machine at database level
  // YOUR CODE HERE:
  
  // TODO: Define assignedWaiter field
  // REQUIREMENTS: Reference to User model, optional (only when assigned/occupied)
  // HINT: Use mongoose.Schema.Types.ObjectId with ref
  // YOUR CODE HERE:
  
  // TODO: Define partySize field
  // REQUIREMENTS: Number, optional, minimum 1 when present
  // HINT: Only required when state is 'assigned' or 'occupied'
  // YOUR CODE HERE:
  
  // TODO: Define timestamp fields
  // REQUIREMENTS: Track when table was assigned and last state change
  // HINT: assignedAt (Date, optional), lastStateChange (Date, default now)
  // YOUR CODE HERE:
  
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

// TODO: Add schema methods (instance methods)
// ENGINEERING CONCEPT: Methods that can be called on individual table documents
// EXAMPLE: table.canTransitionTo('occupied'), table.assignTo(waiterId, partySize)
// YOUR CODE HERE:

// TODO: Add static methods (model methods) 
// ENGINEERING CONCEPT: Methods called on the Table model itself
// EXAMPLE: Table.getAvailableInSection('A'), Table.getWaiterWorkload(waiterId)
// YOUR CODE HERE:

// TODO: Add pre/post middleware hooks
// ENGINEERING CONCEPT: Code that runs before/after save, update, etc.
// EXAMPLE: Validate state transitions, log changes, update timestamps
// YOUR CODE HERE:

// TODO: Add indexes for query performance
// ENGINEERING CONCEPT: Database indexes speed up common queries
// HINT: What queries will you run most often in a restaurant?
// EXAMPLE: Finding available tables, tables by section, tables by waiter
// YOUR CODE HERE:

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