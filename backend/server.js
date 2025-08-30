// backend/server.js
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
// TODO: Import your database connection
// YOUR CODE HERE:
const { connectDatabase, closeDatabase } = require('./config/database');

// TODO: Import your route handlers (will implement later)
// YOUR CODE HERE:
// const authRoutes = require('./routes/auth');
// const tableRoutes = require('./routes/tables');
// const waitlistRoutes = require('./routes/waitlist');

/**
 * 🎯 YOUR ENGINEERING TASK: Express Server Setup
 * 
 * LEARNING OBJECTIVES:
 * - Express application architecture
 * - Middleware pipeline design
 * - Server startup sequence and error handling
 * - HTTP server vs Socket.IO server integration
 * 
 * REQUIREMENTS:
 * - Create Express app with essential middleware
 * - Integrate database connection with server startup
 * - Set up Socket.IO for real-time features
 * - Handle server startup errors gracefully
 * - Provide health check endpoint for monitoring
 */

// TODO: Create Express application
// YOUR CODE HERE:

// TODO: Create HTTP server for Socket.IO integration
// HINT: const server = createServer(app);
// YOUR CODE HERE:

// TODO: Set up Socket.IO server
// HINT: const io = new Server(server, { cors: { origin: "...", methods: [...] } });
// YOUR CODE HERE:

// TODO: Set up essential middleware
// REQUIREMENTS: 
// 1. CORS for frontend communication
// 2. JSON body parsing
// 3. Request logging (optional but useful)
// YOUR CODE HERE:

// TODO: Set up health check endpoint
// ENGINEERING PATTERN: Always include a health check for monitoring
// ENDPOINT: GET /api/health
// RESPONSE: { status, timestamp, database: connected/disconnected }
// YOUR CODE HERE:

// TODO: Set up API routes (will implement these route files later)
// PATTERN: app.use('/api/auth', authRoutes);
// YOUR CODE HERE:

// TODO: Set up error handling middleware (should be last)
// ENGINEERING PATTERN: Global error handler catches all unhandled errors
// YOUR CODE HERE:

// TODO: Set up Socket.IO connection handling
// YOUR CODE HERE:

/**
 * TODO: Implement server startup function
 * 
 * ENGINEERING DECISIONS TO MAKE:
 * 1. Should server start if database connection fails?
 * 2. What's the startup sequence? (Database first, then HTTP server?)
 * 3. How do you handle startup errors vs runtime errors?
 * 4. What information should be logged on successful startup?
 * 
 * STARTUP SEQUENCE:
 * 1. Connect to database
 * 2. Start HTTP server
 * 3. Log success information
 * 4. Handle any startup errors
 */
const startServer = async () => {
  try {
    // TODO: Connect to database first
    // ENGINEERING QUESTION: Should you exit if database fails?
    // YOUR CODE HERE:
    
    // TODO: Start HTTP server
    // HINT: server.listen(PORT, callback)
    // YOUR CODE HERE:
    
    // TODO: Log successful startup information
    // WHAT TO LOG: Port, database status, available endpoints
    // YOUR CODE HERE:
    
  } catch (error) {
    // TODO: Handle startup errors
    // ENGINEERING DECISION: Log error and exit, or attempt recovery?
    // YOUR CODE HERE:
  }
};

// TODO: Set up graceful shutdown handling
// ENGINEERING PATTERN: Clean up resources on process termination
process.on('SIGTERM', () => {
  // YOUR CODE HERE:
  // 1. Close database connections
  // 2. Close HTTP server
  // 3. Exit process
});

// TODO: Start the server
// YOUR CODE HERE:

/**
 * 📚 LEARNING RESOURCES:
 * - Express.js Guide: https://expressjs.com/en/guide/routing.html
 * - Socket.IO Server Setup: https://socket.io/docs/v4/server-initialization/
 * - Node.js HTTP Module: https://nodejs.org/api/http.html
 * 
 * 🧪 TESTING YOUR SERVER:
 * 1. Server starts without errors
 * 2. Health check endpoint responds
 * 3. CORS headers allow frontend requests
 * 4. Database connection is established
 * 5. Server shuts down gracefully
 * 
 * 💭 ARCHITECTURAL DECISIONS:
 * - Middleware order matters (CORS before routes, error handler last)
 * - Database connection before server start vs parallel startup
 * - Error handling strategy (fail fast vs graceful degradation)
 * - Logging level and format for debugging vs production
 * 
 * 🎯 ENGINEERING PATTERNS TO IMPLEMENT:
 * - Dependency injection (database connection into routes)
 * - Middleware pipeline (request → auth → routes → error handler)
 * - Graceful shutdown (cleanup resources on exit)
 * - Health check endpoint (for monitoring and load balancers)
 */