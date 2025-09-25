// frontend/src/components/ShiftSetupWithWaiters.jsx
import React, { useState, useEffect } from "react";
import { useActions } from "../hooks/useAction";

export const ShiftSetupWithWaiters = ({ onComplete }) => {
  const [availableWaiters, setAvailableWaiters] = useState([]);
  const [orderedWaiters, setOrderedWaiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { shifts, auth } = useActions();

  // Load clocked-in waiters on mount
  useEffect(() => {
    loadAvailableWaiters();
  }, []);

  const loadAvailableWaiters = async () => {
    try {
      // Get all waiters who are clocked in (shiftStart is not null)
      const response = await fetch(
        "http://localhost:3000/api/users/clocked-in-waiters",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      const data = await response.json();
      console.log("Waiters data:", data); // ADD THIS LINE

      if (data.success) {
        setAvailableWaiters(data.waiters);
        setOrderedWaiters(data.waiters); // Initial order
      }
    } catch (err) {
      setError("Failed to load waiters");
    }
  };

  // Handle drag and drop to reorder waiters
  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index);
  };

  const handleDragOver = (e) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = "move";
    return false;
  };

  const handleDrop = (e, dropIndex) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const dragIndex = parseInt(e.dataTransfer.getData("text/html"));

    if (dragIndex !== dropIndex) {
      const draggedWaiter = orderedWaiters[dragIndex];
      const newOrder = [...orderedWaiters];

      // Remove from old position
      newOrder.splice(dragIndex, 1);
      // Insert at new position
      newOrder.splice(dropIndex, 0, draggedWaiter);

      setOrderedWaiters(newOrder);
    }

    return false;
  };

  const handleSetupShift = async () => {
    if (orderedWaiters.length < 4) {
      setError("Need at least 4 waiters to start shift");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send the ordered waiters to backend
      const result = await fetch(
        "http://localhost:3000/api/shifts/setup-with-waiters",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            serverCount: orderedWaiters.length,
            orderedWaiters: orderedWaiters.map((w, index) => ({
              waiterId: w._id,
              section: index + 1, // Section based on order
            })),
          }),
        }
      );

      const data = await result.json();

      if (data.success) {
        onComplete();
      } else {
        setError(data.error || "Setup failed");
      }
    } catch (err) {
      setError(err.message || "Failed to setup shift");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-center mb-6">
          Tonight's Shift Setup
        </h2>

        <div className="mb-6">
          <p className="text-gray-600 text-center mb-4">
            {availableWaiters.length} waiters clocked in • Drag to reorder by
            arrival
          </p>

          {availableWaiters.length < 4 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
              <p className="text-yellow-800">
                ⚠️ Need at least 4 waiters to start shift. Currently have{" "}
                {availableWaiters.length}.
              </p>
            </div>
          )}

          {availableWaiters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No waiters have clocked in yet.</p>
              <p className="text-sm mt-2">
                Waiters must login before shift setup.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Arrival Order (drag to reorder):
              </div>

              {orderedWaiters.map((waiter, index) => (
                <div
                  key={waiter._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="bg-white border-2 border-gray-300 rounded-lg p-4 cursor-move hover:border-blue-400 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-400">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {waiter.userName || waiter.name || "Unknown"}
                        </div>

                        <div className="text-sm text-gray-500">
                          Clock #: {waiter.clockInNumber}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        index < 4
                          ? "bg-green-100 text-green-800"
                          : index < 6
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      Section {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {orderedWaiters.length >= 4 && (
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Configuration Preview:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • {Math.min(orderedWaiters.length, 7)} sections will be active
                </li>
                <li>• Tables will be distributed evenly</li>
                <li>
                  • First {Math.min(orderedWaiters.length, 7)} waiters will get
                  sections
                </li>
                {orderedWaiters.length > 7 && (
                  <li className="text-yellow-700">
                    ⚠️ Only first 7 waiters will get sections (max supported)
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSetupShift}
            disabled={loading || orderedWaiters.length < 4}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Start Shift"}
          </button>
        </div>
      </div>
    </div>
  );
};
