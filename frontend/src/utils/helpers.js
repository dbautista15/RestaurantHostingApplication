// frontend/src/utils/helpers.js

/**
 * 🛠️ FRONTEND HELPER FUNCTIONS (PROVIDED FOR YOU)
 * Reusable utility functions for common operations
 */

// Date and time formatting
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatWaitTime = (addedAt) => {
  const minutes = Math.floor((new Date() - new Date(addedAt)) / 60000);
  if (minutes < 1) return 'Just added';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const getRelativeTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// Table and restaurant helpers
export const getTableDisplayName = (table) => {
  return `Table ${table.tableNumber}`;
};

export const getTableCapacityDisplay = (capacity) => {
  return `Seats ${capacity}`;
};

export const getSectionDisplayName = (section) => {
  return `Section ${section}`;
};

export const getStateDisplayName = (state) => {
  return state.charAt(0).toUpperCase() + state.slice(1).replace('_', ' ');
};

// Statistics helpers
export const calculateSectionStats = (tables, section) => {
  const sectionTables = tables.filter(t => t.section === section);
  return {
    total: sectionTables.length,
    available: sectionTables.filter(t => t.state === 'available').length,
    assigned: sectionTables.filter(t => t.state === 'assigned').length,
    occupied: sectionTables.filter(t => t.state === 'occupied').length
  };
};

export const calculateWaiterWorkload = (tables, waiterId) => {
  const waiterTables = tables.filter(t => 
    t.assignedWaiter && t.assignedWaiter.id === waiterId
  );
  
  return {
    tableCount: waiterTables.length,
    totalPartySize: waiterTables.reduce((sum, t) => sum + (t.partySize || 0), 0),
    tables: waiterTables
  };
};

export const getAvailableTablesForParty = (tables, partySize) => {
  return tables.filter(t => 
    t.state === 'available' && 
    t.capacity >= partySize
  ).sort((a, b) => a.capacity - b.capacity); // Prefer smaller tables that fit
};

// Validation helpers
export const isValidClockInNumber = (clockInNumber) => {
  // Format: H001, W001, M001 (Host, Waiter, Manager)
  return /^[HWM]\d{3}$/.test(clockInNumber);
};

export const isValidPhoneNumber = (phone) => {
  if (!phone) return true; // Optional field
  return /^\d{3}-\d{3}-\d{4}$/.test(phone) || /^\(\d{3}\) \d{3}-\d{4}$/.test(phone);
};

export const isValidPartySize = (size) => {
  const num = parseInt(size);
  return num >= 1 && num <= 10;
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// UI state helpers
export const getTableStateColor = (state) => {
  const colors = {
    available: 'bg-green-100 border-green-500 text-green-800',
    assigned: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    occupied: 'bg-red-100 border-red-500 text-red-800'
  };
  return colors[state] || 'bg-gray-100 border-gray-500 text-gray-800';
};

export const getConnectionStatusColor = (status) => {
  const colors = {
    connected: 'bg-green-100 text-green-800',
    connecting: 'bg-yellow-100 text-yellow-800',
    disconnected: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Error handling helpers
export const getErrorMessage = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isNetworkError = (error) => {
  return !error.response && error.code === 'NETWORK_ERROR';
};

export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

// Local storage helpers (Note: These won't work in Claude artifacts)
export const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('restaurant_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    localStorage.setItem('restaurant_user', JSON.stringify(user));
  } catch (error) {
    console.warn('Failed to store user data:', error);
  }
};

export const clearStoredUser = () => {
  try {
    localStorage.removeItem('restaurant_user');
    localStorage.removeItem('restaurant_token');
  } catch (error) {
    console.warn('Failed to clear stored data:', error);
  }
};

// Array and object helpers
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    let aVal = a[key];
    let bVal = b[key];
    
    // Handle nested keys like 'assignedWaiter.name'
    if (key.includes('.')) {
      const keys = key.split('.');
      aVal = keys.reduce((obj, k) => obj?.[k], a);
      bVal = keys.reduce((obj, k) => obj?.[k], b);
    }
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal < bVal ? -1 : 1;
    return direction === 'asc' ? comparison : -comparison;
  });
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Export all helpers as default object
export default {
  // Time formatting
  formatTimestamp,
  formatDate,
  formatWaitTime,
  getRelativeTime,
  
  // Display helpers
  getTableDisplayName,
  getTableCapacityDisplay,
  getSectionDisplayName,
  getStateDisplayName,
  
  // Statistics
  calculateSectionStats,
  calculateWaiterWorkload,
  getAvailableTablesForParty,
  
  // Validation
  isValidClockInNumber,
  isValidPhoneNumber,
  isValidPartySize,
  formatPhoneNumber,
  
  // UI helpers
  getTableStateColor,
  getConnectionStatusColor,
  
  // Error handling
  getErrorMessage,
  isNetworkError,
  isAuthError,
  
  // Storage
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  
  // Utilities
  groupBy,
  sortBy,
  debounce
};