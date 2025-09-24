// frontend/src/hooks/useDashboard.js - SIMPLIFIED SINGLE CALL
import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const useDashboard = () => {
  const [state, setState] = useState({
    // All data from single backend call
    waitlist: [],
    tables: [],
    matrix: [],
    waiters: [],
    suggestions: [],
    recentlySeated: [],
    fairnessScore: 100,
    
    // Single loading/error state
    loading: true,
    error: null
  });

  // 🎯 SINGLE API CALL - replaces multiple hooks
  const loadDashboard = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:3001/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard API failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // 🎯 Single update with ALL data
        setState(prev => ({
          ...prev,
          waitlist: result.data.waitlist || [],
          tables: result.data.tables || [],
          matrix: result.data.matrix || [],
          waiters: result.data.waiters || [],
          suggestions: result.data.suggestions || [],
          fairnessScore: result.data.fairnessScore || 100,
          recentlySeated: prev.recentlySeated, // Keep local state for this
          loading: false,
          error: null
        }));
      } else {
        throw new Error(result.error || 'Dashboard data invalid');
      }
      
    } catch (error) {
      console.error('Dashboard load error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  // 🎯 SIMPLIFIED ACTIONS - backend does the work, we just refresh
  const seatParty = useCallback(async (partyId) => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:3001/api/seating/seat-party', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ partyId })
      });

      const result = await response.json();
      
      if (result.success) {
        // 🎯 Simple optimistic update for UI responsiveness
        const party = state.waitlist.find(p => p._id === partyId);
        if (party) {
          setState(prev => ({
            ...prev,
            waitlist: prev.waitlist.filter(p => p._id !== partyId),
            recentlySeated: [{
              ...party,
              seatedAt: new Date().toISOString()
            }, ...prev.recentlySeated.slice(0, 19)]
          }));
        }
        
        // 🎯 Refresh authoritative data from backend
        await loadDashboard();
        
        return { success: true, assignment: result.assignment };
      } else {
        throw new Error(result.error || 'Seating failed');
      }
      
    } catch (error) {
      console.error('Seat party error:', error);
      // Rollback optimistic update on error
      await loadDashboard();
      throw error;
    }
  }, [state.waitlist, loadDashboard]);

  const addParty = useCallback(async (partyData) => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:3001/api/waitlist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(partyData)
      });

      const result = await response.json();
      
      if (result.success) {
        // 🎯 Refresh to get updated waitlist
        await loadDashboard();
        return result;
      } else {
        throw new Error(result.error || 'Add party failed');
      }
      
    } catch (error) {
      console.error('Add party error:', error);
      throw error;
    }
  }, [loadDashboard]);

  const updateParty = useCallback(async (partyId, updateData) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`http://localhost:3001/api/waitlist/${partyId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (result.success) {
        await loadDashboard();
        return result;
      } else {
        throw new Error(result.error || 'Update party failed');
      }
      
    } catch (error) {
      console.error('Update party error:', error);
      throw error;
    }
  }, [loadDashboard]);

  const removeParty = useCallback(async (partyId) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`http://localhost:3001/api/waitlist/${partyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        await loadDashboard();
        return result;
      } else {
        throw new Error(result.error || 'Remove party failed');
      }
      
    } catch (error) {
      console.error('Remove party error:', error);
      throw error;
    }
  }, [loadDashboard]);

  // 🎯 Manual table seating
  const seatManually = useCallback(async (tableNumber, partySize) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`http://localhost:3001/api/seating/manual/${tableNumber}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ partySize })
      });

      const result = await response.json();
      
      if (result.success) {
        // 🎯 Refresh to get updated table states and matrix
        await loadDashboard();
        return result;
      } else {
        throw new Error(result.error || 'Manual seating failed');
      }
      
    } catch (error) {
      console.error('Manual seating error:', error);
      throw error;
    }
  }, [loadDashboard]);

  // 🎯 Recently seated management (local state only)
  const restoreParty = useCallback(async (partyId) => {
    const party = state.recentlySeated.find(p => p._id === partyId);
    if (!party) return { success: false, message: 'Party not found' };

    try {
      // Remove from recently seated
      setState(prev => ({
        ...prev,
        recentlySeated: prev.recentlySeated.filter(p => p._id !== partyId)
      }));

      // Add back to waitlist via API
      const restoredParty = {
        partyName: party.partyName,
        partySize: party.partySize,
        phoneNumber: party.phoneNumber,
        priority: party.priority,
        specialRequests: party.specialRequests,
        estimatedWait: 15,
        partyStatus: 'waiting'
      };

      await addParty(restoredParty);
      return { success: true, message: 'Party restored to waitlist' };
      
    } catch (error) {
      // Restore to recently seated if API call fails
      setState(prev => ({
        ...prev,
        recentlySeated: [party, ...prev.recentlySeated]
      }));
      throw error;
    }
  }, [state.recentlySeated, addParty]);

  const clearRecentlySeated = useCallback(() => {
    setState(prev => ({ ...prev, recentlySeated: [] }));
  }, []);

  // 🎯 Load initial data
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // 🎯 Return everything the components need
  return {
    // Data (from single API call)
    waitlist: state.waitlist,
    tables: state.tables,
    matrix: state.matrix,
    waiters: state.waiters,
    suggestions: state.suggestions,
    recentlySeated: state.recentlySeated,
    fairnessScore: state.fairnessScore,
    
    // State
    loading: state.loading,
    error: state.error,
    
    // Actions (all refresh from single endpoint)
    seatParty,
    addParty,
    updateParty,
    removeParty,
    seatManually,
    restoreParty,
    clearRecentlySeated,
    
    // Utility
    refresh: loadDashboard
  };
};

/*
🎯 KEY IMPROVEMENTS:

1. SINGLE API CALL:
   ✅ One call to /api/dashboard gets everything
   ❌ No more separate calls to /waitlist, /tables, /suggestions, etc.

2. SIMPLIFIED STATE:
   ✅ One loading state, one error state
   ❌ No more complex orchestration of multiple loading states

3. LEAN ACTIONS:
   ✅ Each action calls backend then refreshes dashboard
   ❌ No complex optimistic update logic

4. PERFECT SYNC:
   ✅ All data arrives together, perfectly synchronized
   ❌ No more data inconsistencies between components

5. EASY TO DEBUG:
   ✅ Single network request to monitor
   ❌ No more waterfall requests or race conditions

USAGE IN COMPONENTS:
const { waitlist, tables, suggestions, loading, seatParty } = useDashboard();
*/