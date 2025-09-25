// frontend/src/components/dashboard/SimpleWaiterManager.jsx
import React, { useState, useEffect } from 'react';
import { useActions } from '../../hooks/useAction';

export const SimpleWaiterManager = ({ onClose, onUpdate }) => {
  const [activeWaiters, setActiveWaiters] = useState([]);
  const [clockInNumber, setClockInNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [waitingForLogin, setWaitingForLogin] = useState(null);
  const { apiCall } = useActions();

  useEffect(() => {
    loadActiveWaiters();
  }, []);

  const loadActiveWaiters = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/users/waiters-by-section');
      if (response.success) {
        // Flatten the waiters from all sections and sort by section
        const waiters = [];
        for (let section = 1; section <= 7; section++) {
          if (response.waitersBySection[section]) {
            waiters.push(...response.waitersBySection[section]);
          }
        }
        setActiveWaiters(waiters.sort((a, b) => a.section - b.section));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWaiter = async () => {
    if (!clockInNumber.trim()) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      // Check if we're already at max
      if (activeWaiters.length >= 7) {
        setError('Maximum 7 waiters supported');
        return;
      }

      // Try to find and add the waiter
      const response = await apiCall('/shifts/add-waiter', {
        method: 'POST',
        body: JSON.stringify({ 
          clockInNumber: clockInNumber.toUpperCase().trim(),
          targetServerCount: activeWaiters.length + 1
        })
      });

      if (response.success) {
        setClockInNumber('');
        setWaitingForLogin(null);
        await loadActiveWaiters();
        onUpdate?.(); // Refresh dashboard
      }
      
    } catch (err) {
      // Handle "waiter not logged in" case
      if (err.message.includes('not logged in') || err.message.includes('not found')) {
        setWaitingForLogin(clockInNumber.toUpperCase().trim());
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveWaiter = async (waiterId) => {
    setActionLoading(true);
    setError(null);
    
    try {
      // Check if we're already at min
      if (activeWaiters.length <= 4) {
        setError('Minimum 4 waiters required');
        return;
      }

      const response = await apiCall('/shifts/remove-waiter', {
        method: 'POST', 
        body: JSON.stringify({ 
          waiterId,
          targetServerCount: activeWaiters.length - 1
        })
      });

      if (response.success) {
        await loadActiveWaiters();
        onUpdate?.(); // Refresh dashboard
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleContinueAfterLogin = () => {
    setWaitingForLogin(null);
    // Try adding again - they should be logged in now
    handleAddWaiter();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Manage Waiters</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Current Waiters */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">
            Current Waiters ({activeWaiters.length}/7)
          </h3>
          
          {activeWaiters.length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
              <p className="text-sm">No waiters currently working</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeWaiters.map(waiter => (
                <div key={waiter._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{waiter.userName}</div>
                    <div className="text-xs text-gray-600">
                      {waiter.clockInNumber} • Section {waiter.section}
                    </div>
                  </div>
                  
                  {activeWaiters.length > 4 && (
                    <button
                      onClick={() => handleRemoveWaiter(waiter._id)}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                    >
                      Send Home
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Waiter Section */}
        {activeWaiters.length < 7 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Add Waiter</h3>
            
            {waitingForLogin ? (
              // Waiting for login state
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-yellow-800 mb-3">
                    <strong>Tell {waitingForLogin} to log in first</strong>
                  </div>
                  <p className="text-xs text-yellow-700 mb-4">
                    They need to sign in on their device before being added to the shift
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWaitingForLogin(null)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleContinueAfterLogin}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? 'Adding...' : 'Continue'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Normal add waiter form
              <form onSubmit={(e) => { e.preventDefault(); handleAddWaiter(); }} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clock-In Number
                  </label>
                  <input
                    type="text"
                    value={clockInNumber}
                    onChange={(e) => setClockInNumber(e.target.value.toUpperCase())}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., W042, 003"
                    disabled={actionLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!clockInNumber.trim() || actionLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Adding...' : 'Add Waiter'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-600 mb-3">
            <span>Sections Active: {activeWaiters.length}</span>
            <span>Max Capacity: 7</span>
          </div>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};