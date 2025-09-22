// frontend/src/config/constants.js
/**
 * 🎯 CONSOLIDATED CONSTANTS
 * All application constants in one place
 */

// API Configuration
export const API_BASE = 'http://localhost:3000/api';

// Grid & Layout Configuration
export const GRID_CONFIG = {
  size: 30,
  cols: 22,
  rows: 18
};

export const LAYOUT_CONFIG = {
  waitlistWidth: '350px',
  floorplanMinWidth: '600px',
  minWaitlistWidth: '250px',
  minSuggestionsWidth: '380px',
  suggestionsWidth: '450px' // Added missing property used in ThreePanelLayout
};

// Visual Theme Configuration
export const WAITER_COLORS = {
  background: {
    1: '#ffebee', 2: '#e8f5e8', 3: '#fff3e0', 4: '#e3f2fd', 5: '#f3e5f5', 6: '#fce4ec', 7: '#e0f2f1'
  },
  border: {
    1: '#f44336', 2: '#4caf50', 3: '#ff9800', 4: '#2196f3', 5: '#9c27b0', 6: '#e91e63', 7: '#009688'
  }
};

// Re-export restaurant layout constants
export { RESTAURANT_LAYOUT, WAITER_ASSIGNMENTS } from './restaurantLayout';

// Re-export mock data for development
export { 
  MOCK_WAITLIST, 
  MOCK_TABLES, 
  MOCK_SUGGESTIONS,
  MOCK_SHIFT_CONFIGS,
  getRandomMockParty,
  getDevelopmentConfig 
} from './mockData';

// Application States
export const TABLE_STATES = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned', 
  OCCUPIED: 'occupied'
};

export const PARTY_PRIORITIES = {
  NORMAL: 'normal',
  LARGE_PARTY: 'large_party',
  COWORKER: 'coworker'
};

export const PARTY_STATUS = {
  WAITING: 'waiting',
  SEATED: 'seated',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

// Business Rules
export const BUSINESS_RULES = {
  MAX_PARTY_SIZE: 20,
  MIN_PARTY_SIZE: 1,
  MAX_TABLES_PER_WAITER: 5,
  DEFAULT_TIME_QUANTUM: 15, // minutes
  MAX_WAIT_TIME_ESTIMATE: 120 // minutes
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms for search inputs
  SOCKET_RECONNECT_DELAY: 5000, // ms
  API_TIMEOUT: 10000, // ms
  MAX_RETRY_ATTEMPTS: 3
};

// Feature Flags (for safe rollouts)
export const FEATURES = {
  BACKGROUND_SYNC: process.env.REACT_APP_BACKGROUND_SYNC === 'true',
  OPTIMISTIC_UPDATES: process.env.REACT_APP_OPTIMISTIC_UPDATES === 'true',
  REAL_TIME_VALIDATION: process.env.REACT_APP_REAL_TIME_VALIDATION === 'true',
  SMART_SUGGESTIONS: true, // Always enabled
  FAIRNESS_MATRIX: true   // Always enabled
};

// Development Configuration
export const DEV_CONFIG = {
  ENABLE_MOCK_DATA: process.env.NODE_ENV === 'development',
  ENABLE_DEBUG_LOGS: process.env.REACT_APP_DEBUG === 'true',
  MOCK_API_DELAY: 500 // ms to simulate network delay
};