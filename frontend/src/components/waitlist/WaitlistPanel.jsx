// frontend/src/components/waitlist/WaitlistPanel.jsx - COMPLETE UPDATED VERSION
import React, { useState } from 'react';
import { WaitlistEntry } from './WaitlistEntry';
import { AddPartyModal } from './AddPartyModal';
import { useActions } from '../../hooks/useAction'; // ✅ Import useActions

export const WaitlistPanel = ({ 
  waitlist, 
  onAddParty, 
  onSeatParty,  // Using onSeatParty instead of onStatusChange
  onRemove,
  onUpdate,
  recentlySeated = [],
  onRestoreParty,
  onClearRecentlySeated
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { demo } = useActions(); // ✅ Get demo actions

  // ✅ Helper to format time since seated
  const getTimeSinceSeated = (seatedAt) => {
    const minutes = Math.floor((Date.now() - new Date(seatedAt)) / (1000 * 60));
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} min ago`;
  };

  // ✅ Handle restore with user feedback
  const handleRestore = async (partyId) => {
    try {
      const result = await onRestoreParty(partyId);
      if (result && !result.success) {
        // Could add toast notification here in the future
        console.warn('Restore warning:', result.message);
      }
    } catch (error) {
      console.error('Failed to restore party:', error);
    }
  };

  // ✅ UPDATED: Use demo action from useActions
  const populateDemoData = async () => {
    try {
      await demo.populateWaitlist();
      // Dashboard will auto-refresh with new data
      // No need to manually update state!
    } catch (error) {
      console.error('Failed to populate demo data:', error);
      // Could add toast notification here
    }
  };

  // ✅ Handle status change for waitlist entries
  const handleStatusChange = (partyId, newStatus) => {
    if (newStatus === 'seated') {
      onSeatParty(partyId);
    }
    // Could handle other status changes here if needed
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Waitlist Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Waitlist</h2>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {waitlist.length} waiting
          </span>
        </div>
        
        {/* Demo Button - ✅ Now using useActions */}
        <button
          onClick={populateDemoData}
          className="w-full bg-gray-500 text-white py-1 px-3 rounded text-sm mb-2 hover:bg-gray-600 transition-colors"
        >
          🎭 Load Demo Data
        </button>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Add Party
        </button>
      </div>

      {/* Waitlist Entries */}
      <div className="flex-1 overflow-y-auto">
        {/* Active Waitlist */}
        <div className="p-4 space-y-3">
          {waitlist.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm">No parties waiting</p>
              <p className="text-xs text-gray-400 mt-1">
                Add a party or load demo data to get started
              </p>
            </div>
          ) : (
            waitlist.map(entry => (
              <WaitlistEntry
                key={entry._id}
                entry={entry}
                onStatusChange={handleStatusChange}
                onRemove={onRemove}
                onUpdate={onUpdate}
              />
            ))
          )}
        </div>

        {/* ✅ Recently Seated Section */}
        {recentlySeated.length > 0 && (
          <div className="border-t border-gray-300 bg-gray-100">
            <div className="p-4 pb-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Recently Seated</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {recentlySeated.length} parties
                  </span>
                  {recentlySeated.length > 5 && (
                    <button
                      onClick={onClearRecentlySeated}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                      title="Clear recently seated history"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentlySeated.slice(0, 10).map(party => (
                  <div 
                    key={party._id} 
                    className="bg-white p-3 rounded border border-gray-200 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {party.partyName}
                          </span>
                          <span className="text-xs text-gray-500">
                            party of {party.partySize}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>✅ Seated {getTimeSinceSeated(party.seatedAt)}</span>
                          {party.specialRequests && (
                            <span className="text-yellow-600" title={party.specialRequests}>
                              ⭐ Special requests
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRestore(party._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        title="Put back on waitlist"
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {recentlySeated.length > 10 && (
                <div className="text-center mt-2">
                  <span className="text-xs text-gray-500">
                    +{recentlySeated.length - 10} more parties seated
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-purple-600">
              {waitlist.filter(p => p.priority === 'coworker').length}
            </div>
            <div className="text-xs text-gray-600">Staff</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">
              {waitlist.filter(p => p.priority === 'large_party').length}
            </div>
            <div className="text-xs text-gray-600">Large</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {waitlist.filter(p => p.specialRequests && p.specialRequests.trim()).length}
            </div>
            <div className="text-xs text-gray-600">Special</div>
          </div>
          {/* ✅ Recently seated count */}
          <div>
            <div className="text-lg font-bold text-gray-600">
              {recentlySeated.length}
            </div>
            <div className="text-xs text-gray-600">Seated</div>
          </div>
        </div>
      </div>

      <AddPartyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddParty}
      />
    </div>
  );
};