const AuditEvent = require("../models/AuditEvent");
const User = require("../models/User");

class FairnessService {
  /**
   * 🎯 SINGLE SOURCE OF TRUTH for fairness calculations
   */
  async getCurrentMatrix() {
    const activeWaiters = await User.find({
      role: "waiter",
      isActive: true,
      shiftStart: { $ne: null },
    }).sort({ section: 1 });

    if (activeWaiters.length === 0) {
      return { matrix: [], waiters: [], fairnessScore: 100 };
    }

    // Build matrix from audit events (real assignments)
    const matrix = await this.buildMatrixFromAuditTrail(activeWaiters);
    const fairnessScore = this.calculateFairnessScore(matrix);

    return {
      matrix,
      waiters: activeWaiters.map((w) => ({
        id: w._id.toString(), // Ensure it's a string
        name: w.userName,
        section: w.section,
      })),
      waiterIdToIndex: activeWaiters.reduce((map, w, idx) => {
        map[w._id.toString()] = idx;
        return map;
      }, {}),
      fairnessScore,
    };
  }

  async buildMatrixFromAuditTrail(waiters) {
    // rows = waiters, cols = party sizes 1..6 (index 0..5)
    const matrix = Array.from({ length: waiters.length }, () =>
      Array(6).fill(0)
    );

    // fast lookup: waiterId (string) -> row index
    const idToIndex = new Map(waiters.map((w, i) => [w._id.toString(), i]));

    // today only
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // we only need ids + party size; populate not required, but harmless
    const assignments = await AuditEvent.find({
      eventType: "ASSIGNMENT",
      createdAt: { $gte: today },
    }).select("userId metadata.partySize metadata.waiterId createdAt");

    // attribute credit to the *waiter* who took the table
    for (const a of assignments) {
      const partySize = Number(a?.metadata?.partySize);
      if (!Number.isFinite(partySize)) continue;

      // prefer waiterId; fallback to userId for old events
      const waiterIdStr =
        a?.metadata?.waiterId?.toString?.() ?? a?.userId?.toString?.();
      if (!waiterIdStr) continue;

      const row = idToIndex.get(waiterIdStr);
      if (row === undefined) continue; // event for someone not in today's waiter list

      const col = Math.min(5, Math.max(0, partySize - 1)); // 1..6 -> 0..5
      matrix[row][col] += 1;
    }

    return matrix;
  }

  calculateFairnessScore(matrix) {
    if (!matrix.length) return 100;

    const totals = matrix.map((row) => row.reduce((a, b) => a + b, 0));
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const variance =
      totals.reduce((sum, total) => sum + Math.pow(total - avg, 2), 0) /
      totals.length;

    return Math.max(0, 100 - Math.round(variance * 10));
  }

  async recordAssignment(waiterId, partySize) {
    // This method is called by the seating coordinator
    // It ensures the audit trail is updated consistently
    const waiter = await User.findById(waiterId);
    if (!waiter) throw new Error("Waiter not found");

    // The audit event creation happens in seatingCoordinator
    // This method can do additional fairness-related tracking if needed
    console.log(`Fairness: Recorded ${partySize}-top for ${waiter.userName}`);
  }
}

module.exports = new FairnessService();
