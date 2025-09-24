// frontend/src/components/dashboard/Dashboard.jsx - UPDATED VERSION
import React, { useRef } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { WaitlistPanel } from '../waitlist/WaitlistPanel';
import { FloorPlanView } from '../floorplan/FloorPlanView';
import { SuggestionsPanel } from '../seating/SuggestionsPanel';
import { ThreePanelLayout, LeftPanel, CenterPanel, RightPanel } from '../shared/ThreePanelLayout';
import { useActions } from '../../hooks/useAction';

// Loading and Error components remain the same
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

export const Dashboard = ({ user, onLogout,onNeedShiftSetup }) => {
  const floorPlanRef = useRef(null);
  const { seating, tables: tableActions } = useActions();
  
  // 🎯 Still using single dashboard hook - no change needed!
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
    shift,
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
      // Backend tells us if shift is configured
      if (!shift?.isConfigured) {
        onNeedShiftSetup();
      }
    }
  }, [loading, error, shift, user, onNeedShiftSetup]);

  if (error) return <DashboardError error={error} onRetry={refresh} />;
  if (loading) return <DashboardSkeleton />;

  // 🎯 NEW: Floor plan interaction handlers (backend decides everything)
  const handleTableClick = async (tableId, metadata = {}) => {
    try {
      // 🎯 WHY: Backend decides what clicking means
      const result = await tableActions.handleClick(tableId, metadata);
      
      if (result.success) {
        // Optional: Show visual feedback
        if (floorPlanRef.current) {
          floorPlanRef.current.highlightTable(tableId);
        }
        
        // Refresh to get updated state
        await refresh();
      }
    } catch (error) {
      console.error('Table click failed:', error);
      if (floorPlanRef.current) {
        floorPlanRef.current.showError(tableId, error.message);
      }
    }
  };

  const handleTableDrop = async (tableId, position) => {
    try {
      // 🎯 WHY: Backend validates if drop is allowed
      const result = await tableActions.handleDrop(tableId, position);
      
      if (result.success) {
        await refresh();
      } else {
        // Revert visual position
        await refresh();
      }
    } catch (error) {
      console.error('Table drop failed:', error);
      await refresh(); // Revert to server state
    }
  };

  const checkNeedsPartySize = (tableId) => {
    // 🎯 WHY: Let backend decide but we can make a guess for UX
    const table = tables.find(t => t.id === tableId);
    return table?.state === 'available';
  };

  // 🎯 Existing handlers remain mostly the same
  const handleSeatParty = async (partyId) => {
    try {
      const result = await seatParty(partyId);
      return result;
    } catch (error) {
      console.error('Failed to seat party:', error);
    }
  };

  // Business metrics calculation stays the same
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
      {/* LEFT PANEL: Waitlist - No changes needed */}
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

      {/* 🎯 CENTER PANEL: Floor Plan - Now truly presentation only */}
      <CenterPanel>
        <FloorPlanView 
          ref={floorPlanRef}
          tables={tables}
          gridConfig={{ size: 30, cols: 22, rows: 18 }} // Could come from backend
          onTableClick={handleTableClick}
          onTableDrop={handleTableDrop}
          onRequestPartySize={checkNeedsPartySize}
        />
      </CenterPanel>

      {/* RIGHT PANEL: Suggestions - No changes needed */}
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

/**
 * 🎯 WHAT CHANGED:
 * 
 * 1. FLOOR PLAN HANDLERS
 *    - onTableClick: Just passes click to backend
 *    - onTableDrop: Backend validates position
 *    - onRequestPartySize: Simple check, backend decides
 * 
 * 2. NO BUSINESS LOGIC
 *    - No state transitions
 *    - No validation
 *    - No assignment calculations
 * 
 * 3. BACKEND COMMUNICATION
 *    - Every action goes to backend
 *    - Always refresh after changes
 *    - Backend is source of truth
 * 
 * The Dashboard remains clean and simple!
 */