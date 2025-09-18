// src/components/dashboard/Dashboard.jsx
import React from 'react';
import { useWaitlist } from '../../hooks/useWaitlist';
import { useMatrixSeating } from '../../hooks/useMatrixSeating';
import { WaitlistPanel } from '../waitlist/WaitlistPanel';
import { FloorPlanView } from '../floorplan/FloorPlanView';
import { SuggestionsPanel } from '../seating/SuggestionsPanel';
import { ThreePanelLayout, LeftPanel, CenterPanel, RightPanel } from '../shared/ThreePanelLayout';

const MOCK_WAITERS = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Carol' },
  { id: 4, name: 'David' }
];

const MOCK_TABLES = [
  { id: 'A1', state: 'available', capacity: 4 },
  { id: 'A2', state: 'occupied', capacity: 2 }
];

export const Dashboard = ({ user, onLogout }) => {
  const { 
    waitlist, 
    loading, 
    error, 
    addParty, 
    updatePartyStatus, 
    removeParty 
  } = useWaitlist();

  const {
    matrix,
    suggestions,
    pendingAssignments,
    assignPartyToTable,
    confirmSeating,
    cancelAssignment
  } = useMatrixSeating(MOCK_WAITERS, MOCK_TABLES, waitlist);

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
          waiters={MOCK_WAITERS}
          pendingAssignments={pendingAssignments}
          onAssignParty={assignPartyToTable}
          onConfirmSeating={confirmSeating}
          onCancelAssignment={cancelAssignment}
        />
      </RightPanel>
    </ThreePanelLayout>
  );
};