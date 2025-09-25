// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * 🎯 YOUR ENGINEERING TASK: User/Staff Schema Design
 * 
 * LEARNING OBJECTIVES:
 * - User authentication schema design
 * - Password hashing and security
 * - Role-based access control modeling
 * - Instance methods for user operations
 * 
 * REQUIREMENTS FROM YOUR SPECS:
 * - Clock number (unique identifier for staff)
 * - Name and role (host, waiter, manager)
 * - Section assignment for waiters
 * - Password hashing for security
 * - Active status for shift management
 * - Shift tracking for restaurant operations
 */

const userSchema = new mongoose.Schema({
  // TODO: Define clockInNumber field
  // REQUIREMENTS: String, unique, required (like "H001", "W001")
  // HINT: This is how staff identify themselves at login
  // YOUR CODE HERE:
  clockInNumber:{
	type:String,
	required:true,
	unique:true,
  trim:true,
  uppercase:true,   
   validator: function(v) {
      // Allow formats like: H001, W042, 123, etc.
      return /^[A-Z]?\d{2,4}$/.test(v);
    },
    message: 'Use your number that you use to clock in at work'
  },
  // TODO: Define name field
  // REQUIREMENTS: String, required
  // YOUR CODE HERE:
  userName:{
	type:String,
	required:true
  },
  // TODO: Define role field
  // REQUIREMENTS: String, enum of ['host', 'waiter', 'manager'], required
  // HINT: This determines what actions users can perform
  // YOUR CODE HERE:
  role:{
	type:String,
	required:true,
	enum:['host','waiter']
  },
  // TODO: Define section field
  // REQUIREMENTS: String, enum of ['A', 'B', 'C'], optional (only for waiters)
  // HINT: Waiters are assigned to specific restaurant sections
  // YOUR CODE HERE:
  section:{
	type:Number,
	min:1,
	max:7
  },
  // TODO: Define passwordHash field
  // REQUIREMENTS: String, required
  // ENGINEERING NOTE: Never store plain text passwords!
  // YOUR CODE HERE:
  passwordHash:{
	type:String,
	required:true
  },
  // TODO: Define isActive field
  // REQUIREMENTS: Boolean, default true
  // HINT: Allows disabling users without deleting them
  // YOUR CODE HERE:
  isActive:{
	type:Boolean,
	default:true
  },
  // TODO: Define shiftStart field
  // REQUIREMENTS: Date, optional
  // HINT: Track when user started their current shift
  // YOUR CODE HERE:
  shiftStart:{
	type:Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // TODO: Remove password from JSON output for security
      // HINT: delete ret.passwordHash;
      // YOUR CODE HERE:
	  delete ret.passwordHash;
      return ret;
    }
  }
});

// TODO: Add virtual fields
// ENGINEERING CONCEPT: Computed properties that aren't stored in database
// EXAMPLE: isOnShift, shiftDuration, displayName
// YOUR CODE HERE:
userSchema.virtual('isOnShift').get(function() {
	return !!this.shiftStart;
});
userSchema.virtual('displayName').get(function() {
	return `${this.userName} (${this.role})`;
});
userSchema.virtual('shiftDuration').get(function(){
  if(!this.shiftStart) return 0;
return Math.floor((new Date() - this.shiftStart) / (1000 * 60));
});

// TODO: Add pre-save middleware for password hashing
// ENGINEERING CONCEPT: Middleware runs before save operations
// REQUIREMENT: Hash password before saving to database
userSchema.pre('save', async function(next) {
  // YOUR CODE HERE:
  // 1. Check if password was modified
  // 2. Hash the password using bcrypt
  // 3. Replace plain text with hash
  // HINT: Use bcrypt.hash() with saltRounds of 10
 if(this.isModified('passwordHash')){
	this.passwordHash = await bcrypt.hash(this.passwordHash,10);
} 
  next();
});

// TODO: Add instance methods
// ENGINEERING CONCEPT: Methods that can be called on user documents

// Method to verify password during login
userSchema.methods.verifyPassword = async function(candidatePassword) {
  // TODO: Compare plain text password with hashed password
  // HINT: Use bcrypt.compare()
  // RETURN: Boolean (true if passwords match)
  // YOUR CODE HERE:
	return await bcrypt.compare(candidatePassword,this.passwordHash);
};

// Method to start a shift
userSchema.methods.startShift = function() {
  // TODO: Set shiftStart to current time
  // YOUR CODE HERE:
  if(!this.shiftStart){
	this.shiftStart = new Date;
  }

};

// Method to end shift
userSchema.methods.endShift = function() {
  // TODO: Clear shiftStart field
	this.shiftStart = null;
};

// TODO: Add static methods (called on User model)
// ENGINEERING CONCEPT: Methods called on the model itself, not instances

// Find active users by role
userSchema.statics.findActiveByRole = function(role) {
  // TODO: Find users with specific role who are active
  // YOUR CODE HERE:
  // return this.find({ role, isActive: true });
  return this.find({role,isActive:true,})
};

// Find waiters in a specific section
userSchema.statics.findWaitersInSection = function(section) {
  // TODO: Find active waiters assigned to a section
  // YOUR CODE HERE:
  return this.find({role:'waiter',isActive:true,section})
};

// TODO: Add indexes for query performance
// ENGINEERING CONCEPT: Database indexes speed up common queries
// HINT: What queries will you run most often?
// EXAMPLE: Finding by clock number (login), finding by role, finding by section
// YOUR CODE HERE:
userSchema.index({clockInNumber:1});
userSchema.index({role:1,isActive:1});
userSchema.index({role:1,section:1,isActive:1});


const User = mongoose.model('User', userSchema);

module.exports = User;

/**
 * 🧪 TESTING YOUR SCHEMA:
 * 1. Create user with valid data - should succeed
 * 2. Try duplicate clock number - should fail (unique constraint)
 * 3. Try invalid role - should fail (enum validation)
 * 4. Test password hashing - plain text should be hashed
 * 5. Test verifyPassword method - should work correctly
 * 6. Test virtual fields and methods
 * 
 * 📚 LEARNING RESOURCES:
 * - Mongoose Schema Guide: https://mongoosejs.com/docs/guide.html
 * - bcrypt Documentation: https://www.npmjs.com/package/bcrypt
 * - MongoDB Indexing: https://docs.mongodb.com/manual/indexes/
 * 
 * 💭 SECURITY CONSIDERATIONS:
 * - Never store plain text passwords
 * - Use sufficient salt rounds for bcrypt (10+ for production)
 * - Validate input data before hashing
 * - Consider password strength requirements
 * - Implement account lockout after failed attempts
 * 
 * 🎯 ADVANCED FEATURES (AFTER BASIC SCHEMA WORKS):
 * - Password reset tokens with expiration
 * - Login attempt tracking and lockout
 * - Role hierarchy (manager > host > waiter)
 * - Shift scheduling and time tracking
 */