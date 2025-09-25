// frontend/src/components/dashboard/Dashboard.jsx
import React, { useRef } from "react";
import { WaitlistPanel } from "../waitlist/WaitlistPanel";
import { FloorPlanView } from "../floorplan/FloorPlanView";
import { SuggestionsPanel } from "../seating/SuggestionsPanel";
import { SimpleWaiterManager } from "./SimpleWaiterManager";
import {
  ThreePanelLayout,
  LeftPanel,
  CenterPanel,
  RightPanel,
} from "../shared/ThreePanelLayout";
import { useDashboard } from "../../hooks/useDashboard";
import { useDashboardWebSocket } from "../../hooks/useWebSocket"; // always call; hook must be unconditional

const API_BASE =
  (process.env.REACT_APP_API_BASE &&
    process.env.REACT_APP_API_BASE.replace(/\/$/, "")) ||
  "http://localhost:3000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
});

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

  // ✅ Unconditional hook call: this fixes the ESLint/rules-of-hooks error
  const { isConnected, syncTableState, requestGlobalRefresh } =
    useDashboardWebSocket(refresh);

  React.useEffect(() => {
    if (loading || error) return;
    if (user?.role !== "host") return;
    if (shift?.isConfigured === false) onNeedShiftSetup();
  }, [loading, error, user?.role, shift?.isConfigured, onNeedShiftSetup]);

  if (error) return <DashboardError error={error} onRetry={refresh} />;
  if (loading) return <DashboardSkeleton />;

  // === Floor plan handlers ===
  const checkNeedsPartySize = (tableId) => {
    const table = tables.find((t) => t.id === tableId);
    return table?.state === "available";
  };

  // in Dashboard.jsx
  const handleTableClick = async (tableId, meta) => {
    // meta can be: undefined | number | {partySize:number} | <table object>
    let body = {};

    if (typeof meta === "number") {
      body.partySize = meta;
    } else if (meta && typeof meta === "object") {
      if (typeof meta.partySize === "number") {
        body.partySize = meta.partySize;
      } // else it's a table object → ignore
    }

    try {
      const res = await fetch(`${API_BASE}/api/tables/${tableId}/click`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const msg = data?.error || `Failed (HTTP ${res.status})`;
        floorPlanRef.current?.showError(tableId, msg);
        return;
      }
      floorPlanRef.current?.highlightTable(tableId);
      await refresh();
      syncTableState?.({
        tableId,
        action: "state_changed",
        newState: data?.table?.state,
        partySize: body.partySize ?? null,
      });
    } catch (e) {
      console.error("Table click error:", e);
      floorPlanRef.current?.showError(tableId, e.message || "Click failed");
    }
  };

  const handleTableDrop = async (tableId, position) => {
    try {
      const res = await fetch(`${API_BASE}/api/tables/${tableId}/drop`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(position), // { x, y }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        console.error("Table drop failed:", data?.error || res.status);
        await refresh(); // revert on failure
        return;
      }
      await refresh();
      syncTableState?.({ tableId, position, action: "position_updated" });
    } catch (e) {
      console.error("Table drop error:", e);
      await refresh();
    }
  };

  const handleSeatParty = async (partyId) => {
    try {
      const result = await seatParty(partyId);
      if (result?.success) requestGlobalRefresh?.("party_seated");
      return result;
    } catch (e) {
      console.error("Failed to seat party:", e);
    }
  };

  const handleStartNewShift = () => {
    if (user?.role === "host") onNeedShiftSetup();
  };

  const handleWaiterUpdate = async () => {
    await refresh();
    requestGlobalRefresh?.("waiter_configuration_changed");
  };

  const businessMetrics = {
    totalTablesServed: tables.filter((t) => t.state === "occupied").length,
    fairnessScore,
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

  if (shift?.isConfigured === false && user?.role === "host") {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Shift Setup Required
          </h2>
          <p className="text-gray-500 mb-6">
            Configure tonight&apos;s server sections
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
        isConnected={!!isConnected}
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
