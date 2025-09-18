// ================================================================
// FILE: src/components/seating/PendingAssignments.jsx
// ================================================================
import React from 'react';

export const PendingAssignments = ({ assignments, onConfirm, onCancel }) => {
  if (assignments.length === 0) return null;

  return (
	<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
	  <h3 className="font-semibold text-yellow-800 mb-3">Pending Assignments</h3>
	  
	  <div className="space-y-2">
		{assignments.map(assignment => (
		  <div key={assignment.id} className="flex justify-between items-center bg-white p-2 rounded">
			<div className="text-sm">
			  <span className="font-medium">{assignment.partyId}</span>
			  <span className="text-gray-500"> → Table {assignment.tableId}</span>
			</div>
			<div className="flex gap-2">
			  <button
				onClick={() => onConfirm(assignment.id)}
				className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
			  >
				Seated
			  </button>
			  <button
				onClick={() => onCancel(assignment.id)}
				className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
			  >
				Cancel
			  </button>
			</div>
		  </div>
		))}
	  </div>
	</div>
  );
};