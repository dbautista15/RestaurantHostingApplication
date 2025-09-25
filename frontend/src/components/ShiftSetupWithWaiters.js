import React, { useState, useEffect } from "react";

export const ShiftSetupWithWaiters = ({ onComplete }) => {
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWaiters();
  }, []);

  const loadWaiters = async () => {
    try {
      const response = await fetch("/api/users/clocked-in-waiters", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setWaiters(data.waiters || []);
      }
    } catch (err) {
      setError("Failed to load waiters");
    }
  };

  // Simple move up/down functions
  const moveUp = (index) => {
    if (index === 0) return;
    const newWaiters = [...waiters];
    [newWaiters[index], newWaiters[index - 1]] = [
      newWaiters[index - 1],
      newWaiters[index],
    ];
    setWaiters(newWaiters);
  };

  const moveDown = (index) => {
    if (index === waiters.length - 1) return;
    const newWaiters = [...waiters];
    [newWaiters[index], newWaiters[index + 1]] = [
      newWaiters[index + 1],
      newWaiters[index],
    ];
    setWaiters(newWaiters);
  };

  const handleSetupShift = async () => {
    if (waiters.length < 4) {
      setError("Need at least 4 waiters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/shifts/setup-with-waiters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          serverCount: waiters.length,
          orderedWaiters: waiters.map((w, index) => ({
            waiterId: w._id,
            section: index + 1,
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        onComplete();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-center mb-6">
          Assign Sections by Arrival Order
        </h2>

        <p className="text-gray-600 text-center mb-6">
          {waiters.length} waiters • First to arrive gets Section 1
        </p>

        {waiters.length < 4 && (
          <div className="bg-yellow-50 p-4 rounded-lg mb-4 text-yellow-700">
            ⚠️ Need at least 4 waiters. Currently have {waiters.length}.
          </div>
        )}

        {/* Simple list with up/down buttons */}
        <div className="space-y-2 mb-6">
          {waiters.map((waiter, index) => (
            <div
              key={waiter._id}
              className="bg-white border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="text-xl font-bold text-gray-500">
                  Section {index + 1}
                </div>
                <div>
                  <div className="font-medium">
                    {waiter.userName || waiter.name || "Unknown"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {waiter.clockInNumber}
                  </div>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === waiters.length - 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSetupShift}
            disabled={loading || waiters.length < 4}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Start Shift"}
          </button>
        </div>
      </div>
    </div>
  );
};
