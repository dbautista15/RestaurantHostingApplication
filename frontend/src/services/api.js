// frontend/src/services/api.js

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Generic API request handler
 * ENGINEERING PATTERN: DRY (Don't Repeat Yourself)
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = options.token;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    console.log(`🔥 API Call: ${options.method || 'GET'} ${endpoint}`);
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      console.error(`❌ API Error (${response.status}):`, data.error);
      throw error;
    }

    console.log(`✅ API Success: ${endpoint}`, data);
    return data;
  } catch (error) {
    if (!error.status) {
      error.message = 'Network error. Please check your connection.';
    }
    throw error;
  }
};

/**
 * SECTION FORMAT CONVERSION
 * Backend uses numbers (1,2,3..7) | Frontend displays letters (A,B,C)
 */
const sectionNumberToLetter = (sectionNumber) => {
  if (!sectionNumber) return null;
  return String.fromCharCode(64 + sectionNumber); // 1->A, 2->B, 3->C
};

const sectionLetterToNumber = (sectionLetter) => {
  if (!sectionLetter) return null;
  return sectionLetter.charCodeAt(0) - 64; // A->1, B->2, C->3
};

/**
 * DATA TRANSFORMATION FUNCTIONS
 */
const transformTableFromBackend = (backendTable) => {
  return {
    id: backendTable.id,
    tableNumber: backendTable.tableNumber,
    section: sectionNumberToLetter(backendTable.section),
    capacity: backendTable.capacity,
    state: backendTable.state,
    partySize: backendTable.partySize,
    assignedWaiter: backendTable.assignedWaiter ? {
      id: backendTable.assignedWaiter.id,
      userName: backendTable.assignedWaiter.userName,
      clockInNumber: backendTable.assignedWaiter.clockInNumber
    } : null,
    assignedAt: backendTable.assignedAt,
    lastStateChange: backendTable.lastStateChange,
    isAvailable: backendTable.state === 'available'
  };
};

/**
 * AUTHENTICATION API FUNCTIONS
 */
export const authAPI = {
  login: async (clockInNumber, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ clockInNumber, password })
    });
    
    return {
      success: response.success,
      user: {
        id: response.user.id,
        userName: response.user.userName || `User ${clockInNumber}`,
        role: response.user.role,
        clockInNumber: clockInNumber,
        section: sectionNumberToLetter(response.user.section)
      },
      token: response.token
    };
  },

  register: async (userData) => {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  logout: async (token) => {
    return await apiRequest('/auth/logout', {
      method: 'POST',
      token
    });
  }
};

/**
 * TABLE MANAGEMENT API FUNCTIONS
 */
export const tableAPI = {
  getAllTables: async (token) => {
    const response = await apiRequest('/tables', {
      method: 'GET',
      token
    });
    
    const transformedTables = {};
    response.tables.forEach(table => {
      const transformed = transformTableFromBackend(table);
      transformedTables[transformed.id] = transformed;
    });
    
    return {
      success: response.success,
      tables: transformedTables,
      count: response.count
    };
  },

  updateTableState: async (tableId, action, extraData, token) => {
    let apiPayload;
    
    switch (action) {
      case 'assign':
        apiPayload = {
          newState: 'assigned',
          waiterId: extraData.waiterId,
          partySize: extraData.partySize
        };
        break;
      case 'seat':
        apiPayload = { newState: 'occupied' };
        break;
      case 'clear':
      case 'cancel':
        apiPayload = { newState: 'available' };
        break;
      default:
        throw new Error(`Unknown table action: ${action}`);
    }

    const response = await apiRequest(`/tables/${tableId}/state`, {
      method: 'PUT',
      token,
      body: JSON.stringify(apiPayload)
    });

    return {
      success: response.success,
      table: transformTableFromBackend(response.table),
      message: response.message,
      transition: response.transition
    };
  }
};

/**
 * ERROR HANDLING UTILITY
 */
export const handleAPIError = (error, defaultMessage = 'Something went wrong') => {
  if (error.status === 401) return 'Session expired. Please log in again.';
  if (error.status === 403) return 'You do not have permission for this action.';
  if (error.status === 404) return 'The requested resource was not found.';
  if (error.status === 409) return 'This item was updated by another user. Please refresh and try again.';
  if (error.status >= 500) return 'Server error. Please try again later.';
  return error.message || defaultMessage;
};

export default {
  authAPI,
  tableAPI,
  handleAPIError,
  sectionNumberToLetter,
  sectionLetterToNumber
};