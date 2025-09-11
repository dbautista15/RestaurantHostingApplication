// frontend/src/hooks/useWaitlist.js
import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socket';

/**
 * 🎯 YOUR ENGINEERING TASK: Waitlist State Management Hook
 * 
 * LEARNING OBJECTIVES:
 * - Custom React hooks for complex state
 * - Real-time data synchronization  
 * - Optimistic UI updates
 * - Error handling and rollback
 * - API integration patterns
 */

export const useWaitlist = (token, userRole) => {
  const [waitlist, setWaitlist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // TODO: Fetch waitlist from API
  const fetchWaitlist = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Make API call to get waitlist
      // HINT: GET /api/waitlist with Authorization header
      // YOUR CODE HERE:
      
      const response = await fetch('/api/waitlist', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // TODO: Handle response
      // YOUR CODE HERE:
      
    } catch (error) {
      // TODO: Error handling
      // YOUR CODE HERE:
      
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // TODO: Add party to waitlist
  const addParty = useCallback(async (partyData) => {
    if (userRole !== 'host') {
      setError('Only hosts can add parties to waitlist');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    // TODO: Optimistic update - add to waitlist immediately
    const optimisticEntry = {
      id: Date.now(), // Temporary ID
      ...partyData,
      addedAt: new Date().toISOString(),
      estimatedWait: Math.floor(Math.random() * 30) + 10, // Mock estimate
      partyStatus: 'waiting'
    };
    
    // TODO: Add optimistic entry to state
    // YOUR CODE HERE:
    
    try {
      // TODO: Make API call to add party
      // HINT: POST /api/waitlist with party data
      // YOUR CODE HERE:
      
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(partyData)
      });
      
      // TODO: Handle response and replace optimistic entry
      // YOUR CODE HERE:
      
      return true;
    } catch (error) {
      // TODO: Rollback optimistic update on error
      // YOUR CODE HERE:
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, userRole]);

  // TODO: Remove party from waitlist  
  const removeParty = useCallback(async (partyId) => {
    if (userRole !== 'host') {
      setError('Only hosts can remove parties from waitlist');
      return false;
    }
    
    // TODO: Store original state for rollback
    const originalWaitlist = [...waitlist];
    
    // TODO: Optimistic update - remove from waitlist immediately
    // YOUR CODE HERE:
    
    try {
      // TODO: Make API call to remove party
      // HINT: DELETE /api/waitlist/:id
      // YOUR CODE HERE:
      
      return true;
    } catch (error) {
      // TODO: Rollback optimistic update
      // YOUR CODE HERE:
      
      return false;
    }
  }, [token, userRole, waitlist]);

  // TODO: Seat party (remove from waitlist and assign to table)
  const seatParty = useCallback(async (partyId, tableId = null) => {
    if (userRole !== 'host') {
      setError('Only hosts can seat parties');
      return false;
    }
    
    // TODO: Find the party in waitlist
    const party = waitlist.find(p => p.id === partyId);
    if (!party) {
      setError('Party not found in waitlist');
      return false;
    }
    
    try {
      // TODO: Update party status to 'seated'
      // HINT: PUT /api/waitlist/:id/status
      // YOUR CODE HERE:
      
      // TODO: Optionally assign to specific table if tableId provided
      // This would require integration with table management
      // YOUR CODE HERE:
      
      // TODO: Remove from local waitlist state
      setWaitlist(prev => prev.filter(p => p.id !== partyId));
      
      return true;
    } catch (error) {
      setError('Failed to seat party');
      return false;
    }
  }, [token, userRole, waitlist]);

  // TODO: Update party details
  const updateParty = useCallback(async (partyId, updates) => {
    if (userRole !== 'host') {
      setError('Only hosts can update party details');
      return false;
    }
    
    // TODO: Optimistic update
    const originalWaitlist = [...waitlist];
    
    // TODO: Update party in local state
    // YOUR CODE HERE:
    
    try {
      // TODO: Make API call to update party
      // HINT: PUT /api/waitlist/:id
      // YOUR CODE HERE:
      
      return true;
    } catch (error) {
      // TODO: Rollback on error
      setWaitlist(originalWaitlist);
      setError('Failed to update party');
      return false;
    }
  }, [token, userRole, waitlist]);

  // TODO: Calculate position in waitlist
  const getPartyPosition = useCallback((partyId) => {
    // TODO: Find party index in waitlist (considering priority)
    // YOUR CODE HERE:
    
    const index = waitlist.findIndex(p => p.id === partyId);
    return index >= 0 ? index + 1 : null;
  }, [waitlist]);

  // TODO: Get estimated wait time for new party
  const getEstimatedWaitTime = useCallback((partySize) => {
    // TODO: Calculate based on current waitlist and table availability
    // ENGINEERING DECISION: What factors affect wait time?
    // - Current waitlist length
    // - Party sizes ahead in queue  
    // - Available tables that fit party size
    // - Historical table turnover rate
    
    // Simple algorithm for now:
    const partiesAhead = waitlist.length;
    const baseWaitTime = 15; // Base wait time in minutes
    const queueMultiplier = 10; // Additional minutes per party ahead
    
    return baseWaitTime + (partiesAhead * queueMultiplier);
  }, [waitlist]);

  // TODO: Set up real-time updates via WebSocket
  useEffect(() => {
    if (!token) return;
    
    // TODO: Set up socket listeners for waitlist updates
    const handleWaitlistUpdate = (update) => {
      // TODO: Handle different types of waitlist updates
      // TYPES: 'added', 'removed', 'updated', 'seated'
      // YOUR CODE HERE:
      
      switch (update.action) {
        case 'added':
          // TODO: Add new party to waitlist
          break;
        case 'removed':
          // TODO: Remove party from waitlist
          break;
        case 'updated':
          // TODO: Update existing party
          break;
        case 'seated':
          // TODO: Remove party and show notification
          break;
        default:
          console.warn('Unknown waitlist update action:', update.action);
      }
    };
    
    // TODO: Add socket event listener
    socketService.onWaitlistUpdated(handleWaitlistUpdate);
    
    // Cleanup function
    return () => {
      // TODO: Remove socket listener
      // YOUR CODE HERE:
    };
  }, [token]);

  // TODO: Load waitlist on mount and token change
  useEffect(() => {
    if (token) {
      fetchWaitlist();
    } else {
      setWaitlist([]);
    }
  }, [token, fetchWaitlist]);

  // TODO: Sort waitlist by priority and time
  const sortedWaitlist = waitlist.sort((a, b) => {
    // TODO: Implement sorting logic
    // PRIORITY: VIP > large_party > normal
    // TIME: Earlier added time = higher priority within same priority level
    // YOUR CODE HERE:
    
    // Priority weights
    const priorityWeights = {
      'vip': 3,
      'large_party': 2, 
      'normal': 1
    };
    
    const aPriority = priorityWeights[a.priority] || 1;
    const bPriority = priorityWeights[b.priority] || 1;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }
    
    // Same priority - sort by time added (earlier first)
    return new Date(a.addedAt) - new Date(b.addedAt);
  });

  // TODO: Get waitlist statistics
  const getWaitlistStats = useCallback(() => {
    return {
      totalWaiting: waitlist.length,
      averageWaitTime: waitlist.reduce((sum, p) => {
        const waitTime = Math.floor((new Date() - new Date(p.addedAt)) / 60000);
        return sum + waitTime;
      }, 0) / (waitlist.length || 1),
      largestParty: Math.max(...waitlist.map(p => p.partySize), 0),
      vipCount: waitlist.filter(p => p.priority === 'vip').length,
      largePartyCount: waitlist.filter(p => p.priority === 'large_party').length
    };
  }, [waitlist]);

  // TODO: Check if party size needs priority adjustment
  const checkPartyPriority = useCallback((partySize) => {
    // TODO: Auto-assign priority based on party size
    // BUSINESS RULE: Parties of 6+ are considered large parties
    if (partySize >= 6) {
      return 'large_party';
    }
    return 'normal';
  }, []);

  // TODO: Handle error clearing
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // TODO: Refresh waitlist data
  const refresh = useCallback(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  return {
    // Waitlist data
    waitlist: sortedWaitlist,
    isLoading,
    error,
    
    // Actions
    addParty,
    removeParty,
    seatParty,
    updateParty,
    
    // Utilities
    getPartyPosition,
    getEstimatedWaitTime,
    getWaitlistStats,
    checkPartyPriority,
    
    // Control
    clearError,
    refresh
  };
};

// TODO: Hook for individual waitlist entry management
export const useWaitlistEntry = (entryId, token) => {
  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // TODO: Fetch specific waitlist entry
  const fetchEntry = useCallback(async () => {
    if (!entryId || !token) return;
    
    setIsLoading(true);
    try {
      // TODO: Make API call to get specific entry
      // HINT: GET /api/waitlist/:id
      // YOUR CODE HERE:
      
    } catch (error) {
      setError('Failed to fetch waitlist entry');
    } finally {
      setIsLoading(false);
    }
  }, [entryId, token]);

  // TODO: Update entry status
  const updateStatus = useCallback(async (newStatus, reason = '') => {
    if (!entry || !token) return false;
    
    try {
      // TODO: Update entry status
      // YOUR CODE HERE:
      
      return true;
    } catch (error) {
      setError('Failed to update entry status');
      return false;
    }
  }, [entry, token]);

  // TODO: Calculate actual wait time
  const getActualWaitTime = useCallback(() => {
    if (!entry) return 0;
    return Math.floor((new Date() - new Date(entry.addedAt)) / 60000);
  }, [entry]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  return {
    entry,
    isLoading,
    error,
    updateStatus,
    getActualWaitTime,
    refresh: fetchEntry
  };
};

export default useWaitlist;

/**
 * 🧪 TESTING YOUR WAITLIST HOOK:
 * 
 * 1. Test basic functionality:
 *    - Load waitlist on mount
 *    - Add new party (optimistic update)
 *    - Remove party (with rollback on error)
 *    - Update party details
 * 
 * 2. Test real-time updates:
 *    - Add party from another device
 *    - Verify local state updates
 *    - Test WebSocket reconnection
 * 
 * 3. Test error handling:
 *    - Network failures during API calls
 *    - Invalid party data
 *    - Permission errors (waiter trying to modify)
 * 
 * 4. Test business logic:
 *    - Priority sorting (VIP, large party, normal)
 *    - Wait time estimation
 *    - Position calculation
 * 
 * 📚 LEARNING RESOURCES:
 * - React Hooks Guide: https://reactjs.org/docs/hooks-overview.html
 * - useCallback Best Practices: https://kentcdodds.com/blog/usememo-and-usecallback
 * - Error Boundaries: https://reactjs.org/docs/error-boundaries.html
 * 
 * 💭 ENGINEERING PATTERNS YOU'RE LEARNING:
 * - Optimistic UI updates for better UX
 * - Error handling and rollback strategies  
 * - Real-time state synchronization
 * - Custom hooks for complex state logic
 * - Separation of concerns (API vs UI logic)
 * 
 * 🎯 ADVANCED FEATURES (AFTER BASIC FUNCTIONALITY WORKS):
 * - Undo functionality for accidental removals
 * - Batch operations for multiple parties
 * - Waitlist analytics and reporting
 * - SMS notifications for parties
 * - Integration with table assignment algorithm
 */