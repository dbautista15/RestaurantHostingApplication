// src/components/seating/SuggestionsPanel.jsx
import React from 'react';
import { SuggestionCard } from './SuggestionCard';
import { MatrixDisplay } from './MatrixDisplay';

export const SuggestionsPanel = ({ 
  suggestions,
  matrix,
  waiters,
  onAssignParty,
  fairnessScore,
  onConfirmSeating,
  onCancelAssignment 
}) => {
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Smart Seating</h2>
        <p className="text-sm text-gray-600">AI suggestions & fairness tracking</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">


        {/* Smart Suggestions */}
        <SuggestionCard 
          suggestions={suggestions}
          onAssign={onAssignParty}
          onDismiss={() => {}}
        />

        {/* Fairness Matrix */}
        {waiters.length > 0 && (
          <MatrixDisplay matrix={matrix} waiters={waiters} fairnessScore={fairnessScore}  // ← Add this too!
/>
        )}
      </div>
    </div>
  );
};