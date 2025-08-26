// frontend/src/utils/constants.js

/**
 * 📋 FRONTEND CONSTANTS (PROVIDED FOR YOU)
 * Centralized constants for consistent data across the app
 */

// Table states - must match backend enum values
export const TABLE_STATES = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  OCCUPIED: 'occupied'
};

// User roles - must match backend enum values  
export const USER_ROLES = {
  HOST: 'host',
  WAITER: 'waiter',
  MANAGER: 'manager'
};

// Restaurant sections
export const SECTIONS = ['A', 'B', 'C'];

// WebSocket event types
export const SOCKET_EVENTS = {
  // Incoming events (from server)
  TABLE_STATE_CHANGED: 'table_state_changed',
  WAITLIST_UPDATED: 'waitlist_updated',
  AUDIT_EVENT: 'audit_event',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  
  // Outgoing events (to server)
  JOIN_ROOM: 'join_room',
  AUTHENTICATE: 'authenticate',
  TABLE_ACTION: 'table_action'
};

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  TABLES: '/tables',
  WAITLIST: '/waitlist',
  ANALYTICS: '/analytics/dashboard'
};

// UI constants
export const UI_CONSTANTS = {
  MAX_PARTY_SIZE: 10,
  MIN_PARTY_SIZE: 1,
  MAX_TABLE_CAPACITY: 12,
  REFRESH_INTERVAL: 5000, // 5 seconds
  TOAST_DURATION: 3000,
  CONNECTION_TIMEOUT: 10000
};

// Color schemes for table states
export const STATE_COLORS = {
  [TABLE_STATES.AVAILABLE]: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-800',
    button: 'bg-green-500 hover:bg-green-600'
  },
  [TABLE_STATES.ASSIGNED]: {
    bg: 'bg-yellow-100', 
    border: 'border-yellow-500',
    text: 'text-yellow-800',
    button: 'bg-yellow-500 hover:bg-yellow-600'
  },
  [TABLE_STATES.OCCUPIED]: {
    bg: 'bg-red-100',
    border: 'border-red-500', 
    text: 'text-red-800',
    button: 'bg-red-500 hover:bg-red-600'
  }
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet.',
  AUTH_FAILED: 'Login failed. Please check your credentials.',
  UNAUTHORIZED: 'You are not authorized for this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_INPUT: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TABLE_CONFLICT: 'This table has been updated by another user.',
  MAX_TABLES_REACHED: 'Waiter has reached maximum table limit.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  TABLE_ASSIGNED: 'Table assigned successfully',
  TABLE_CLEARED: 'Table cleared successfully', 
  PARTY_ADDED: 'Party added to waitlist',
  PARTY_SEATED: 'Party seated successfully'
};

export default {
  TABLE_STATES,
  USER_ROLES,
  SECTIONS,
  SOCKET_EVENTS,
  API_ENDPOINTS,
  UI_CONSTANTS,
  STATE_COLORS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};