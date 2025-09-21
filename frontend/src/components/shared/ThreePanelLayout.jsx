// src/components/shared/ThreePanelLayout.jsx
import React from 'react';
import { LAYOUT_CONFIG } from '../../config/constants';

export const ThreePanelLayout = ({ children, user, onLogout, waitlistCount }) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* App Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg border-b">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              🍽️
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SmartSeater Pro</h1>
              <p className="text-sm text-blue-100">
                {user.userName} • {user.role} • {waitlistCount} parties waiting
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-white transition-colors text-sm flex items-center gap-2"
          >
            👋 Sign Out
          </button>
        </div>
      </div>
      {/* Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export const LeftPanel = ({ children }) => (
  <div
    className="flex-shrink-0 h-full border-r border-gray-200"
    style={{ width: LAYOUT_CONFIG.waitlistWidth, minWidth: LAYOUT_CONFIG.minWaitlistWidth }}
  >
    {children}
  </div>
);

export const CenterPanel = ({ children }) => (
  <div
    className="flex-1 h-full"
    style={{ minWidth: LAYOUT_CONFIG.floorplanMinWidth }}
  >
    {children}
  </div>
);

export const RightPanel = ({ children }) => (
  <div
    className="flex-shrink-0 h-full border-l border-gray-200"
    style={{ width: LAYOUT_CONFIG.suggestionsWidth, minWidth: LAYOUT_CONFIG.minSuggestionsWidth }}
  >
    {children}
  </div>
);