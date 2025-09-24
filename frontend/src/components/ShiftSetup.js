// src/components/ShiftSetup.js - NO CONTEXT NEEDED
import React, { useState } from 'react';
import { useActions } from '../hooks/useAction';

const ShiftSetup = ({ onComplete }) => {
  const [serverCount, setServerCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { shifts } = useActions();

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 🎯 Backend handles EVERYTHING
      // - Assigns sections based on server count
      // - Updates floor plan table assignments
      // - Initializes fairness matrix
      // - Sets up shift configuration
      const result = await shifts.quickSetup(serverCount);
      
      if (result.success) {
        // Backend has updated everything, just refresh the dashboard
        onComplete();
      } else {
        setError(result.error || 'Setup failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to setup shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-6">Shift Setup</h2>
        <p className="text-gray-600 text-center mb-6">
          How many servers are working tonight?
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Servers
            </label>
            <select
              value={serverCount}
              onChange={(e) => setServerCount(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {[4, 5, 6, 7].map(num => (
                <option key={num} value={num}>{num} servers</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Tables will be divided into {serverCount} sections</li>
              <li>✓ Each server gets approximately equal tables</li>
              <li>✓ Fairness tracking starts fresh</li>
              <li>✓ Floor plan updates automatically</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Start Shift'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftSetup;