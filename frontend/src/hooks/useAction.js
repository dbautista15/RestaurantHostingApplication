// frontend/src/hooks/useAction.js - COMPLETE VERSION
import { useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

// 🎯 Helper functions (defined here to avoid circular dependencies)
export const getToken = () => localStorage.getItem('auth_token');
export const getUser = () => {
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
};
export const clearAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

// 🎯 SINGLE Hook for All Backend Actions
export const useActions = () => {
  
  // ✅ GENERIC API Call Handler
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = getToken();
    if (!token && !endpoint.includes('/auth/login')) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API call failed: ${response.status}`);
    }

    return response.json();
  }, []);

  // 🎯 WAITLIST Actions
  const waitlistActions = {
    add: useCallback(async (partyData) => {
      return apiCall('/waitlist', {
        method: 'POST',
        body: JSON.stringify(partyData)
      });
    }, [apiCall]),

    update: useCallback(async (partyId, updateData) => {
      return apiCall(`/waitlist/${partyId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
    }, [apiCall]),

    remove: useCallback(async (partyId) => {
      return apiCall(`/waitlist/${partyId}`, {
        method: 'DELETE'
      });
    }, [apiCall]),

    seat: useCallback(async (partyId) => {
      return apiCall('/seating/seat-party', {
        method: 'POST',
        body: JSON.stringify({ partyId })
      });
    }, [apiCall])
  };

  // 🎯 SEATING Actions  
  const seatingActions = {
    getSuggestions: useCallback(async () => {
      return apiCall('/seating/suggestions');
    }, [apiCall]),

    seatManually: useCallback(async (tableNumber, partySize) => {
      return apiCall(`/seating/manual/${tableNumber}`, {
        method: 'PUT',
        body: JSON.stringify({ partySize })
      });
    }, [apiCall]),

    getFairnessMatrix: useCallback(async () => {
      return apiCall('/seating/fairness-matrix');
    }, [apiCall])
  };

  // 🎯 TABLE Actions (UPDATED with new endpoints)
  const tableActions = {
    getAll: useCallback(async () => {
      return apiCall('/tables');
    }, [apiCall]),

    getBySection: useCallback(async (section) => {
      return apiCall(`/tables/section/${section}`);
    }, [apiCall]),

    updateState: useCallback(async (tableId, newState, metadata = {}) => {
      return apiCall(`/tables/${tableId}/state`, {
        method: 'PUT',
        body: JSON.stringify({ newState, ...metadata })
      });
    }, [apiCall]),
    
    // 🎯 NEW: Handle table clicks (backend decides action)
    handleClick: useCallback(async (tableId, metadata = {}) => {
      return apiCall(`/tables/${tableId}/click`, {
        method: 'POST',
        body: JSON.stringify(metadata)
      });
    }, [apiCall]),
    
    // 🎯 NEW: Handle table drops (position changes)
    handleDrop: useCallback(async (tableId, position) => {
      return apiCall(`/tables/${tableId}/drop`, {
        method: 'POST',
        body: JSON.stringify(position)
      });
    }, [apiCall]),
    
    // 🎯 NEW: Get available actions for a table
    getActions: useCallback(async (tableId) => {
      return apiCall(`/tables/${tableId}/actions`);
    }, [apiCall])
  };

  // 🎯 SHIFT Actions
  const shiftActions = {
    getConfigurations: useCallback(async () => {
      return apiCall('/shifts/configurations');
    }, [apiCall]),

    activate: useCallback(async (configId) => {
      return apiCall('/shifts/activate', {
        method: 'POST',
        body: JSON.stringify({ configurationId: configId })
      });
    }, [apiCall]),

    quickSetup: useCallback(async (serverCount) => {
      return apiCall('/shifts/quick-setup', {
        method: 'POST',
        body: JSON.stringify({ serverCount })
      });
    }, [apiCall]),

    addServer: useCallback(async (serverName) => {
      return apiCall('/shifts/add-server', {
        method: 'POST',
        body: JSON.stringify({ serverName })
      });
    }, [apiCall]),

    removeServer: useCallback(async (serverId) => {
      return apiCall('/shifts/remove-server', {
        method: 'POST',
        body: JSON.stringify({ serverId })
      });
    }, [apiCall])
  };

  // 🎯 DASHBOARD Action (Single Call)
  const dashboardActions = {
    load: useCallback(async () => {
      return apiCall('/dashboard');
    }, [apiCall])
  };

  // 🎯 AUTH Actions
  const authActions = {
    login: useCallback(async (clockInNumber, password) => {
      // Don't use apiCall here since we don't have token yet
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clockInNumber, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    }, []),

    logout: useCallback(async () => {
      const token = getToken();
      if (token) {
        try {
          await apiCall('/auth/logout', { method: 'POST' });
        } catch (error) {
          console.warn('Backend logout failed:', error);
        }
      }
      clearAuth();
    }, [apiCall]),

    validateToken: useCallback(async () => {
      return apiCall('/auth/me');
    }, [apiCall]),
    
    changePassword: useCallback(async (currentPassword, newPassword) => {
      return apiCall('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    }, [apiCall])
  };

  // 🎯 DEMO Actions
  const demoActions = {
    populateWaitlist: useCallback(async () => {
      return apiCall('/demo/populate-waitlist', { method: 'POST' });
    }, [apiCall])
  };

  return {
    // Grouped actions
    waitlist: waitlistActions,
    seating: seatingActions,
    tables: tableActions,
    shifts: shiftActions,
    dashboard: dashboardActions,
    auth: authActions,
    demo: demoActions,
    
    // Generic API call for custom endpoints
    apiCall
  };
};

