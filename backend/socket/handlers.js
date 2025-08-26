// backend/socket/handlers.js

/**
 * 🎯 YOUR ENGINEERING TASK: WebSocket Event Handlers
 * 
 * LEARNING OBJECTIVES:
 * - Real-time event handling
 * - Socket room management
 * - Event-driven architecture
 * - Broadcast patterns
 */

const handleConnection = (socket, io) => {
  console.log('Client connected:', socket.id);

  // TODO: Handle user authentication
  socket.on('authenticate', (data) => {
    // TODO: Verify JWT token
    // TODO: Store user info on socket
    // YOUR CODE HERE:
  });

  // TODO: Handle room joining
  socket.on('join_room', (data) => {
    // TODO: Join section and role-based rooms
    // EXAMPLE: socket.join(`section_${data.section}`)
    // YOUR CODE HERE:
  });

  // TODO: Handle table action events
  socket.on('table_action', (data) => {
    // TODO: Validate action
    // TODO: Broadcast to appropriate rooms
    // YOUR CODE HERE:
  });

  // TODO: Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // TODO: Cleanup if needed
  });
};

// TODO: Broadcast table state change to all clients
const broadcastTableStateChange = (io, tableData) => {
  // TODO: Emit to all connected clients
  // TODO: Consider room-based broadcasting for performance
  // YOUR CODE HERE:
};

// TODO: Broadcast waitlist update
const broadcastWaitlistUpdate = (io, action, entry) => {
  // TODO: Broadcast waitlist changes
  // YOUR CODE HERE:
};

module.exports = {
  handleConnection,
  broadcastTableStateChange,
  broadcastWaitlistUpdate
};