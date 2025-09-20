// src/components/dashboard/Dashboard.jsx
import React, { useRef, useEffect } from 'react'; // ADDED: useEffect import
import { useWaitlist } from '../../hooks/useWaitlist';
import { useMatrixSeating } from '../../hooks/useMatrixSeating';
import { useShift } from '../../context/ShiftContext';
import { WaitlistPanel } from '../waitlist/WaitlistPanel';
import { FloorPlanView } from '../floorplan/FloorPlanView';
import { SuggestionsPanel } from '../seating/SuggestionsPanel';
import { ThreePanelLayout, LeftPanel, CenterPanel, RightPanel } from '../shared/ThreePanelLayout';
// NEW: Add socket.io import
import { io } from 'socket.io-client';

const MOCK_TABLES = [
  { id: 'A1', state: 'available', capacity: 4 },
  { id: 'A2', state: 'occupied', capacity: 2 }
];

// Simple waiter assignment lookup (matches your floor plan logic)
const WAITER_ASSIGNMENTS = {
  1: ['B1', 'B2', 'B6', 'A8'],
  2: ['A16', 'A9', 'A6', 'A7'],  
  3: ['A15', 'A10', 'A4', 'A5'],
  4: ['A13', 'A12', 'A1', 'A2'],
  5: ['A14', 'A11', 'A3']
};

export const Dashboard = ({ user, onLogout }) => {
  const { shiftData } = useShift();
  const floorPlanRef = useRef(null);
  
  const { 
    waitlist, 
    loading, 
    error, 
    addParty, 
    updatePartyStatus, 
    removeParty 
  } = useWaitlist();

  const activeWaiters = shiftData.serverOrder || [];

  const {
    matrix,
    suggestions,
    pendingAssignments,
    assignPartyToTable,
    confirmSeating,
    cancelAssignment,
    matrixService
  } = useMatrixSeating(activeWaiters, MOCK_TABLES, waitlist);

  // NEW: Socket.IO setup for device synchronization
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
  }, []); // Empty dependency array - only run once

  // Function to find which waiter serves a table
  const getTableWaiter = (tableId) => {
    for (let waiterId = 1; waiterId <= 5; waiterId++) {
      if (WAITER_ASSIGNMENTS[waiterId]?.includes(tableId)) {
        return waiterId;
      }
    }
    return null;
  };

  // ENHANCED: Now updates floor plan AND matrix AND syncs to other devices
  const handleSeatParty = async (partyId, status) => {
    const party = waitlist.find(p => p._id === partyId);
    if (!party) return;

    const availableTable = findSuitableTable(party.partySize);
    
    if (availableTable && floorPlanRef.current) {
      const partyInfo = { name: party.partyName, size: party.partySize };
      
      // Update the floor plan table to "occupied"
      floorPlanRef.current.updateTableState(
        availableTable.id, 
        'occupied', 
        partyInfo
      );

      // NEW: Broadcast to other devices (waiter iPad)
      const socket = io('http://localhost:3001');
      socket.emit('sync_table_state', {
        tableId: availableTable.id,
        state: 'occupied',
        partyInfo: partyInfo,
        timestamp: new Date()
      });
      socket.disconnect(); // Clean up temporary connection

      // Update the fairness matrix
      const waiterId = getTableWaiter(availableTable.id);
      if (waiterId && matrixService) {
        const waiterIndex = activeWaiters.findIndex(w => w.id === waiterId);
        if (waiterIndex !== -1) {
          matrixService.seatParty(waiterIndex, party.partySize);
          console.log(`Matrix updated: Waiter ${waiterId} served party of ${party.partySize}`);
        }
      }
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

  if (loading && waitlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThreePanelLayout user={user} onLogout={onLogout} waitlistCount={waitlist.length}>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <LeftPanel>
        <WaitlistPanel
          waitlist={waitlist}
          onAddParty={addParty}
          onStatusChange={handleSeatParty}
          onRemove={removeParty}
        />
      </LeftPanel>

      <CenterPanel>
        <FloorPlanView ref={floorPlanRef} />
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