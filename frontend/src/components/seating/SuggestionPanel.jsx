
import React from 'react';

export const SuggestionPanel = ({ suggestions, onAssign, onDismiss }) => {
  if (suggestions.length === 0) {
	return (
	  <div className="bg-gray-50 p-4 rounded-lg border text-center text-gray-500">
		<div className="text-2xl mb-2">🎯</div>
		<p className="text-sm">No seating suggestions available</p>
	  </div>
	);
  }

  return (
	<div className="space-y-3">
	  <h3 className="font-semibold text-gray-900">Smart Suggestions</h3>
	  
	  {suggestions.slice(0, 3).map(suggestion => (
		<div key={suggestion.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
		  <div className="flex justify-between items-start mb-2">
			<div>
			  <div className="font-medium text-sm">
				{suggestion.party.partyName} (party of {suggestion.party.partySize})
			  </div>
			  <div className="text-xs text-gray-600">
				→ Table {suggestion.table.number} (W{suggestion.waiter.id})
			  </div>
			</div>
			<div className="text-xs text-blue-600 font-medium">
			  {suggestion.confidence}%
			</div>
		  </div>
		  
		  <div className="text-xs text-gray-600 mb-3">
			{suggestion.reason}
		  </div>
		  
		  <div className="flex gap-2">
			<button
			  onClick={() => onAssign(suggestion.party._id, 'seated')}
			  className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
			>
			  Assign
			</button>
			<button
			  onClick={() => onDismiss(suggestion.id)}
			  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
			>
			  Skip
			</button>
		  </div>
		</div>
	  ))}
	</div>
  );
};