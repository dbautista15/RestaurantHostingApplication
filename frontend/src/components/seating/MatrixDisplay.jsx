// src/components/seating/MatrixDisplay.jsx
import React from 'react';
import { useShift } from '../../context/ShiftContext'; // ✅ Import shift context

export const MatrixDisplay = ({ matrix, waiters }) => {
  const { shiftData } = useShift(); // ✅ Get shift data
  const partySizeLabels = ['1s', '2s', '3s', '4s', '5s', '6+'];
  
  // ✅ Use actual waiters from shift context if available, fallback to props
  const activeWaiters = shiftData.serverOrder || waiters || [];
  
  if (activeWaiters.length === 0) {
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
        {/* ✅ Show shift info */}
        {activeWaiters.length} servers working tonight
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
            {/* ✅ Use activeWaiters instead of props.waiters */}
            {activeWaiters.map((waiter, waiterIndex) => {
              const total = matrix[waiterIndex]?.reduce((a, b) => a + b, 0) || 0;
              
              return (
                <tr key={waiter.id} className="border-t">
                  <td className="p-1 font-medium">
                    {/* ✅ Show actual waiter name instead of just W{id} */}
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
      
      {/* ✅ Add fairness indicator */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          Fairness Score: {/* Calculate based on variance in totals */}
          {(() => {
            const totals = activeWaiters.map((_, index) => 
              matrix[index]?.reduce((a, b) => a + b, 0) || 0
            );
            const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
            const variance = totals.reduce((sum, total) => sum + Math.pow(total - avg, 2), 0) / totals.length;
            const fairnessScore = Math.max(0, 100 - Math.round(variance * 10));
            
            return (
              <span className={`font-medium ${
                fairnessScore >= 80 ? 'text-green-600' :
                fairnessScore >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {fairnessScore}/100
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
};