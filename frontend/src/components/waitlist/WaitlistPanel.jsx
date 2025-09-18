// src/components/waitlist/WaitlistPanel.jsx (Simplified)
import React, { useState } from 'react';
import { WaitlistEntry } from './WaitlistEntry';
import { AddPartyModal } from './AddPartyModal';
import { sortWaitlistByPriority } from '../../utils/waitlistHelpers';

export const WaitlistPanel = ({ 
  waitlist, 
  onAddParty, 
  onStatusChange, 
  onRemove
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const sortedWaitlist = sortWaitlistByPriority(waitlist);

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
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Add Party
        </button>
      </div>

      {/* Waitlist Entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedWaitlist.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">No parties waiting</p>
          </div>
        ) : (
          sortedWaitlist.map(entry => (
            <WaitlistEntry
              key={entry._id}
              entry={entry}
              onStatusChange={onStatusChange}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              {sortedWaitlist.filter(p => p.priority === 'coworker').length}
            </div>
            <div className="text-xs text-gray-600">Staff</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">
              {sortedWaitlist.filter(p => p.priority === 'large_party').length}
            </div>
            <div className="text-xs text-gray-600">Large</div>
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