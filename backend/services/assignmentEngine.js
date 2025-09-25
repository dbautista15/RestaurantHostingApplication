// backend/services/core/assignmentEngine.js
const Table = require("../models/Table");
const User = require("../models/User");
const SectionConfiguration = require("../models/SectionConfiguration");
const fairnessService = require("./fairnessService");

class AssignmentEngine {
  /**
   * 🎯 SINGLE SOURCE OF TRUTH for all assignments
   * This is the ONLY place assignment algorithm exists
   */
  async findBestAssignment(partySize, options = {}) {
    const {
      excludeWaiters = [],
      urgentParty = false,
      tablePreference = null,
    } = options;

    try {
      // 1. Get current system state from database
      const systemState = await this.getSystemState(partySize, excludeWaiters);

      if (!systemState.hasAvailableTables) {
        return null;
      }

      // 2. Calculate current fairness matrix (SSOT)
      const fairnessMatrix = await fairnessService.getCurrentMatrix();

      // 3. Apply assignment algorithm (SINGLE IMPLEMENTATION)
      const assignment = this.calculateOptimalAssignment(
        partySize,
        systemState,
        fairnessMatrix,
        { urgentParty, tablePreference }
      );

      return assignment;
    } catch (error) {
      console.error("Assignment engine error:", error);
      throw error;
    }
  }

  async getSystemState(partySize, excludeWaiters) {
    const [availableTables, activeWaiters, activeConfig] = await Promise.all([
      Table.find({
        state: "available",
        section: { $ne: null },
        capacity: { $gte: partySize, $lte: partySize + 2 },
      }),
      User.find({
        role: "waiter",
        isActive: true,
        shiftStart: { $ne: null },
        _id: { $nin: excludeWaiters },
      }).sort({ section: 1 }),
      SectionConfiguration.findOne({ isActive: true }),
    ]);

    // DEBUG: Log what we found
    console.log("=== ASSIGNMENT ENGINE DEBUG ===");
    console.log("Party size:", partySize);
    console.log("Available tables found:", availableTables.length);
    console.log("Active waiters found:", activeWaiters.length);
    console.log("Active config:", activeConfig?.shiftName || "NONE");

    if (availableTables.length > 0) {
      console.log(
        "Tables:",
        availableTables.map((t) => ({
          number: t.tableNumber,
          section: t.section,
          capacity: t.capacity,
          state: t.state,
        }))
      );
    }

    if (activeWaiters.length > 0) {
      console.log(
        "Waiters:",
        activeWaiters.map((w) => ({
          name: w.userName,
          section: w.section,
          shiftStart: w.shiftStart,
        }))
      );
    }

    return {
      availableTables,
      activeWaiters,
      activeConfig,
      hasAvailableTables: availableTables.length > 0,
      hasActiveWaiters: activeWaiters.length > 0,
    };
  }

  calculateOptimalAssignment(partySize, systemState, fairnessMatrix, options) {
    const { availableTables, activeWaiters } = systemState;
    const { urgentParty, tablePreference } = options;

    // ADD DEBUG LOGGING
    console.log("=== ASSIGNMENT DEBUG ===");
    console.log("Active waiters count:", activeWaiters.length);
    console.log("Matrix rows count:", fairnessMatrix.matrix.length);
    console.log(
      "Waiter IDs:",
      activeWaiters.map((w) => ({
        id: w._id,
        name: w.userName,
        section: w.section,
      }))
    );
    console.log(
      "Matrix waiter IDs:",
      fairnessMatrix.waiters.map((w) => ({ id: w.id, name: w.name }))
    );

    // Group tables by waiter section
    const tablesBySection = this.groupTablesBySection(availableTables);

    // Find best waiter using fairness algorithm
    const bestWaiter = this.selectBestWaiter(
      partySize,
      activeWaiters,
      fairnessMatrix,
      urgentParty
    );

    if (!bestWaiter) return null;

    // Find best table for selected waiter
    const bestTable = this.selectBestTable(
      bestWaiter,
      partySize,
      tablesBySection[bestWaiter.section] || [],
      tablePreference
    );

    if (!bestTable) return null;

    return {
      waiter: bestWaiter,
      table: bestTable,
      partySize,
      confidence: this.calculateConfidence(
        partySize,
        bestTable,
        fairnessMatrix
      ),
      reason: this.generateReason(partySize, bestWaiter, fairnessMatrix),
      algorithm: "fairness-optimized",
      timestamp: new Date(),
    };
  }

