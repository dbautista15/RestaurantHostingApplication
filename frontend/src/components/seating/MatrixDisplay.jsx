// src/components/seating/MatrixDisplay.jsx - NO SHIFT CONTEXT NEEDED
import React from 'react';

export const MatrixDisplay = ({ matrix, waiters, fairnessScore }) => {
  const partySizeLabels = ['1s', '2s', '3s', '4s', '5s', '6+'];
  
  // 🎯 CHANGE: Just use waiters prop directly - it already comes from backend!
  // No need for shiftData because dashboard provides the active waiters
  
  if (!waiters || waiters.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-3">Fairness Dashboard</h3>
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No servers configured for this shift</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-semibold mb-3">Fairness Dashboard</h3>
      <div className="text-xs text-gray-600 mb-2">
        {waiters.length} servers working tonight
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left p-1">Waiter</th>
              {partySizeLabels.map(label => (
                <th key={label} className="text-center p-1 min-w-8">{label}</th>
              ))}
              <th className="text-center p-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {waiters.map((waiter, waiterIndex) => {
              const total = matrix[waiterIndex]?.reduce((a, b) => a + b, 0) || 0;
              
              return (
                <tr key={waiter.id} className="border-t">
                  <td className="p-1 font-medium">
                    {/* 🎯 Waiter display - backend provides the name */}
                    {waiter.name} (S{waiter.section})
                  </td>
                  {matrix[waiterIndex]?.map((count, sizeIndex) => (
                    <td key={sizeIndex} className="text-center p-1">
                      <span className={`inline-block w-6 h-6 rounded text-xs leading-6 ${
                        count === 0 ? 'bg-gray-100 text-gray-400' :
                        count <= 2 ? 'bg-green-100 text-green-800' :
                        count <= 4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {count}
                      </span>
                    </td>
                  )) || partySizeLabels.map((_, i) => (
                    <td key={i} className="text-center p-1">
                      <span className="inline-block w-6 h-6 rounded text-xs leading-6 bg-gray-100 text-gray-400">
                        0
                      </span>
                    </td>
                  ))}
                  <td className="text-center p-1 font-semibold">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* 🎯 Fairness Score - Now passed as prop from backend */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          Fairness Score: 
          <span className={`font-medium ml-1 ${
            fairnessScore >= 80 ? 'text-green-600' :
            fairnessScore >= 60 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {fairnessScore}/100
          </span>
        </div>
      </div>
    </div>
  );
};