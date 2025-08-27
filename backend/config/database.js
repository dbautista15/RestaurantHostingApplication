// backend/config/database.js
require('dotenv').config();
const mongoose = require('mongoose');
/**
 * 🎯 YOUR ENGINEERING TASK: Database Connection Management
 * 
 * LEARNING OBJECTIVES:
 * - How to handle async database connections
 * - Connection error handling and retry logic
 * - Environment-based configuration
 * - Database connection events and monitoring
 * 
 * REQUIREMENTS:
 * 1. Connect to MongoDB using mongoose
 * 2. Handle connection errors gracefully
 * 3. Use environment variables for connection string
 * 4. Log connection status (success/failure)
 * 5. Set up connection event listeners
 * 
 * ENGINEERING QUESTIONS TO CONSIDER:
 * - Should the app crash if database is unavailable?
 * - How many times should you retry connection?
 * - What connection options optimize for high read/write?
 * - How do you handle connection drops during operation?
 */

const connectDatabase = async () => {
  try {
    // TODO: Implement MongoDB connection
    // HINT: Use mongoose.connect() with proper options
    // HINT: Connection string should come from process.env.MONGODB_URI
    // HINT: Consider connection options like maxPoolSize, serverSelectionTimeoutMS

    const connectionString = process.env.MONGODB_URI || "Error: MONGODB_URI is not defined inside the .env file.";
    await mongoose.connect(connectionString)
    //log any errors after the initial connection has been established. 
    console.log('Connected to MongoDB successfully');

    // TODO: Set up connection event listeners
    // HINT: mongoose.connection has 'error', 'disconnected', 'reconnected' events
    // YOUR CODE HERE:
    mongoose.connection.on('disconnected',()=>console.log('Disconnected'));
    mongoose.connection.on('reconnected',()=>console.log('reconnected'));
  } catch (error) {
    // TODO: Implement proper error handling
    // ENGINEERING DECISION: Should server exit or keep retrying?
    // YOUR CODE HERE:
    console.error('MongoDB connection failed:and exited the node.js process with a code of 1.', error.message);
    process.exit(1);
  }
};

// TODO: Optional - Implement graceful shutdown
const closeDatabase = async () => {
  // YOUR CODE HERE: Close mongoose connection   
  await mongoose.connection.close(); 
};

module.exports = { connectDatabase, closeDatabase };

/**
 * 📚 LEARNING RESOURCES:
 * - Mongoose Connection Guide: https://mongoosejs.com/docs/connections.html
 * - MongoDB Connection Options: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/
 * 
 * 🧪 TESTING YOUR IMPLEMENTATION:
 * 1. Start with invalid connection string - should handle error
 * 2. Start MongoDB server - should connect successfully
 * 3. Stop MongoDB while app running - should detect disconnection
 * 
 * 💭 ARCHITECTURAL CONSIDERATIONS:
 * - Connection pooling for multiple simultaneous requests
 * - Timeout values for restaurant environment (fast responses needed)
 * - Monitoring and alerting for production deployment
 */

// Test the connection when running file directly
if (require.main === module) {
  connectDatabase()
    .then(() => {
      console.log('✅ Database test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database test failed:', error.message);
      process.exit(1);
    });
}