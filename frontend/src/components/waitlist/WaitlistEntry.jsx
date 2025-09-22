import React, { useState } from 'react';
import { getPriorityColor, getPriorityLabel, getWaitTime } from '../../utils/waitlistHelpers';

export const WaitlistEntry = ({ entry, onStatusChange, onRemove, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false); // ✅ NEW: Confirmation state
  const [editData, setEditData] = useState({
    partyName: entry.partyName,
    partySize: entry.partySize,
    phoneNumber: entry.phoneNumber,
    specialRequests: entry.specialRequests || '',
    priority: entry.priority
  });
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setEditData({
      partyName: entry.partyName,
      partySize: entry.partySize,
      phoneNumber: entry.phoneNumber,
      specialRequests: entry.specialRequests || '',
      priority: entry.priority
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (onUpdate) {
        await onUpdate(entry._id, editData);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update party:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      partyName: entry.partyName,
      partySize: entry.partySize,
      phoneNumber: entry.phoneNumber,
      specialRequests: entry.specialRequests || '',
      priority: entry.priority
    });
  };

  // ✅ NEW: Handle seat party button click (show confirmation)
  const handleSeatPartyClick = () => {
    setShowConfirmation(true);
  };

  // ✅ NEW: Handle confirmed seating
  const handleConfirmSeating = () => {
    onStatusChange(entry._id, 'seated');
    setShowConfirmation(false);
  };

  // ✅ NEW: Cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
        <div className="space-y-3">
          {/* Party Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Party Name
            </label>
            <input
              type="text"
              value={editData.partyName}
              onChange={(e) => setEditData({...editData, partyName: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Party Size */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Party Size
            </label>
            <input
              type="number"
              value={editData.partySize}
              onChange={(e) => setEditData({...editData, partySize: parseInt(e.target.value) || 1})}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              min="1"
              max="20"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={editData.phoneNumber}
              onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Special Requests
            </label>
            <textarea
              value={editData.specialRequests}
              onChange={(e) => setEditData({...editData, specialRequests: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 resize-none"
              rows="2"
              maxLength="200"
              placeholder="Booth preferred, high chair needed..."
            />
            <div className="text-xs text-gray-500 mt-1">
              {editData.specialRequests.length}/200 characters
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={editData.priority}
              onChange={(e) => setEditData({...editData, priority: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal Priority</option>
              <option value="large_party">Large Party (8+)</option>
              <option value="coworker">Staff/Coworker</option>
            </select>
          </div>

          {/* Edit Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !editData.partyName || !editData.partySize}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ NEW: Confirmation mode
  if (showConfirmation) {
    return (
      <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-300">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚠️</span>
            <h3 className="font-semibold text-yellow-800">Confirm Seating</h3>
          </div>
          
          <div className="text-sm text-yellow-700">
            <p className="font-medium">{entry.partyName} - Party of {entry.partySize}</p>
            <p className="text-xs mt-1">
              This will remove them from the waitlist and mark them as seated.
              {entry.specialRequests && (
                <span className="block mt-1 italic">
                  Special requests: {entry.specialRequests}
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCancelConfirmation}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSeating}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
            >
              ✓ Confirm - Seat Party
            </button>
          </div>
          
          <div className="text-xs text-yellow-600 text-center">
            You can undo this action from the "Recently Seated" section below
          </div>
        </div>
      </div>
    );
  }

  // Default display mode
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{entry.partyName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
              {getPriorityLabel(entry.priority)}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Party of {entry.partySize} • {getWaitTime(entry.createdAt)} min wait
          </p>
          {entry.phoneNumber && (
            <p className="text-xs text-gray-500 mt-1">{entry.phoneNumber}</p>
          )}
          
          {/* Special Requests Display */}
          {entry.specialRequests && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-xs font-medium text-yellow-800 mb-1">Special Requests:</div>
              <div className="text-xs text-yellow-700">{entry.specialRequests}</div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        {/* ✅ MODIFIED: Changed to show confirmation instead of direct seating */}
        <button
          onClick={handleSeatPartyClick}
          className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-green-700 transition-colors"
        >
          Seat Party
        </button>
        
        {/* Edit Button */}
        <button
          onClick={handleEdit}
          className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          title="Edit party details"
        >
          ✏️
        </button>
        
        <button
          onClick={() => onRemove(entry._id)}
          className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};