// Your updated server.js should look like this:
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const { connectDatabase, closeDatabase } = require('./config/database');

// Import your route handlers
const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/tables');
const waitlistRoutes = require('./routes/waitlist');
const shiftRoutes = require('./routes/shifts'); // NEW: Add this line

const port = process.env.PORT || 3001;
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io available to routes
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/shifts', shiftRoutes); // NEW: Add this line

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New User Connected:', socket.id);
  
  socket.emit('newMessage', {
    from: 'Server',
    text: 'Welcome to restaurant management!',
    createdAt: Date.now()
  });

  socket.on('createMessage', (message) => {
    console.log('New Message:', message);
    io.emit('newMessage', message);
  });

  // NEW: Handle table state sync between devices (iPad host <-> iPad waiter)
  socket.on('sync_table_state', (data) => {
    console.log('Table state sync:', data);
    // Broadcast to all OTHER connected devices (not the sender)
    socket.broadcast.emit('table_state_synced', data);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected:', socket.id);
  });
});

// Server startup
const startServer = async () => {
  try {
    await connectDatabase();
    
    server.listen(port, () => {
      console.log(` Server is up on port: ${port}`);
      console.log(` Health check: http://localhost:${port}/api/health`);
      console.log(` Auth endpoint: http://localhost:${port}/api/auth`);
      console.log(`  Tables endpoint: http://localhost:${port}/api/tables`);
      console.log(` Waitlist endpoint: http://localhost:${port}/api/waitlist`);
      console.log(` Shifts endpoint: http://localhost:${port}/api/shifts`); // NEW
    });
    
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

startServer();