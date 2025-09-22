// src/components/waitlist/WaitlistPanel.jsx (Updated with special requests)
import React, { useState } from 'react';
import { WaitlistEntry } from './WaitlistEntry';
import { AddPartyModal } from './AddPartyModal';
import { sortWaitlistByPriority } from '../../utils/waitlistHelpers';

export const WaitlistPanel = ({ 
  waitlist, 
  onAddParty, 
  onStatusChange, 
  onRemove,
  onUpdate // ✅ NEW: Add update prop
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const sortedWaitlist = sortWaitlistByPriority(waitlist);

  const populateDemoData = () => {
    const demoParties = [
      { 
        name: 'Rodriguez Anniversary', 
        size: 2, 
        priority: 'normal', 
        wait: 25,
        specialRequests: 'Booth preferred - celebrating anniversary' // ✅ NEW
      },
      { 
        name: 'Chen (Staff)', 
        size: 4, 
        priority: 'coworker', 
        wait: 8,
        specialRequests: '' // ✅ NEW
      },
      { 
        name: 'Birthday - Thompson', 
        size: 10, 
        priority: 'large_party', 
        wait: 35,
        specialRequests: 'Birthday celebration - need space for gifts' // ✅ NEW
      },
      { 
        name: 'Wilson Date Night', 
        size: 2, 
        priority: 'normal', 
        wait: 12,
        specialRequests: 'Quiet table please' // ✅ NEW
      },
      { 
        name: 'Business Lunch - Park', 
        size: 6, 
        priority: 'normal', 
        wait: 18,
        specialRequests: 'Need table near outlets for laptops' // ✅ NEW
      }
    ];
    
    demoParties.forEach((party, i) => {
      setTimeout(() => onAddParty({
        partyName: party.name,
        partySize: party.size,
        priority: party.priority,
        phoneNumber: 7049394520,
        partyStatus: 'waiting',
        estimatedWait: party.wait,
        specialRequests: party.specialRequests // ✅ NEW: Include in demo data
      }), i * 500); // Stagger the additions for visual effect
    });
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
        
        {/* Demo Button */}
        <button
          onClick={populateDemoData}
          className="w-full bg-gray-500 text-white py-1 px-3 rounded text-sm mb-2 hover:bg-gray-600 transition-colors"
        >
          🎭 Load Demo Data (with Special Requests)
        </button>
        
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
            <p className="text-xs text-gray-400 mt-1">
              Add a party or load demo data to get started
            </p>
          </div>
        ) : (
          sortedWaitlist.map(entry => (
            <WaitlistEntry
              key={entry._id}
              entry={entry}
              onStatusChange={onStatusChange}
              onRemove={onRemove}
              onUpdate={onUpdate} // ✅ NEW: Pass update function
            />
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
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
          {/* ✅ NEW: Show count of parties with special requests */}
          <div>
            <div className="text-lg font-bold text-purple-600">
              {sortedWaitlist.filter(p => p.specialRequests && p.specialRequests.trim()).length}
            </div>
            <div className="text-xs text-gray-600">Special</div>
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