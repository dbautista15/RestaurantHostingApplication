// src/components/ShiftSetup.js
import React, { useState } from 'react';
import { useShift } from '../context/ShiftContext';

const ShiftSetup = () => {
  const { updateShiftData } = useShift();
  const [serverCount, setServerCount] = useState(4);
  const [serverOrder, setServerOrder] = useState([]);

  const handleSetup = () => {
    // Generate simple server order: Server 1, Server 2, etc.
    const order = Array.from({ length: serverCount }, (_, i) => ({
      id: i + 1,
      name: `Server ${i + 1}`,
      section: i + 1
    }));

    updateShiftData({
      serverCount,
      serverOrder: order
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-6">Shift Setup</h2>
        <p className="text-gray-600 text-center mb-6">
          Let's set up tonight's shift
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many servers are working tonight?
            </label>
            <select
              value={serverCount}
              onChange={(e) => setServerCount(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7].map(num => (
                <option key={num} value={num}>{num} servers</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Tonight's Setup:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {Array.from({ length: serverCount }, (_, i) => (
                <li key={i}>Server {i + 1} → Section {i + 1}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleSetup}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Start Shift
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftSetup;