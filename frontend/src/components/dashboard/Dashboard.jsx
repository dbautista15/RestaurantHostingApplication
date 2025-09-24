// Dashboard.jsx - SIMPLIFIED
import React, { useRef } from 'react';
import { useBackendSeating } from '../../hooks/useBackendSeating'; // ✅ One hook replaces many
import { WaitlistPanel } from '../components/waitlist/WaitlistPanel';
import { FloorPlanView } from '../components/floorplan/FloorPlanView';
import {ThreePanelLayout} from '../shared/ThreePanelLayout';

export const Dashboard = ({ user, onLogout }) => {
  const floorPlanRef = useRef(null);
  
  // ✅ One hook provides everything
  const {
    waitlist,
    tables, 
    matrix,
    suggestions,
    recentlySeated,
    loading,
    error,
    seatParty,
    addParty,
    updateParty,
    removeParty
  } = useRestaurant();

  // ✅ Simple handlers - no complex logic
  const handleSeatParty = async (partyId) => {
    const result = await seatParty(partyId);
    
    // Update floor plan based on backend result
    if (result.success && result.assignment && floorPlanRef.current) {
      floorPlanRef.current.updateTableState(
        result.assignment.table.id,
        'occupied',
        { name: result.assignment.party.name, size: result.assignment.partySize }
      );
    }
  };

  if (loading && waitlist.length === 0) {
    return <div>Loading...</div>; // You can keep your nice loading UI
  }

  return (
    <ThreePanelLayout user={user} onLogout={onLogout}>
      <LeftPanel>
        <WaitlistPanel
          waitlist={waitlist}
          recentlySeated={recentlySeated}
          onAddParty={addParty}
          onSeatParty={handleSeatParty} // ✅ Simple handler
          onUpdateParty={updateParty}
          onRemoveParty={removeParty}
        />
      </LeftPanel>

      <CenterPanel>
        <FloorPlanView ref={floorPlanRef} tables={tables} />
      </CenterPanel>

      <RightPanel>
        {/* ✅ Simple matrix display - no complex suggestion logic */}
        <MatrixDisplay matrix={matrix} />
        {suggestions.length > 0 && (
          <SuggestionsList 
            suggestions={suggestions} 
            onAccept={handleSeatParty}
          />
        )}
      </RightPanel>
    </ThreePanelLayout>
  );
};