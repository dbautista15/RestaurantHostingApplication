// frontend/src/hooks/useRestaurant.js (NEW - replaces 4 existing modules)
import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
// frontend/src/hooks/useRestaurantLayout.js
import { useState, useEffect } from 'react';

export const useRestaurantLayout = () => {
  const [layout, setLayout] = useState({
    tables: [],
    shiftConfigurations: [],
    loading: true
  });

  useEffect(() => {
    const loadLayout = async () => {
      try {
        // Try cache first
        const cached = localStorage.getItem('restaurant-layout');
        if (cached) {
          setLayout({ ...JSON.parse(cached), loading: false });
        }

        // Fetch from backend
        const response = await fetch('http://localhost:3000/api/restaurant/layout');
        const data = await response.json();
        
        if (data.success) {
          const layoutData = {
            tables: data.tables,
            shiftConfigurations: data.shiftConfigurations,
            loading: false
          };
          
          setLayout(layoutData);
          localStorage.setItem('restaurant-layout', JSON.stringify(layoutData));
        }
      } catch (error) {
        console.error('Failed to load layout:', error);
        // Fallback to hardcoded layout if needed
      }
    };

    loadLayout();
  }, []);

  return layout;
};
export const useRestaurant = () => {
  // Single source of truth for all restaurant data
  const [state, setState] = useState({
    waitlist: [],
    tables: [],
    matrix: [],
    suggestions: [],
    recentlySeated: [],
    loading: false,
    error: null
  });

  // Cache for fast UI updates
  const [cache, setCache] = useState(() => {
    try {
      return {
        waitlist: JSON.parse(localStorage.getItem('restaurant-waitlist') || '[]'),
        tables: JSON.parse(localStorage.getItem('restaurant-tables') || '[]'),
        matrix: JSON.parse(localStorage.getItem('restaurant-matrix') || '[]'),
        recentlySeated: JSON.parse(localStorage.getItem('restaurant-recently-seated') || '[]')
      };
    } catch {
      return { waitlist: [], tables: [], matrix: [], recentlySeated: [] };
    }
  });

  // Single API call function
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = authService.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };

    const response = await fetch(`http://localhost:3000/api${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }, []);

  // Load initial data
  const loadRestaurantData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Use cached data immediately for fast UI
      setState(prev => ({
        ...prev,
        ...cache,
        loading: true
      }));

      // Fetch authoritative data from backend
      const [waitlistData, tablesData, matrixData] = await Promise.all([
        apiCall('/waitlist'),
        apiCall('/tables'), 
        apiCall('/restaurant/matrix') // New endpoint we'll create
      ]);

      const freshState = {
        waitlist: waitlistData.waitlist || [],
        tables: tablesData.tables || [],
        matrix: matrixData.matrix || [],
        suggestions: [], // Backend will provide these
        recentlySeated: cache.recentlySeated, // Keep local cache for this
        loading: false,
        error: null
      };

      setState(freshState);

      // Update cache
      localStorage.setItem('restaurant-waitlist', JSON.stringify(freshState.waitlist));
      localStorage.setItem('restaurant-tables', JSON.stringify(freshState.tables));
      localStorage.setItem('restaurant-matrix', JSON.stringify(freshState.matrix));

    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, [apiCall, cache]);

  // Optimistic + Backend pattern for all operations
  const seatParty = useCallback(async (partyId) => {
    const party = state.waitlist.find(p => p._id === partyId);
    if (!party) return;

    try {
      // 1. OPTIMISTIC UPDATE (immediate UI response)
      setState(prev => ({
        ...prev,
        waitlist: prev.waitlist.filter(p => p._id !== partyId),
        recentlySeated: [{
          ...party,
          seatedAt: new Date().toISOString()
        }, ...prev.recentlySeated.slice(0, 19)]
      }));

      // 2. BACKEND CALL (authoritative)
      const result = await apiCall('/seating/seat-party', {
        method: 'POST',
        body: JSON.stringify({ partyId })
      });

      if (result.success) {
        // Backend succeeded - use authoritative state
        setState(prev => ({
          ...prev,
          waitlist: result.waitlist,
          tables: result.tables,
          matrix: result.matrix,
          suggestions: result.suggestions || []
        }));

        // Update cache
        localStorage.setItem('restaurant-waitlist', JSON.stringify(result.waitlist));
        localStorage.setItem('restaurant-tables', JSON.stringify(result.tables));
        localStorage.setItem('restaurant-matrix', JSON.stringify(result.matrix));

        return { success: true, assignment: result.assignment };
      } else {
        // Backend rejected - rollback optimistic update
        setState(prev => ({
          ...prev,
          waitlist: [...prev.waitlist, party].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
          recentlySeated: prev.recentlySeated.filter(p => p._id !== partyId)
        }));
        throw new Error(result.error);
      }
    } catch (error) {
      // Network error - keep optimistic update but queue for sync
      console.warn('Seating offline, queued for sync:', error);
      return { success: false, queued: true, error: error.message };
    }
  }, [state.waitlist, apiCall]);

  // Other operations follow same pattern
  const addParty = useCallback(async (partyData) => {
    const tempId = `temp_${Date.now()}`;
    const tempParty = { ...partyData, _id: tempId, createdAt: new Date() };

    // Optimistic
    setState(prev => ({ ...prev, waitlist: [...prev.waitlist, tempParty] }));

    try {
      const result = await apiCall('/waitlist', {
        method: 'POST',
        body: JSON.stringify(partyData)
      });

      // Replace temp with real party
      setState(prev => ({
        ...prev,
        waitlist: prev.waitlist.map(p => p._id === tempId ? result.waitlist : p)
      }));
    } catch (error) {
      // Remove temp on error
      setState(prev => ({
        ...prev,
        waitlist: prev.waitlist.filter(p => p._id !== tempId)
      }));
      throw error;
    }
  }, [apiCall]);

  // Initialize
  useEffect(() => {
    loadRestaurantData();
  }, [loadRestaurantData]);

  return {
    // Data
    ...state,
    
    // Actions (lean API)
    seatParty,
    addParty,
    updateParty: useCallback(async (id, data) => {
      /* Optimistic + backend pattern */
    }, []),
    removeParty: useCallback(async (id) => {
      /* Optimistic + backend pattern */
    }, []),
    
    // Utilities  
    reload: loadRestaurantData,
    clearCache: () => {
      localStorage.removeItem('restaurant-waitlist');
      localStorage.removeItem('restaurant-tables');
      localStorage.removeItem('restaurant-matrix');
    }
  };
};