  groupTablesBySection(tables) {
    return tables.reduce((acc, table) => {
      if (!acc[table.section]) acc[table.section] = [];
      acc[table.section].push(table);
      return acc;
    }, {});
  }

  selectBestWaiter(partySize, waiters, matrix, urgentParty) {
    const partySizeIndex = this.getPartySizeIndex(partySize);

    return waiters.reduce((best, current) => {
      // Find the waiter's index in the matrix by ID
      const matrixIndex = matrix.waiterIdToIndex[current._id.toString()];

      if (matrixIndex === undefined) {
        console.warn(
          `Waiter ${current.userName} (${current._id}) not found in fairness matrix - skipping`
        );
        return best;
      }

      const currentCount = matrix.matrix[matrixIndex][partySizeIndex];
      const currentTotal = matrix.matrix[matrixIndex].reduce(
        (a, b) => a + b,
        0
      );

      if (!best)
        return {
          ...current.toObject(),
          matrixIndex,
          count: currentCount,
          total: currentTotal,
        };

      // Urgent parties get less strict fairness (total tables matter more)
      if (urgentParty) {
        return currentTotal < best.total
          ? {
              ...current.toObject(),
              matrixIndex,
              count: currentCount,
              total: currentTotal,
            }
          : best;
      }

      // Normal fairness: prefer waiter with lowest count for this party size
      if (
        currentCount < best.count ||
        (currentCount === best.count && currentTotal < best.total)
      ) {
        return {
          ...current.toObject(),
          matrixIndex,
          count: currentCount,
          total: currentTotal,
        };
      }

      return best;
    }, null);
  }

  selectBestTable(waiter, partySize, availableTables, tablePreference) {
    if (!availableTables || availableTables.length === 0) return null;

    // If specific table requested and available, use it
    if (tablePreference) {
      const preferredTable = availableTables.find(
        (t) => t.tableNumber === tablePreference
      );
      if (preferredTable) return preferredTable;
    }

    // Find table with best capacity match
    return availableTables.reduce((best, current) => {
      if (!best) return current;

      const bestDiff = Math.abs(best.capacity - partySize);
      const currentDiff = Math.abs(current.capacity - partySize);

      return currentDiff < bestDiff ? current : best;
    });
  }

  getPartySizeIndex(partySize) {
    return Math.min(5, Math.max(0, partySize - 1));
  }

  calculateConfidence(partySize, table, matrix) {
    let confidence = 100;

    // Perfect size match bonus
    if (table.capacity === partySize) {
      confidence += 10;
    } else {
      // Penalty for size mismatch
      const sizeDiff = Math.abs(table.capacity - partySize);
      confidence -= sizeDiff * 15;
    }

    // Fairness bonus (balanced matrix = higher confidence)
    const fairnessScore = matrix.fairnessScore || 50;
    confidence += Math.min(20, fairnessScore / 5);

    return Math.max(60, Math.min(100, confidence));
  }

  generateReason(partySize, waiter, matrix) {
    const partySizeIndex = this.getPartySizeIndex(partySize);

    // Prefer the index we attached in selectBestWaiter
    let rowIndex = waiter.matrixIndex;

    // Fallback by ID (handles older callers/tests)
    if (rowIndex === undefined && matrix?.waiterIdToIndex) {
      const id = waiter?._id?.toString?.();
      rowIndex = matrix.waiterIdToIndex[id];
    }

    // Last-resort guard: if no valid row, avoid crashing and give a generic reason
    if (rowIndex === undefined || !matrix?.matrix?.[rowIndex]) {
      return `${waiter.userName} is eligible (no fairness row found yet)`;
    }

    const count = matrix.matrix[rowIndex][partySizeIndex] ?? 0;
    if (count === 0) {
      return `${waiter.userName} hasn't had a ${partySize}-top yet today`;
    }
    return `${waiter.userName} has the fewest ${partySize}-tops (${count})`;
  }
}

module.exports = new AssignmentEngine();
