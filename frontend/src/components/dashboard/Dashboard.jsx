// frontend/src/components/dashboard/Dashboard.jsx - WebSocket Enhanced Version
import React, { useRef } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import { useDashboardWebSocket } from "../../hooks/useWebSocket"; // NEW
import { WaitlistPanel } from "../waitlist/WaitlistPanel";
import { FloorPlanView } from "../floorplan/FloorPlanView";
import { SuggestionsPanel } from "../seating/SuggestionsPanel";
import { SimpleWaiterManager } from "../dashboard/SimpleWaiterManager";
import {
  ThreePanelLayout,
  LeftPanel,
  CenterPanel,
  RightPanel,
} from "../shared/ThreePanelLayout";
import { useActions } from "../../hooks/useAction";

// Loading and Error components (unchanged)
const DashboardSkeleton = () => (
  <div className="h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">
        Loading Dashboard...
      </h2>
      <p className="text-gray-500">Getting latest restaurant data</p>
    </div>
  </div>
);

const DashboardError = ({ error, onRetry }) => (
  <div className="h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        Dashboard Unavailable
      </h2>
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
  const [showWaiterManager, setShowWaiterManager] = React.useState(false);
  const { tables: tableActions } = useActions();

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
    refresh,
  } = useDashboard();

  // 🎯 NEW: WebSocket integration
  const { isConnected, syncTableState, requestGlobalRefresh } =
    useDashboardWebSocket(refresh);

  const shiftIsConfigured = shift?.isConfigured;

  // Shift setup effect (unchanged)
  React.useEffect(() => {
    if (loading || error) return;
    if (user?.role !== "host") return;

    if (shiftIsConfigured === false) {
      onNeedShiftSetup();
    }
  }, [loading, error, user?.role, shiftIsConfigured, onNeedShiftSetup]);

  // Simple handler for starting new shift
  const handleStartNewShift = () => {
    onNeedShiftSetup();
  };

  // Show shift setup screen if not configured
  if (shift?.isConfigured === false && user?.role === "host") {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Shift Setup Required
          </h2>
          <p className="text-gray-500 mb-6">
            Configure tonight's server sections
          </p>
          <button
            onClick={onNeedShiftSetup}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Setup Shift
          </button>
        </div>
      </div>
    );
  }

  if (error) return <DashboardError error={error} onRetry={refresh} />;
  if (loading) return <DashboardSkeleton />;

  const handleWaiterUpdate = async () => {
    console.log("🔄 Waiter configuration changed - refreshing dashboard...");
    await refresh();
    // 🎯 NEW: Notify other clients via WebSocket
    requestGlobalRefresh("waiter_configuration_changed");
  };

  const handleTableClick = async (tableId, metadata = {}) => {
    try {
      const result = await tableActions.handleClick(tableId, metadata);

      if (result.success) {
        if (floorPlanRef.current) {
          floorPlanRef.current.highlightTable(tableId);
        }

        console.log(result.message);

        if (result.requiresRefresh) {
          await refresh();
          // 🎯 NEW: Sync table state via WebSocket
          const table = tables.find((t) => t.id === tableId);
          if (table) {
            syncTableState({
              tableId,
              newState: result.table.state,
              metadata,
            });
          }
        }
      }
    } catch (error) {
      console.error("Table click failed:", error);
      if (floorPlanRef.current) {
        floorPlanRef.current.showError(tableId, error.message);
      }
    }
  };

  const handleTableDrop = async (tableId, position) => {
    try {
      const result = await tableActions.handleDrop(tableId, position);

      if (result.success) {
        console.log(result.message);
        await refresh();
        // 🎯 NEW: Sync table position via WebSocket
        syncTableState({
          tableId,
          position,
          action: "position_updated",
        });
      } else if (result.revertPosition) {
        await refresh();
      }
    } catch (error) {
      console.error("Table drop failed:", error);
      await refresh();
    }
  };

  const checkNeedsPartySize = (tableId) => {
    const table = tables.find((t) => t.id === tableId);
    return table?.state === "available";
  };

  const handleSeatParty = async (partyId) => {
    try {
      const result = await seatParty(partyId);
      // 🎯 NEW: Notify other clients via WebSocket
      if (result?.success) {
        requestGlobalRefresh("party_seated");
      }
      return result;
    } catch (error) {
      console.error("Failed to seat party:", error);
    }
  };

  const businessMetrics = {
    totalTablesServed: tables.filter((t) => t.state === "occupied").length,
    fairnessScore: fairnessScore,
    avgWaitTime:
      waitlist.length > 0
        ? Math.round(
            waitlist.reduce((sum, p) => {
              const waitTime = Math.floor(
                (Date.now() - new Date(p.createdAt)) / (1000 * 60)
              );
              return sum + waitTime;
            }, 0) / waitlist.length
          )
        : 0,
    activeWaiters: waiters.length,
  };

  return (
    <>
      <ThreePanelLayout
        user={user}
        onLogout={onLogout}
        waitlistCount={waitlist.length}
        businessMetrics={businessMetrics}
        onShowWaiterManager={
          shift?.isConfigured ? () => setShowWaiterManager(true) : null
        }
        onStartNewShift={user?.role === "host" ? handleStartNewShift : null}
        // 🎯 NEW: Show WebSocket connection status
        isConnected={isConnected}
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
            onTableClick={handleTableClick}
            onTableDrop={handleTableDrop}
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

      {showWaiterManager && (
        <SimpleWaiterManager
          onClose={() => setShowWaiterManager(false)}
          onUpdate={handleWaiterUpdate}
        />
      )}
    </>
  );
};
