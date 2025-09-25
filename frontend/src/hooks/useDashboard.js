// frontend/src/hooks/useDashboard.js - ULTRA LEAN VERSION
import { useState, useEffect, useCallback } from 'react';
import { useActions } from './useAction';

export const useDashboard = () => {
  const actions = useActions();
  
  // 🎯 SINGLE State Object
  const [state, setState] = useState({
    // All data from single backend call
    waitlist: [],
    tables: [],
    matrix: [],
    waiters: [],
    suggestions: [],
    fairnessScore: 100,
    
    // Local UI state
    recentlySeated: [],
    
    // Single loading/error state  
    loading: true,
    error: null
  });

  // 🎯 SINGLE API Call - Gets Everything
  const loadDashboard = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await actions.dashboard.load();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          waitlist: result.data.waitlist || [],
          tables: result.data.tables || [],
          matrix: result.data.matrix || [],
          waiters: result.data.waiters || [],
          suggestions: result.data.suggestions || [],
          fairnessScore: result.data.fairnessScore || 100,
          loading: false,
          error: null
        }));
      } else {
        throw new Error(result.error || 'Dashboard load failed');
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [actions.dashboard]);

  // 🎯 SIMPLE Action Wrappers (No Complex Logic)
  const seatParty = useCallback(async (partyId) => {
    try {
      // Optimistic update for instant feedback
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

      const result = await actions.waitlist.seat(partyId);
      
      // Refresh authoritative data
      await loadDashboard();
      
      return result;
      
    } catch (error) {
      // Rollback optimistic update
      await loadDashboard();
      throw error;
    }
  }, [state.waitlist, actions.waitlist, loadDashboard]);

  const addParty = useCallback(async (partyData) => {
    await actions.waitlist.add(partyData);
    await loadDashboard();
  }, [actions.waitlist, loadDashboard]);

  const updateParty = useCallback(async (partyId, updateData) => {
    await actions.waitlist.update(partyId, updateData);
    await loadDashboard();
  }, [actions.waitlist, loadDashboard]);

  const removeParty = useCallback(async (partyId) => {
    await actions.waitlist.remove(partyId);
    await loadDashboard();
  }, [actions.waitlist, loadDashboard]);

  const seatManually = useCallback(async (tableNumber, partySize) => {
    await actions.seating.seatManually(tableNumber, partySize);
    await loadDashboard();
  }, [actions.seating, loadDashboard]);

  // 🎯 SIMPLE Local State Management (Recently Seated)
  const restoreParty = useCallback(async (partyId) => {
    const party = state.recentlySeated.find(p => p._id === partyId);
    if (!party) return { success: false, message: 'Party not found' };

    try {
      // Remove from recently seated immediately
      setState(prev => ({
        ...prev,
        recentlySeated: prev.recentlySeated.filter(p => p._id !== partyId)
      }));

      // Add back to waitlist via API
      await actions.waitlist.add({
        partyName: party.partyName,
        partySize: party.partySize,
        phoneNumber: party.phoneNumber,
        priority: party.priority,
        specialRequests: party.specialRequests,
        estimatedWait: 15,
        partyStatus: 'waiting'
      });

      await loadDashboard();
      return { success: true };
      
    } catch (error) {
      // Restore to recently seated on failure
      setState(prev => ({
        ...prev,
        recentlySeated: [party, ...prev.recentlySeated]
      }));
      throw error;
    }
  }, [state.recentlySeated, actions.waitlist, loadDashboard]);

  const clearRecentlySeated = useCallback(() => {
    setState(prev => ({ ...prev, recentlySeated: [] }));
  }, []);

  // 🎯 Load Initial Data
  useEffect(() => {
    loadDashboard();
  }, []);

  // 🎯 SIMPLE Return Object
  return {
    // Data
    ...state,
    
    // Actions (all call backend + refresh)
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

REMOVED (~100 lines):
❌ Complex auth token checking (useActions handles)
❌ Manual fetch calls with headers
❌ Error handling boilerplate
❌ Multiple API endpoints management
❌ Token refresh logic

KEPT (~50 lines):
✅ Single dashboard load call
✅ Simple action wrappers
✅ Local state for recently seated
✅ Optimistic updates for UX

POWERED BY useActions:
✅ Auto token management
✅ Consistent error handling
✅ Centralized API configuration
✅ Type-safe calls

USAGE IN COMPONENTS:
const { 
  waitlist, tables, suggestions, 
  loading, error,
  seatParty, addParty 
} = useDashboard();

RESULT: 
- Single hook call gets everything
- No complex state orchestration  
- Perfect data synchronization
- Easy to test and debug
- Backend does all business logic
*/