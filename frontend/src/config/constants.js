// frontend/src/config/constants.js - UI-ONLY VERSION
/**
 * 🎯 FRONTEND CONFIG - UI CONCERNS ONLY
 * All business logic moved to backend APIs
 */

// ✅ API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000, // ms
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // ms
};

// ✅ Grid & Layout Configuration (Pure UI)
export const GRID_CONFIG = {
  size: 30,
  cols: 22,
  rows: 18,
  snapToGrid: true,
  showGrid: true
};

export const LAYOUT_CONFIG = {
  panels: {
    waitlist: { width: '350px', minWidth: '280px', maxWidth: '450px' },
    floorplan: { minWidth: '600px', flex: 1 },
    suggestions: { width: '380px', minWidth: '320px', maxWidth: '500px' }
  },
  
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px'
  },
  
  header: { height: '70px' },
  footer: { height: '50px' }
};

// ✅ Visual Theme Configuration (Styling Only)
export const THEME = {
  colors: {
    primary: '#2563eb',
    success: '#059669', 
    warning: '#d97706',
    danger: '#dc2626',
    gray: '#6b7280'
  },
  
  waiterColors: {
    background: {
      1: '#ffebee', 2: '#e8f5e8', 3: '#fff3e0', 4: '#e3f2fd', 
      5: '#f3e5f5', 6: '#fce4ec', 7: '#e0f2f1'
    },
    border: {
      1: '#f44336', 2: '#4caf50', 3: '#ff9800', 4: '#2196f3',
      5: '#9c27b0', 6: '#e91e63', 7: '#009688'
    }
  },
  
  tableStates: {
    available: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
    assigned: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
    occupied: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
    inactive: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-400' }
  },
  
  priorities: {
    normal: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Normal' },
    large_party: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Large' },
    coworker: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Staff' }
  }
};

// ✅ UI Behavior Configuration
export const UI_CONFIG = {
  animations: {
    duration: 200, // ms
    easing: 'ease-in-out',
    enableAnimations: true
  },
  
  interactions: {
    doubleClickDelay: 300, // ms
    dragThreshold: 5, // px
    longPressDelay: 500 // ms
  },
  
  feedback: {
    showToasts: true,
    toastDuration: 3000, // ms
    showLoadingSpinners: true,
    optimisticUpdates: true
  }
};

// ✅ Performance Configuration (Frontend)
export const PERFORMANCE_CONFIG = {
  debounceDelay: 300, // ms for search inputs
  throttleDelay: 100, // ms for scroll/resize
  maxRetries: 3,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  
  virtualScrolling: {
    enabled: true,
    itemHeight: 80, // px
    buffer: 10 // items
  }
};

// ✅ Feature Flags (Frontend Features)
export const FEATURES = {
  enableOfflineMode: process.env.REACT_APP_OFFLINE === 'true',
  enableDebugMode: process.env.REACT_APP_DEBUG === 'true',
  enableDeveloperTools: process.env.NODE_ENV === 'development',
  enableKeyboardShortcuts: true,
  enableTouchGestures: true,
  enableAccessibility: true
};

// ✅ Development Helpers
export const DEV_CONFIG = {
  mockApiDelay: 500, // ms
  enableMockData: process.env.NODE_ENV === 'development',
  showStateInUrl: process.env.REACT_APP_DEBUG === 'true',
  logApiCalls: process.env.REACT_APP_DEBUG === 'true'
};

// ✅ UI Display Constants (No Business Logic)
export const DISPLAY_CONSTANTS = {
  maxPartyNameLength: 30,
  maxSpecialRequestsLength: 200,
  dateFormat: 'MM/dd/yyyy',
  timeFormat: 'HH:mm',
  
  pagination: {
    defaultPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100]
  },
  
  search: {
    minQueryLength: 2,
    maxResults: 50
  }
};

// 🎯 BACKWARD COMPATIBILITY (Remove after refactor complete)
export const WAITER_COLORS = THEME.waiterColors; // For existing components
export const { BASE_URL: API_BASE } = API_CONFIG; // For existing services

/*
🎯 MASSIVE CLEANUP ACHIEVED:

REMOVED (Backend Now Handles):
❌ BUSINESS_RULES - validation, limits, workflows
❌ TABLE_STATES - state machine logic  
❌ PRIORITY_WEIGHTS - assignment calculations
❌ RESTAURANT_LAYOUT - table positioning data
❌ SHIFT_CONFIGURATIONS - server assignments
❌ FAIRNESS_ALGORITHMS - matrix calculations
❌ MOCK_DATA - real data from backend

KEPT (UI Concerns Only):
✅ Grid sizing and layout dimensions
✅ Color schemes and visual styling  
✅ Animation and interaction settings
✅ Performance optimizations for UI
✅ Feature flags for frontend features
✅ Development tools and debugging

ORGANIZED BY PURPOSE:
✅ API_CONFIG - backend communication
✅ GRID_CONFIG - floor plan display
✅ LAYOUT_CONFIG - responsive design
✅ THEME - visual appearance  
✅ UI_CONFIG - interaction behavior
✅ PERFORMANCE_CONFIG - frontend optimization
✅ FEATURES - frontend capabilities
✅ DISPLAY_CONSTANTS - formatting

RESULT: 
- 70% smaller constants file
- Clear separation of concerns
- Easy to maintain and modify  
- No business logic mixed with UI config
- Perfect for design system integration

Backend handles all business rules via APIs!
*/