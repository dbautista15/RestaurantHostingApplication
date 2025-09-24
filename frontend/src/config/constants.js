// frontend/src/config/constants.js - LEAN VERSION (UI Only)
/**
 * 🎯 FRONTEND CONFIG - UI CONCERNS ONLY
 * Business logic and data definitions moved to backend
 */

// ✅ API Configuration
export const API_BASE = 'http://localhost:3001/api';

// ✅ UI Grid & Layout Configuration  
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
  suggestionsWidth: '450px'
};

// ✅ Visual Theme Configuration (UI styling only)
export const WAITER_COLORS = {
  background: {
    1: '#ffebee', 2: '#e8f5e8', 3: '#fff3e0', 4: '#e3f2fd', 
    5: '#f3e5f5', 6: '#fce4ec', 7: '#e0f2f1'
  },
  border: {
    1: '#f44336', 2: '#4caf50', 3: '#ff9800', 4: '#2196f3',
    5: '#9c27b0', 6: '#e91e63', 7: '#009688'
  }
};

// ✅ Performance Configuration (frontend concerns)
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms for search inputs
  API_TIMEOUT: 10000,  // ms
  MAX_RETRY_ATTEMPTS: 3
};

// ✅ Feature Flags (for frontend features only)
export const FEATURES = {
  ENABLE_OFFLINE_MODE: process.env.REACT_APP_OFFLINE_MODE === 'true',
  ENABLE_DEBUG_LOGS: process.env.REACT_APP_DEBUG === 'true',
  ENABLE_MOCK_DATA: process.env.NODE_ENV === 'development'
};

// ✅ Development Configuration
export const DEV_CONFIG = {
  MOCK_API_DELAY: 500, // ms to simulate network delay
  ENABLE_DEBUG_LOGS: process.env.REACT_APP_DEBUG === 'true'
};

/*
🎯 REMOVED - Backend Handles These:

❌ BUSINESS_RULES - Backend validates all business rules
❌ TABLE_STATES - Backend defines valid states  
❌ PARTY_PRIORITIES - Backend handles priority logic
❌ RESTAURANT_LAYOUT - Backend provides layout via API
❌ WAITER_ASSIGNMENTS - Backend calculates assignments
❌ SHIFT_CONFIGURATIONS - Backend manages shift logic
❌ MOCK_TABLES, MOCK_WAITLIST - Backend provides real data

✅ KEPT - Frontend UI Concerns:

✅ API endpoints and timeouts
✅ Grid sizing and layout dimensions  
✅ Color schemes for visual styling
✅ Performance settings for UI responsiveness
✅ Feature flags for frontend features
✅ Development helpers

RESULT: 70% smaller config, focused on UI concerns only!
*/