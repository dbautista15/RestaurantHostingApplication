// frontend/src/components/shared/ThreePanelLayout.jsx - Updated with WebSocket status
import React, { useState } from "react";
import { LAYOUT_CONFIG } from "../../config/constants";

export const ThreePanelLayout = ({
  children,
  user,
  onLogout,
  waitlistCount,
  businessMetrics,
  onShowWaiterManager,
  onStartNewShift,
  isConnected = false, // 🎯 NEW: WebSocket connection status
}) => {
  const [isOffline, setIsOffline] = useState(false);

  const [stats, setStats] = useState({
    apiCalls: Math.floor(Math.random() * 50) + 20,
    avgResponseTime: Math.floor(Math.random() * 100) + 50,
    cacheHits: Math.floor(Math.random() * 30) + 10,
  });

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* App Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Smart Seater Host Dashboard
            </h1>
            <div className="flex items-center gap-6">
              <p className="text-sm text-gray-600">
                Welcome back, {user.userName} ({user.role}) • {waitlistCount}{" "}
                parties waiting
              </p>

              {/* Business Impact Metrics */}
              {businessMetrics && (
                <div className="text-xs text-blue-600 flex gap-4 border-l border-gray-300 pl-4">
                  <span>🍽️ Tables: {businessMetrics.totalTablesServed}</span>
                  <span>⚖️ Fairness: {businessMetrics.fairnessScore}/100</span>
                  <span>
                    💰 Tips: $
                    {(businessMetrics.totalTablesServed * 35).toLocaleString()}
                  </span>
                  <span>⏰ Avg Wait: {businessMetrics.avgWaitTime}min</span>
                  {businessMetrics.activeWaiters && (
                    <span>👥 Staff: {businessMetrics.activeWaiters}</span>
                  )}
                </div>
              )}

              {/* Performance Stats */}
              <div className="text-xs text-gray-500 flex gap-4 border-l border-gray-300 pl-4">
                <span>📡 API: {stats.apiCalls}</span>
                <span>⚡ {stats.avgResponseTime}ms</span>
                <span>💾 Cache: {stats.cacheHits}</span>
                {/* 🎯 NEW: WebSocket status indicator */}
                <span
                  className={`flex items-center gap-1 ${
                    isConnected ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-600 animate-pulse" : "bg-red-600"
                    }`}
                  />
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Start New Shift Button - Only for hosts */}
            {onStartNewShift && (
              <button
                onClick={onStartNewShift}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                title="Start a new shift (lunch/dinner)"
              >
                🍽️ Start New Shift
              </button>
            )}

            {/* Existing Manage Staff button */}
            {onShowWaiterManager && user.role === "host" && (
              <button
                onClick={onShowWaiterManager}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                title="Manage waiters and sections"
              >
                👥 Manage Staff
              </button>
            )}

            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isOffline
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
              }`}
            >
              {isOffline ? "📶 Go Online" : "📵 Demo Offline"}
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center">
              <span className="text-lg mr-2">📵</span>
              <div>
                <p className="font-medium text-yellow-800">
                  Demo: Offline Mode
                </p>
                <p className="text-sm text-yellow-700">
                  In production, changes would queue and sync when reconnected
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🎯 NEW: WebSocket disconnection banner */}
        {!isOffline && !isConnected && (
          <div className="bg-red-50 border-l-4 border-red-400 p-2">
            <div className="flex items-center">
              <span className="text-sm mr-2">⚠️</span>
              <p className="text-sm text-red-700">
                Real-time updates paused - Connection lost. Updates will sync
                when reconnected.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
};

// Panel components remain unchanged
export const LeftPanel = ({ children }) => (
  <div
    className="flex-shrink-0 h-full border-r border-gray-200"
    style={{
      width: LAYOUT_CONFIG.panels.waitlist.width,
      minWidth: LAYOUT_CONFIG.panels.waitlist.minWidth,
    }}
  >
    {children}
  </div>
);

export const CenterPanel = ({ children }) => (
  <div
    className="flex-1 h-full"
    style={{ minWidth: LAYOUT_CONFIG.panels.floorplan.minWidth }}
  >
    {children}
  </div>
);

export const RightPanel = ({ children }) => (
  <div
    className="flex-shrink-0 h-full border-l border-gray-200"
    style={{
      width: LAYOUT_CONFIG.panels.suggestions.width,
      minWidth: LAYOUT_CONFIG.panels.suggestions.minWidth,
    }}
  >
    {children}
  </div>
);
