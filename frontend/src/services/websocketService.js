// frontend/src/services/websocketService.js
import { io } from "socket.io-client";
import { getToken } from "../hooks/useAction";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * 🎯 Initialize WebSocket connection with auth
   */
  connect() {
    if (this.socket?.connected) {
      console.log("WebSocket already connected");
      return this.socket;
    }

    const token = getToken();
    if (!token) {
      console.warn("No auth token available for WebSocket connection");
      return null;
    }

    // Configure socket with CORS and auth
    this.socket = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  /**
   * 🎯 Setup core event handlers
   */
  setupEventHandlers() {
    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected:", this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;

      // Authenticate after connection
      this.authenticate();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      this.connected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        this.disconnect();
      }
    });

    // Business events
    this.setupBusinessEventHandlers();
  }

  /**
   * 🎯 Authenticate socket connection
   */
  authenticate() {
    const token = getToken();
    if (!token || !this.socket) return;

    this.socket.emit("authenticate", { token }, (response) => {
      if (response?.success) {
        console.log("✅ WebSocket authenticated");
        // Join appropriate rooms based on user role
        this.joinUserRooms();
      } else {
        console.error("❌ WebSocket authentication failed");
        this.disconnect();
      }
    });
  }

  /**
   * 🎯 Join role/section based rooms
   */
  joinUserRooms() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || !this.socket) return;

    // Join role-based room
    this.socket.emit("join_room", {
      type: "role",
      room: user.role,
    });

    // Join section room if waiter
    if (user.role === "waiter" && user.section) {
      this.socket.emit("join_room", {
        type: "section",
        room: `section_${user.section}`,
      });
    }

    console.log("✅ Joined appropriate rooms");
  }

  /**
   * 🎯 Setup business event handlers
   */
  setupBusinessEventHandlers() {
    // Table state updates
    this.socket.on("table_state_changed", (data) => {
      console.log("📊 Table state changed:", data);
      this.notifyListeners("table_state_changed", data);
    });

    // Waitlist updates
    this.socket.on("waitlist_updated", (data) => {
      console.log("📋 Waitlist updated:", data);
      this.notifyListeners("waitlist_updated", data);
    });

    // Shift configuration changes
    this.socket.on("shift_configuration_changed", (data) => {
      console.log("⚙️ Shift configuration changed:", data);
      this.notifyListeners("shift_configuration_changed", data);
    });

    // Fairness matrix updates
    this.socket.on("fairness_matrix_updated", (data) => {
      console.log("⚖️ Fairness matrix updated:", data);
      this.notifyListeners("fairness_matrix_updated", data);
    });

    // Real-time notifications
    this.socket.on("notification", (data) => {
      console.log("🔔 Notification:", data);
      this.notifyListeners("notification", data);
    });

    // Table sync between devices
    this.socket.on("table_state_synced", (data) => {
      console.log("🔄 Table state synced from another device:", data);
      this.notifyListeners("table_state_synced", data);
    });
  }

  /**
   * 🎯 Subscribe to events
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * 🎯 Notify all listeners for an event
   */
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * 🎯 Emit events to server
   */
  emit(event, data, callback) {
    if (!this.socket?.connected) {
      console.warn("Cannot emit - WebSocket not connected");
      return;
    }

    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  /**
   * 🎯 Sync table state across devices
   */
  syncTableState(tableData) {
    this.emit("sync_table_state", {
      table: tableData,
      timestamp: new Date().toISOString(),
      deviceId: this.socket?.id,
    });
  }

  /**
   * 🎯 Request dashboard refresh for all clients
   */
  requestGlobalRefresh(reason) {
    this.emit("request_refresh", {
      reason,
      requestedBy: JSON.parse(localStorage.getItem("user") || "{}"),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 🎯 Disconnect and cleanup
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
      console.log("🔌 WebSocket disconnected and cleaned up");
    }
  }

  /**
   * 🎯 Check connection status
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

// Helper hook for React components
export const useWebSocket = () => {
  return wsService;
};
