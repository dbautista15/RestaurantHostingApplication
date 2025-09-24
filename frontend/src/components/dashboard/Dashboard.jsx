// frontend/src/components/dashboard/Dashboard.jsx - COMPLETE UPDATE
import React, { useRef } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { WaitlistPanel } from '../waitlist/WaitlistPanel';
import { FloorPlanView } from '../floorplan/FloorPlanView';
import { SuggestionsPanel } from '../seating/SuggestionsPanel';
import { ThreePanelLayout, LeftPanel, CenterPanel, RightPanel } from '../shared/ThreePanelLayout';
import { useActions } from '../../hooks/useAction';

// Loading and Error components (unchanged)
const DashboardSkeleton = () => (
  <div className="h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Loading Dashboard...</h2>
      <p className="text-gray-500">Getting latest restaurant data</p>
    </div>
  </div>
);

const DashboardError = ({ error, onRetry }) => (
  <div className="h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Dashboard Unavailable</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

export const Dashboard = ({ user, onLogout, onNeedShiftSetup }) => {
  const floorPlanRef = useRef(null);
  const { tables: tableActions } = useActions(); // 🎯 Get table actions
  
  const {
    waitlist,
    tables,
    matrix,
    waiters,
    suggestions,
    recentlySeated,
    fairnessScore,
    loading,
    error,
    shift, // 🎯 NEW: Get shift data
    seatParty,
    addParty,
    updateParty,
    removeParty,
    restoreParty,
    clearRecentlySeated,
    refresh
  } = useDashboard();

  // 🎯 Check if shift setup is needed
  React.useEffect(() => {
    if (!loading && !error && user?.role === 'host') {
      if (!shift?.isConfigured) {
        onNeedShiftSetup();
      }
    }
  }, [loading, error, shift, user, onNeedShiftSetup]);

  if (error) return <DashboardError error={error} onRetry={refresh} />;
  if (loading) return <DashboardSkeleton />;

  // 🎯 IMPLEMENT Table Click Handler
  const handleTableClick = async (tableId, metadata = {}) => {
    try {
      const result = await tableActions.handleClick(tableId, metadata);
      
      if (result.success) {
        // Show visual feedback
        if (floorPlanRef.current) {
          floorPlanRef.current.highlightTable(tableId);
        }
        
        // Show success message (you could add a toast here)
        console.log(result.message);
        
        // Refresh dashboard to get updated state
        if (result.requiresRefresh) {
          await refresh();
        }
      }
    } catch (error) {
      console.error('Table click failed:', error);
      if (floorPlanRef.current) {
        floorPlanRef.current.showError(tableId, error.message);
      }
    }
  };

  // 🎯 IMPLEMENT Table Drop Handler
  const handleTableDrop = async (tableId, position) => {
    try {
      const result = await tableActions.handleDrop(tableId, position);
      
      if (result.success) {
        console.log(result.message);
        await refresh();
      } else if (result.revertPosition) {
        // Position was invalid, refresh to revert
        await refresh();
      }
    } catch (error) {
      console.error('Table drop failed:', error);
      // Revert to server state on error
      await refresh();
    }
  };

  // 🎯 Check if party size modal needed
  const checkNeedsPartySize = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    // Backend data tells us if clickable and what state
    return table?.state === 'available';
  };

  const handleSeatParty = async (partyId) => {
    try {
      const result = await seatParty(partyId);
      return result;
    } catch (error) {
      console.error('Failed to seat party:', error);
    }
  };

  // Calculate business metrics
  const businessMetrics = {
    totalTablesServed: tables.filter(t => t.state === 'occupied').length,
    fairnessScore: fairnessScore,
    avgWaitTime: waitlist.length > 0 
      ? Math.round(waitlist.reduce((sum, p) => {
          const waitTime = Math.floor((Date.now() - new Date(p.createdAt)) / (1000 * 60));
          return sum + waitTime;
        }, 0) / waitlist.length)
      : 0
  };

  return (
    <ThreePanelLayout 
      user={user} 
      onLogout={onLogout}
      waitlistCount={waitlist.length}
      businessMetrics={businessMetrics}
    >
      <LeftPanel>
        <WaitlistPanel
          waitlist={waitlist}
          recentlySeated={recentlySeated}
          onAddParty={addParty}
          onSeatParty={handleSeatParty}
          onUpdateParty={updateParty}
          onRemoveParty={removeParty}
          onRestoreParty={restoreParty}
          onClearRecentlySeated={clearRecentlySeated}
        />
      </LeftPanel>

      <CenterPanel>
        <FloorPlanView 
          ref={floorPlanRef}
          tables={tables}
          gridConfig={{ size: 30, cols: 22, rows: 18 }}
          onTableClick={handleTableClick} // 🎯 Now implemented!
          onTableDrop={handleTableDrop}   // 🎯 Now implemented!
          onRequestPartySize={checkNeedsPartySize}
        />
      </CenterPanel>

      <RightPanel>
        <SuggestionsPanel
          suggestions={suggestions}
          matrix={matrix}
          waiters={waiters}
          fairnessScore={fairnessScore}
          onAssignParty={handleSeatParty}
        />
      </RightPanel>
    </ThreePanelLayout>
  );
};