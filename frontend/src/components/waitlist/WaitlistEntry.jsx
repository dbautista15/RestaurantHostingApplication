import React from 'react';
import { getPriorityColor, getPriorityLabel, getWaitTime } from '../../utils/waitlistHelpers';

export const WaitlistEntry = ({ entry, onStatusChange, onRemove }) => {
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
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onStatusChange(entry._id, 'seated')}
          className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-green-700 transition-colors"
        >
          Seat Party
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