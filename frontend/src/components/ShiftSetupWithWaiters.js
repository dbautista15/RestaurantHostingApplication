// src/components/ShiftSetupWithWaiters.js
import React from "react";

/**
 * ShiftSetupWithWaiters
 * - Host picks/adjusts the order of waiters (this order becomes canonical for section assignment)
 * - Can add active waiters who forgot to clock in
 * - Posts ordered list to /api/shifts/setup-with-waiters; backend auto-clocks-in stragglers
 *
 * Props:
 *   onComplete?: () => void        // called after successful setup
 *   onCancel?: () => void          // optional cancel handler
 */

const API_BASE =
  (process.env.REACT_APP_API_BASE &&
    process.env.REACT_APP_API_BASE.replace(/\/$/, "")) ||
  "http://localhost:3000";

export default function ShiftSetupWithWaiters({ onComplete, onCancel }) {
  const [availableWaiters, setAvailableWaiters] = React.useState([]); // clocked-in list (seed)
  const [activeWaiters, setActiveWaiters] = React.useState([]); // all active waiters (addable)
  const [orderedWaiters, setOrderedWaiters] = React.useState([]); // canonical order user is editing
  const [selectedAddId, setSelectedAddId] = React.useState(""); // select menu value

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Load both lists on mount
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          throw new Error("Missing auth token");
        }
        const headers = { Authorization: `Bearer ${token}` };

        const [clockedRes, activeRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/clocked-in-waiters`, { headers }),
          fetch(`${API_BASE}/api/users/active-staff`, { headers }),
        ]);

        // Gracefully handle non-200s
        if (!clockedRes.ok) {
          const t = await clockedRes.text();
          throw new Error(
            `clocked-in-waiters failed (${clockedRes.status}): ${t.slice(
              0,
              160
            )}`
          );
        }
        if (!activeRes.ok) {
          const t = await activeRes.text();
          throw new Error(
            `active-staff failed (${activeRes.status}): ${t.slice(0, 160)}`
          );
        }

        const clockedJson = await clockedRes.json();
        const activeJson = await activeRes.json();

        if (cancelled) return;

        const clocked = clockedJson?.success ? clockedJson.waiters ?? [] : [];
        // users.js returns { success, staff: { hosts:[], waiters:[] } }
        const active = activeJson?.success
          ? activeJson?.staff?.waiters ?? []
          : [];

        setAvailableWaiters(clocked);
        setOrderedWaiters(clocked); // seed order with currently clocked-in
        setActiveWaiters(active);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load waiters");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute addable waiters: active list minus ones already in orderedWaiters
  const addableWaiters = React.useMemo(() => {
    const inOrder = new Set(orderedWaiters.map((w) => w._id));
    return activeWaiters.filter((w) => !inOrder.has(w._id));
  }, [activeWaiters, orderedWaiters]);

  // Simple, safe reorder helpers
  const move = React.useCallback((from, to) => {
    setOrderedWaiters((prev) => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= prev.length ||
        to >= prev.length
      )
        return prev;
      const next = prev.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);
  const moveUp = (i) => move(i, i - 1);
  const moveDown = (i) => move(i, i + 1);
  const moveTop = (i) => move(i, 0);
  const moveBottom = (i) => move(i, orderedWaiters.length - 1);
  const removeAt = (i) =>
    setOrderedWaiters((prev) => prev.filter((_, idx) => idx !== i));

  const handleAddSelected = () => {
    if (!selectedAddId) return;
    const w = activeWaiters.find((x) => x._id === selectedAddId);
    if (!w) return;
    setOrderedWaiters((prev) => [...prev, w]); // append (host can reorder after)
    setSelectedAddId("");
  };

  const handleSetupShift = async () => {
    setError(null);

    // Backend enforces 4..7; be friendly and prevent the bad call
    if (orderedWaiters.length < 4) {
      setError("Need at least 4 waiters to start shift.");
      return;
    }
    if (orderedWaiters.length > 7) {
      setError("Max supported is 7 waiters.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Missing auth token");
      }

      const res = await fetch(`${API_BASE}/api/shifts/setup-with-waiters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serverCount: orderedWaiters.length,
          orderedWaiters: orderedWaiters.map((w, index) => ({
            waiterId: w._id,
            section: index + 1, // 1-based section index, host order = canonical
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        const msg = data?.error || `Setup failed (${res.status})`;
        throw new Error(msg);
      }

      // Success: backend has assigned sections & auto-clocked-in any stragglers
      if (typeof onComplete === "function") onComplete();
    } catch (e) {
      setError(e.message || "Failed to setup shift");
    } finally {
      setSaving(false);
    }
  };

  // Basic UI
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-6 md:p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-center mb-6">
          Tonight&apos;s Shift Setup
        </h2>

        {/* Load / error states */}
        {loading ? (
          <div className="text-center text-gray-600 py-10">Loading…</div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-4 text-center text-gray-700">
              <span className="font-medium">{availableWaiters.length}</span>{" "}
              clocked in •{" "}
              <span className="font-medium">{activeWaiters.length}</span> active
              waiters total
            </div>

            {/* Add from active (not-yet–clocked-in) */}
            {addableWaiters.length > 0 && (
              <div className="mb-4 rounded-lg border p-3 bg-gray-50">
                <div className="text-sm font-medium mb-2">
                  Add a waiter who isn’t clocked in
                </div>
                <div className="flex gap-2">
                  <select
                    className="border rounded px-2 py-1 flex-1"
                    value={selectedAddId}
                    onChange={(e) => setSelectedAddId(e.target.value)}
                  >
                    <option value="">Select waiter…</option>
                    {addableWaiters.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.userName} {w.shiftStart ? "" : "(not clocked in)"}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSelected}
                    disabled={!selectedAddId}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Warnings */}
            {orderedWaiters.length < 4 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4 text-yellow-900">
                ⚠️ Need at least 4 waiters to start shift. Currently have{" "}
                {orderedWaiters.length}.
              </div>
            )}
            {orderedWaiters.length > 7 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4 text-yellow-900">
                ⚠️ Only the first 7 waiters will get sections (max supported).
              </div>
            )}

            {/* Ordered list */}
            <div className="space-y-2 mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Arrival / Section Order:
              </div>
              {orderedWaiters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No waiters yet. Add from “active” above.
                </div>
              ) : (
                orderedWaiters.map((waiter, index) => {
                  if (!waiter) return null; // hard guard
                  const badgeClass =
                    index < 4
                      ? "bg-green-100 text-green-800"
                      : index < 6
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800";

                  return (
                    <div
                      key={waiter._id}
                      className="bg-white border-2 border-gray-300 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-gray-400">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{waiter.userName}</div>
                            <div className="text-sm text-gray-500">
                              Clock #: {waiter.clockInNumber ?? "—"}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}
                          title={
                            index < 4
                              ? "Gets a section"
                              : index < 6
                              ? "Standby / fill-in"
                              : "Overflow"
                          }
                        >
                          Section {index + 1}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveTop(index)}
                          disabled={index === 0}
                          className="px-2 py-1 rounded border text-sm disabled:opacity-50"
                          title="Move to top"
                        >
                          Top
                        </button>
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="px-2 py-1 rounded border text-sm disabled:opacity-50"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === orderedWaiters.length - 1}
                          className="px-2 py-1 rounded border text-sm disabled:opacity-50"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBottom(index)}
                          disabled={index === orderedWaiters.length - 1}
                          className="px-2 py-1 rounded border text-sm disabled:opacity-50"
                          title="Move to bottom"
                        >
                          Bottom
                        </button>
                        <div className="ml-auto">
                          <button
                            type="button"
                            onClick={() => removeAt(index)}
                            className="px-2 py-1 rounded border text-sm"
                            title="Remove from order"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Preview */}
            {orderedWaiters.length >= 1 && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Configuration Preview
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • {Math.min(orderedWaiters.length, 7)} sections will be
                    active
                  </li>
                  <li>
                    • First {Math.min(orderedWaiters.length, 7)} waiters will
                    get sections
                  </li>
                  {orderedWaiters.length > 7 && (
                    <li className="text-yellow-700">
                      ⚠️ Only first 7 waiters will get sections (max supported)
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() =>
                  typeof onCancel === "function"
                    ? onCancel()
                    : window.location.reload()
                }
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSetupShift}
                disabled={
                  saving ||
                  orderedWaiters.length < 4 ||
                  orderedWaiters.length > 7
                }
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? "Setting up..." : "Start Shift"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
