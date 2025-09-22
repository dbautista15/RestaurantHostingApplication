// frontend/src/components/dashboard/Dashboard.jsx
import React, { useRef, useEffect, useMemo } from 'react';
import { useWaitlist } from '../../hooks/useWaitlist';
import { useMatrixSeating } from '../../hooks/useMatrixSeating';
import { useShift } from '../../context/ShiftContext';
import { WaitlistPanel } from '../waitlist/WaitlistPanel';
import { FloorPlanView } from '../floorplan/FloorPlanView';
import { SuggestionsPanel } from '../seating/SuggestionsPanel';
import { ThreePanelLayout, LeftPanel, CenterPanel, RightPanel } from '../shared/ThreePanelLayout';
import { io } from 'socket.io-client';
// CONSOLIDATED: Import from centralized constants
import { MOCK_TABLES } from '../../config/constants';

export const Dashboard = ({ user, onLogout }) => {
  const { shiftData } = useShift();
  const floorPlanRef = useRef(null);

  const {
    waitlist,
    loading,
    error,
    addParty,
    updateParty, // ✅ NEW: Get update function from hook
    updatePartyStatus,
    removeParty
  } = useWaitlist();

  const activeWaiters = shiftData.serverOrder || [];

  const {
    matrix,
    suggestions,
    pendingAssignments,
    confirmSeating,
    cancelAssignment,
    updateMatrix  // NEW: Get the proper matrix update function
  } = useMatrixSeating(activeWaiters, MOCK_TABLES, waitlist);

  // Track waitlist seating to prevent duplicate matrix updates
  const waitlistSeatingRef = useRef(new Set());

  // Socket.IO setup for device synchronization
  useEffect(() => {
    const socket = io('http://localhost:3001');

    // Listen for table updates from other devices (like waiter iPad)
    socket.on('table_state_synced', (data) => {
      console.log('Received table sync from other device:', data);
      if (floorPlanRef.current) {
        floorPlanRef.current.updateTableState(
          data.tableId,
          data.state,
          data.partyInfo
        );
      }
    });

    // Clean up socket connection when component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  // Helper function to get table waiter
  const getTableWaiter = (tableId) => {
    const waiterAssignments = {
      1: ['A13', 'A14', 'A15', 'A16'],
      2: ['A12', 'A11', 'A10', 'A9'],
      3: ['A1', 'A3', 'A4', 'A5'],
      4: ['A2', 'A6', 'A7', 'A8'],
      5: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6']
    };

    for (let waiterId = 1; waiterId <= 5; waiterId++) {
      if (waiterAssignments[waiterId]?.includes(tableId)) {
        return waiterId;
      }
    }
    return null;
  };

  // Handle seating parties from waitlist - FIXED: Prevent duplicate matrix updates
  const handleSeatParty = async (partyId, status) => {
    const party = waitlist.find(p => p._id === partyId);
    if (!party) return;

    const availableTable = findSuitableTable(party.partySize);

    if (availableTable && floorPlanRef.current) {
      const partyInfo = { name: party.partyName, size: party.partySize };

      // CRITICAL: Mark this as waitlist seating to prevent duplicate matrix updates
      waitlistSeatingRef.current.add(availableTable.id);

      // Update the floor plan table to "occupied"
      floorPlanRef.current.updateTableState(
        availableTable.id,
        'occupied',
        partyInfo
      );

      // FIXED: Handle matrix update directly here to prevent duplicates
      const waiterSection = getTableWaiter(availableTable.id);
      if (waiterSection) {
        const waiterIndex = activeWaiters.findIndex(w => w.section === waiterSection);
        if (waiterIndex !== -1) {
          console.log('Dashboard updating matrix for waitlist seating:', waiterIndex, party.partySize);
          updateMatrix(waiterIndex, party.partySize);
        }
      }
      
      // Clean up tracking after a delay
      setTimeout(() => {
        waitlistSeatingRef.current.delete(availableTable.id);
      }, 1000);
      
      // Broadcast to other devices (waiter iPad)
      const socket = io('http://localhost:3001');
      socket.emit('sync_table_state', {
        tableId: availableTable.id,
        state: 'occupied',
        partyInfo: partyInfo,
        timestamp: new Date()
      });
      socket.disconnect(); // Clean up temporary connection
    }
    
    // Update the waitlist (remove the party)
    await updatePartyStatus(partyId, status);
  };
  
  const findSuitableTable = (partySize) => {
    const suitableTables = [
      { id: 'A16', capacity: 4 },
      { id: 'A15', capacity: 4 },
      { id: 'A14', capacity: 4 },
      { id: 'B1', capacity: 4 },
      { id: 'B2', capacity: 4 },
      { id: 'A2', capacity: 2 },
      { id: 'A5', capacity: 2 }
    ];
    
    return suitableTables.find(table =>
      table.capacity >= partySize && table.capacity <= partySize + 2
    );
  };
  
  // FIXED: Pass tracking info to prevent duplicate matrix updates
  const handleManualTableSeating = (waiterIndex, partySize, tableId) => {
    // Only update matrix if this is NOT from waitlist seating
    if (!waitlistSeatingRef.current.has(tableId)) {
      console.log('Dashboard received manual table seating:', waiterIndex, partySize);
      updateMatrix(waiterIndex, partySize);
    } else {
      console.log('Skipping matrix update - this is from waitlist seating');
    }
  };

  // ADD THE BUSINESS METRICS COMPONENT HERE:
  const businessMetrics = useMemo(() => {
    const totalTablesServed = matrix.flat().reduce((a, b) => a + b, 0);
    const fairnessScore = (() => {
      const totals = activeWaiters.map((_, index) => 
        matrix[index]?.reduce((a, b) => a + b, 0) || 0
      );
      const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
      const variance = totals.reduce((sum, total) => sum + Math.pow(total - avg, 2), 0) / totals.length;
      return Math.max(0, 100 - Math.round(variance * 10));
    })();
    
    const avgWaitTime = waitlist.length > 0 ? 
      Math.round(waitlist.reduce((sum, p) => sum + ((Date.now() - new Date(p.createdAt)) / (1000 * 60)), 0) / waitlist.length) : 0;

    return { totalTablesServed, fairnessScore, avgWaitTime };
  }, [matrix, activeWaiters, waitlist]);
  
  // Improve loading in Dashboard.jsx
  if (loading && waitlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading SmartSeater...</p>
          <p className="text-gray-500 text-sm">Connecting to restaurant data</p>
        </div>
      </div>
    );
  }

  return (
    <ThreePanelLayout user={user} onLogout={onLogout} waitlistCount={waitlist.length} businessMetrics={businessMetrics}>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <span className="text-lg mr-2">⚠️</span>
            <div>
              <p className="font-medium">Connection Issue</p>
              <p className="text-sm">Using offline mode - changes will sync when reconnected</p>
            </div>
          </div>
        </div>
      )}

      <LeftPanel>
        <WaitlistPanel
          waitlist={waitlist}
          onAddParty={addParty}
          onStatusChange={handleSeatParty}
          onRemove={removeParty}
          onUpdate={updateParty} // ✅ NEW: Pass update function
        />
      </LeftPanel>

      <CenterPanel>
        <FloorPlanView
          ref={floorPlanRef}
          onUpdateMatrix={(waiterIndex, partySize, tableId) => handleManualTableSeating(waiterIndex, partySize, tableId)}
        />
      </CenterPanel>

      <RightPanel>
        <SuggestionsPanel
          suggestions={suggestions}
          matrix={matrix}
          waiters={activeWaiters}
          pendingAssignments={pendingAssignments}
          onAssignParty={handleSeatParty}
          onConfirmSeating={confirmSeating}
          onCancelAssignment={cancelAssignment}
        />
      </RightPanel>
    </ThreePanelLayout>
  );
};