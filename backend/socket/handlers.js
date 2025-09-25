// backend/socket/handlers.js - Complete Implementation
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * 🎯 WebSocket Event Handlers with Authentication
 */
const handleConnection = (socket, io) => {
  console.log("Client connected:", socket.id);

  // Handle authentication
  socket.on("authenticate", async (data, callback) => {
    try {
      const { token } = data;
      if (!token) {
        callback({ success: false, error: "No token provided" });
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        callback({ success: false, error: "Invalid user" });
        return;
      }

      // Store user info on socket
      socket.userId = user._id;
      socket.userRole = user.role;
      socket.userSection = user.section;
      socket.userName = user.userName;
      socket.authenticated = true;

      console.log(`✅ Socket authenticated: ${user.userName} (${user.role})`);
      callback({ success: true });
    } catch (error) {
      console.error("Socket authentication error:", error);
      callback({ success: false, error: "Authentication failed" });
    }
  });

  // Handle room joining
  socket.on("join_room", (data) => {
    if (!socket.authenticated) {
      console.warn("Unauthenticated socket tried to join room");
      return;
    }

    const { type, room } = data;

    if (type === "role") {
      socket.join(room);
      console.log(`Socket ${socket.id} joined role room: ${room}`);
    } else if (type === "section" && socket.userRole === "waiter") {
      socket.join(room);
      console.log(`Socket ${socket.id} joined section room: ${room}`);
    }
  });

  // Handle table state sync
  socket.on("sync_table_state", (data) => {
    if (!socket.authenticated) return;

    console.log(`Table state sync from ${socket.userName}:`, data);

    // Broadcast to all OTHER connected devices (not the sender)
    socket.broadcast.emit("table_state_synced", {
      ...data,
      syncedBy: {
        id: socket.userId,
        name: socket.userName,
        role: socket.userRole,
      },
    });
  });

  // Handle global refresh requests
  socket.on("request_refresh", (data) => {
    if (!socket.authenticated) return;

    console.log(`Global refresh requested by ${socket.userName}:`, data.reason);

    // Broadcast to all clients except sender
    socket.broadcast.emit("request_refresh", {
      ...data,
      requestedBy: {
        id: socket.userId,
        name: socket.userName,
        role: socket.userRole,
      },
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(
      `Client disconnected: ${socket.id} ${
        socket.userName ? `(${socket.userName})` : ""
      }`
    );
  });
};

// Broadcast table state change to all clients
const broadcastTableStateChange = (io, tableData, excludeSocketId = null) => {
  const event = {
    type: "table_state_changed",
    table: tableData,
    timestamp: new Date().toISOString(),
  };

  if (excludeSocketId) {
    io.except(excludeSocketId).emit("table_state_changed", event);
  } else {
    io.emit("table_state_changed", event);
  }
};

// Broadcast waitlist update
const broadcastWaitlistUpdate = (io, action, entry) => {
  io.emit("waitlist_updated", {
    action, // 'added', 'removed', 'seated', 'updated'
    entry,
    timestamp: new Date().toISOString(),
  });
};

// Broadcast shift configuration change
const broadcastShiftConfigChange = (io, configData, changedBy) => {
  io.emit("shift_configuration_changed", {
    configuration: configData,
    changedBy,
    timestamp: new Date().toISOString(),
  });
};

// Broadcast fairness matrix update
const broadcastFairnessUpdate = (io, matrixData) => {
  io.emit("fairness_matrix_updated", {
    matrix: matrixData,
    timestamp: new Date().toISOString(),
  });
};

// Send notification to specific role or section
const sendNotification = (io, target, notification) => {
  if (target.type === "role") {
    io.to(target.value).emit("notification", notification);
  } else if (target.type === "section") {
    io.to(`section_${target.value}`).emit("notification", notification);
  } else if (target.type === "user") {
    // Find socket by userId
    const sockets = io.sockets.sockets;
    for (const [socketId, socket] of sockets) {
      if (socket.userId === target.value) {
        socket.emit("notification", notification);
      }
    }
  }
};

module.exports = {
  handleConnection,
  broadcastTableStateChange,
  broadcastWaitlistUpdate,
  broadcastShiftConfigChange,
  broadcastFairnessUpdate,
  sendNotification,
};
