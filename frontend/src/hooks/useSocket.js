// frontend/src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

/**
 * 🎯 YOUR ENGINEERING TASK: WebSocket Integration Hook
 * 
 * LEARNING OBJECTIVES:
 * - Real-time WebSocket connections
 * - Event-driven UI updates
 * - Connection state management
 * - Cleanup and memory management
 */

export const useSocket = (user, onTableUpdate, onActivityUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // TODO: Initialize socket connection
    // YOUR CODE HERE:
    // 1. Connect to WebSocket server
    // 2. Authenticate socket connection
    // 3. Join appropriate rooms (section, role)
    // 4. Set up event listeners
    
    // TODO: Create socket connection
    // socketRef.current = io('http://localhost:3001', { /* options */ });
    
    // TODO: Authentication
    // socketRef.current.emit('authenticate', { token: user.token });
    
    // TODO: Join rooms
    // socketRef.current.emit('join_room', { section: user.section, role: user.role });
    
    // TODO: Set up event listeners
    // ENGINEERING QUESTION: What events should trigger UI updates?
    
    // socketRef.current.on('table_state_changed', (data) => {
    //   // YOUR CODE HERE: Update table state
    //   onTableUpdate(data);
    // });
    
    // socketRef.current.on('audit_event', (data) => {
    //   // YOUR CODE HERE: Add to activity feed
    //   onActivityUpdate(data);
    // });
    
    // socketRef.current.on('connect', () => {
    //   // YOUR CODE HERE: Handle connection
    // });
    
    // socketRef.current.on('disconnect', () => {
    //   // YOUR CODE HERE: Handle disconnection
    // });

    // Cleanup function
    return () => {
      // TODO: Cleanup socket connection
      // YOUR CODE HERE:
      // 1. Remove event listeners
      // 2. Disconnect socket
      // 3. Clear references
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, onTableUpdate, onActivityUpdate]);

  // TODO: Utility functions for sending events
  const emitTableAction = (tableId, action, data) => {
    // YOUR CODE HERE: Emit table action events
    if (socketRef.current) {
      // socketRef.current.emit('table_action', { tableId, action, data });
    }
  };

  return {
    socket: socketRef.current,
    emitTableAction,
    isConnected: socketRef.current?.connected || false
  };
};
