// backend/server.js - Updated WebSocket section
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const { connectDatabase, closeDatabase } = require("./config/database");
const { handleConnection } = require("./socket/handlers"); // Import the new handler

// Import your route handlers
const authRoutes = require("./routes/auth");
const tableRoutes = require("./routes/tables");
const waitlistRoutes = require("./routes/waitlist");
const shiftRoutes = require("./routes/shifts");

const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

// 🎯 ENHANCED Socket.IO setup with better CORS handling
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  // Additional options for production
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Make io available to routes
app.set("io", io);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    websocket: io.engine.clientsCount || 0,
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/waitlist", require("./routes/waitlist"));
app.use("/api/tables", require("./routes/tables"));
app.use("/api/shifts", require("./routes/shifts"));
app.use("/api/seating", require("./routes/seating"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/demo", require("./routes/demo"));
app.use("/api/users", require("./routes/users"));

// 🎯 ENHANCED Socket.IO connection handling
io.on("connection", (socket) => {
  // Use the enhanced handler from socket/handlers.js
  handleConnection(socket, io);
});

// Example: How to emit events from routes
// In your routes, you can now do:
// const io = req.app.get('io');
// broadcastTableStateChange(io, tableData);

// Server startup
const startServer = async () => {
  try {
    await connectDatabase();

    server.listen(port, () => {
      console.log(`🚀 Server is up on port: ${port}`);
      console.log(`🔌 WebSocket server ready`);
      console.log(
        `📡 CORS allowed origin: ${
          process.env.CLIENT_URL || "http://localhost:3001"
        }`
      );
      console.log(`💚 Health check: http://localhost:${port}/api/health`);
      console.log(`🔐 Auth endpoint: http://localhost:${port}/api/auth`);
      console.log(`🪑 Tables endpoint: http://localhost:${port}/api/tables`);
      console.log(
        `📋 Waitlist endpoint: http://localhost:${port}/api/waitlist`
      );
      console.log(`👥 Shifts endpoint: http://localhost:${port}/api/shifts`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  io.close();
  await closeDatabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully...");
  io.close();
  await closeDatabase();
  process.exit(0);
});

startServer();
