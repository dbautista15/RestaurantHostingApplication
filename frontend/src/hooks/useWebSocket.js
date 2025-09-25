// frontend/src/hooks/useWebSocket.js
import { useEffect, useCallback, useRef } from "react";
import { wsService } from "../services/websocketService";
import { useAuth } from "./useAuth";

export const useWebSocket = (eventHandlers = {}) => {
  const { isAuthenticated } = useAuth();
  const unsubscribersRef = useRef([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated) return;

    // Connect to WebSocket
    wsService.connect();

    // Cleanup on unmount
    return () => {
      // Don't disconnect the socket itself (singleton)
      // Just clean up our subscriptions
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [isAuthenticated]);

  // Subscribe to events
  useEffect(() => {
    if (!isAuthenticated) return;

    // Clean up previous subscriptions
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];

    // Subscribe to each event
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      const unsubscribe = wsService.subscribe(event, handler);
      unsubscribersRef.current.push(unsubscribe);
    });

    // Cleanup function
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [eventHandlers, isAuthenticated]);

  // Expose WebSocket methods
  const emit = useCallback((event, data, callback) => {
    wsService.emit(event, data, callback);
  }, []);

  const syncTableState = useCallback((tableData) => {
    wsService.syncTableState(tableData);
  }, []);

  const requestGlobalRefresh = useCallback((reason) => {
    wsService.requestGlobalRefresh(reason);
  }, []);

  return {
    isConnected: wsService.isConnected(),
    emit,
    syncTableState,
    requestGlobalRefresh,
  };
};

// Hook for dashboard real-time updates
export const useDashboardWebSocket = (onRefresh) => {
  const eventHandlers = {
    // Table updates
    table_state_changed: useCallback(
      (data) => {
        console.log("Dashboard: Table state changed", data);
        onRefresh();
      },
      [onRefresh]
    ),

    // Waitlist updates
    waitlist_updated: useCallback(
      (data) => {
        console.log("Dashboard: Waitlist updated", data);
        onRefresh();
      },
      [onRefresh]
    ),

    // Shift configuration changes
    shift_configuration_changed: useCallback(
      (data) => {
        console.log("Dashboard: Shift configuration changed", data);
        // Show notification to user
        if (data.changedBy && data.changedBy.userName) {
          console.log(`Shift updated by ${data.changedBy.userName}`);
        }
        onRefresh();
      },
      [onRefresh]
    ),

    // Fairness matrix updates
    fairness_matrix_updated: useCallback(
      (data) => {
        console.log("Dashboard: Fairness matrix updated", data);
        onRefresh();
      },
      [onRefresh]
    ),

    // Global refresh requests
    request_refresh: useCallback(
      (data) => {
        console.log("Dashboard: Global refresh requested", data);
        onRefresh();
      },
      [onRefresh]
    ),

    // Notifications
    notification: useCallback((data) => {
      console.log("Dashboard: Notification received", data);
      // You could show a toast notification here
    }, []),
  };

  return useWebSocket(eventHandlers);
};
