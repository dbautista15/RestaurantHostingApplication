// src/components/dashboard/Dashboard.jsx
import React from 'react';
import { useWaitlist } from '../../hooks/useWaitlist';
import { useMatrixSeating } from '../../hooks/useMatrixSeating';
import { useShift } from '../../context/ShiftContext';
import { WaitlistPanel } from '../waitlist/WaitlistPanel';
import { FloorPlanView } from '../floorplan/FloorPlanView';
import { SuggestionsPanel } from '../seating/SuggestionsPanel';
import { ThreePanelLayout, LeftPanel, CenterPanel, RightPanel } from '../shared/ThreePanelLayout';

const MOCK_TABLES = [
  { id: 'A1', state: 'available', capacity: 4 },
  { id: 'A2', state: 'occupied', capacity: 2 }
];

export const Dashboard = ({ user, onLogout }) => {
  const { shiftData } = useShift(); // ✅ Get shift data
  
  const { 
    waitlist, 
    loading, 
    error, 
    addParty, 
    updatePartyStatus, 
    removeParty 
  } = useWaitlist();

  // ✅ Use actual waiters from shift data instead of mock
  const activeWaiters = shiftData.serverOrder || [];

  const {
    matrix,
    suggestions,
    pendingAssignments,
    assignPartyToTable,
    confirmSeating,
    cancelAssignment
  } = useMatrixSeating(activeWaiters, MOCK_TABLES, waitlist);

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

      {/* Left: Waitlist */}
      <LeftPanel>
        <WaitlistPanel
          waitlist={waitlist}
          onAddParty={addParty}
          onStatusChange={updatePartyStatus}
          onRemove={removeParty}
        />
      </LeftPanel>

      {/* Center: Floor Plan */}
      <CenterPanel>
        <FloorPlanView />
      </CenterPanel>

      {/* Right: Suggestions & Matrix */}
      <RightPanel>
        <SuggestionsPanel
          suggestions={suggestions}
          matrix={matrix}
          waiters={activeWaiters} // ✅ Pass actual waiters from shift
          pendingAssignments={pendingAssignments}
          onAssignParty={assignPartyToTable}
          onConfirmSeating={confirmSeating}
          onCancelAssignment={cancelAssignment}
        />
      </RightPanel>
    </ThreePanelLayout>
  );
};