// frontend/src/services/socket.js
import io from 'socket.io-client';
import { SOCKET_EVENTS } from '../utils/constants';

/**
 * 🎯 YOUR ENGINEERING TASK: Socket.IO Client Service
 * 
 * LEARNING OBJECTIVES:
 * - WebSocket client connection management
 * - Event handling and cleanup
 * - Connection state management
 * - Reconnection strategies
 * - Error handling for real-time features
 */

class SocketService {
  constructor() {
    this.socket = null;
    this.connectionCallbacks = new Set();
    this.disconnectionCallbacks = new Set();
    this.eventListeners = new Map();
  }

  // TODO: Initialize socket connection
  connect(token, user) {
    // YOUR CODE HERE:
    // 1. Create socket.io connection to backend server
    // 2. Set up authentication with JWT token
    // 3. Handle connection events
    // 4. Join appropriate rooms based on user role/section
    // 5. Set up reconnection logic
    
    try {
      // TODO: Create socket connection
      // HINT: const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      // HINT: this.socket = io(serverUrl, { options });
      // YOUR CODE HERE:
      
      // TODO: Set up connection event handlers
      // YOUR CODE HERE:
      
      // TODO: Authenticate socket connection
      // HINT: this.socket.emit(SOCKET_EVENTS.AUTHENTICATE, { token });
      // YOUR CODE HERE:
      
      // TODO: Join rooms based on user info
      // HINT: this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { section: user.section, role: user.role });
      // YOUR CODE HERE:
      
    } catch (error) {
      console.error('Socket connection failed:', error);
    }
  }

  // TODO: Disconnect socket
  disconnect() {
    // YOUR CODE HERE:
    // 1. Clean up event listeners
    // 2. Disconnect socket
    // 3. Reset connection state
    
    if (this.socket) {
      // TODO: Remove all listeners and disconnect
      // YOUR CODE HERE:
    }
  }

  // TODO: Check if socket is connected
  isConnected() {
    // YOUR CODE HERE:
    // RETURN: Boolean indicating connection status
    return false; // Replace with actual implementation
  }

  // TODO: Add event listener
  on(eventName, callback) {
    // YOUR CODE HERE:
    // 1. Store callback for cleanup
    // 2. Add socket event listener
    // ENGINEERING PATTERN: Keep track of listeners for proper cleanup
    
    if (!this.socket) {
      console.warn('Socket not connected, cannot add listener');
      return;
    }
    
    // TODO: Implement event listener management
    // YOUR CODE HERE:
  }

  // TODO: Remove event listener
  off(eventName, callback) {
    // YOUR CODE HERE:
    // 1. Remove from stored callbacks
    // 2. Remove socket event listener
    
    if (!this.socket) return;
    
    // TODO: Implement event listener removal
    // YOUR CODE HERE:
  }

  // TODO: Emit event to server
  emit(eventName, data) {
    // YOUR CODE HERE:
    // 1. Check if socket is connected
    // 2. Emit event with data
    // 3. Handle errors
    
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, cannot emit event');
      return false;
    }
    
    // TODO: Emit event
    // YOUR CODE HERE:
  }

  // TODO: Add connection status callback
  onConnect(callback) {
    // YOUR CODE HERE:
    // Store callback to be called when socket connects
    this.connectionCallbacks.add(callback);
  }

  // TODO: Add disconnection callback
  onDisconnect(callback) {
    // YOUR CODE HERE:
    // Store callback to be called when socket disconnects
    this.disconnectionCallbacks.add(callback);
  }

  // TODO: Remove connection callbacks
  removeConnectionCallbacks() {
    // YOUR CODE HERE:
    this.connectionCallbacks.clear();
    this.disconnectionCallbacks.clear();
  }

  // TODO: Handle table state changes from server
  onTableStateChanged(callback) {
    // YOUR CODE HERE:
    // Listen for table state change events
    // HINT: Use SOCKET_EVENTS.TABLE_STATE_CHANGED
    this.on(SOCKET_EVENTS.TABLE_STATE_CHANGED, callback);
  }

  // TODO: Handle waitlist updates from server
  onWaitlistUpdated(callback) {
    // YOUR CODE HERE:
    // Listen for waitlist update events
    this.on(SOCKET_EVENTS.WAITLIST_UPDATED, callback);
  }

  // TODO: Handle audit events from server
  onAuditEvent(callback) {
    // YOUR CODE HERE:
    // Listen for audit/activity events
    this.on(SOCKET_EVENTS.AUDIT_EVENT, callback);
  }

  // TODO: Emit table action to server
  emitTableAction(tableId, action, data) {
    // YOUR CODE HERE:
    // Emit table action events (assign, seat, clear, cancel)
    return this.emit(SOCKET_EVENTS.TABLE_ACTION, {
      tableId,
      action,
      ...data
    });
  }

  // TODO: Handle connection errors and reconnection
  _setupConnectionHandlers() {
    // YOUR CODE HERE:
    // 1. Handle 'connect' event
    // 2. Handle 'disconnect' event  
    // 3. Handle 'connect_error' event
    // 4. Handle 'reconnect' event
    // 5. Call appropriate callbacks
    
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      // TODO: Handle successful connection
      // YOUR CODE HERE:
    });
    
    this.socket.on('disconnect', (reason) => {
      // TODO: Handle disconnection
      // YOUR CODE HERE:
    });
    
    this.socket.on('connect_error', (error) => {
      // TODO: Handle connection errors
      // YOUR CODE HERE:
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      // TODO: Handle reconnection
      // YOUR CODE HERE:
    });
  }

  // TODO: Get connection status info
  getConnectionInfo() {
    // YOUR CODE HERE:
    // Return object with connection details
    return {
      connected: this.isConnected(),
      transport: this.socket?.io?.engine?.transport?.name,
      socketId: this.socket?.id
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

/**
 * 🧪 TESTING YOUR SOCKET SERVICE:
 * 
 * 1. Test connection:
 *    - Call connect() with valid token and user
 *    - Verify socket connects to backend
 *    - Check connection status
 * 
 * 2. Test event handling:
 *    - Add event listeners
 *    - Trigger events from backend
 *    - Verify callbacks are called
 * 
 * 3. Test disconnection:
 *    - Call disconnect()
 *    - Verify cleanup happens
 *    - Verify no memory leaks
 * 
 * 4. Test error handling:
 *    - Disconnect backend server
 *    - Verify reconnection attempts
 *    - Verify error callbacks
 * 
 * 📚 LEARNING RESOURCES:
 * - Socket.IO Client API: https://socket.io/docs/v4/client-api/
 * - WebSocket Best Practices: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
 * 
 * 💭 ENGINEERING PATTERNS YOU'RE LEARNING:
 * - Singleton pattern for global socket connection
 * - Event-driven architecture
 * - Connection state management
 * - Error handling and recovery
 * - Memory management (preventing listener leaks)
 * 
 * 🎯 ADVANCED FEATURES (AFTER BASIC FUNCTIONALITY WORKS):
 * - Message queuing when offline
 * - Exponential backoff for reconnections
 * - Connection quality monitoring
 * - Automatic room re-joining after reconnect
 */