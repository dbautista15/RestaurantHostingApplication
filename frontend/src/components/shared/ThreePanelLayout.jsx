// src/components/shared/ThreePanelLayout.jsx
import React from 'react';
import { LAYOUT_CONFIG } from '../../config/constants';

export const ThreePanelLayout = ({ children, user, onLogout, waitlistCount }) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* App Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Smart Seater Host Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome back, {user.role} • {waitlistCount} parties waiting
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors text-sm"
          >
            Sign Out
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