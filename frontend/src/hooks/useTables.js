// frontend/src/hooks/useTables.js
import { useState, useEffect } from 'react';

/**
 * 🎯 YOUR ENGINEERING TASK: Table State Management Hook
 * 
 * LEARNING OBJECTIVES:
 * - Real-time state synchronization
 * - Optimistic UI updates
 * - Error handling and rollback strategies
 * - API integration with React hooks
 */

export const useTables = (token) => {
  const [tables, setTables] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // TODO: Fetch all tables from API
  const fetchTables = async () => {
    // YOUR CODE HERE:
    // 1. Make GET request to /api/tables
    // 2. Include JWT token in Authorization header
    // 3. Handle response and errors
    // 4. Update tables state
    
    try {
      // TODO: Replace mock with real API call
      const response = await fetch('http://localhost:3001/api/tables', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // TODO: Handle response
      // ENGINEERING QUESTIONS:
      // - How do you handle 401 (unauthorized) responses?
      // - Should you retry failed requests?
      // - How do you normalize the data structure?
      
    } catch (error) {
      // TODO: Error handling
    }
  };

  // TODO: Update table state (optimistic updates)
  const updateTableState = async (tableId, newState, extraData = {}) => {
    // YOUR CODE HERE:
    // 1. Implement optimistic update (update UI immediately)
    // 2. Make PUT request to /api/tables/:id/state
    // 3. Handle success/failure
    // 4. Rollback on error
    
    // ENGINEERING PATTERN: Optimistic Updates
    // Update UI first, then sync with server
    const previousTable = tables[tableId];
    
    // TODO: Optimistic update
    // setTables(prev => ({ ...prev, [tableId]: { ...newTableData } }));
    
    try {
      // TODO: API call
      const response = await fetch(`http://localhost:3001/api/tables/${tableId}/state`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newState, ...extraData })
      });
      
      // TODO: Handle response
      
    } catch (error) {
      // TODO: Rollback optimistic update on error
      // setTables(prev => ({ ...prev, [tableId]: previousTable }));
    }
  };

  // TODO: Load tables on mount and token change
  useEffect(() => {
    if (token) {
      fetchTables();
    }
  }, [token]);

  return {
    tables,
    isLoading,
    error,
    updateTableState,
    refetch: fetchTables
  };
};

