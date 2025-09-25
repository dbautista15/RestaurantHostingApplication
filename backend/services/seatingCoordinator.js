// backend/services/core/seatingCoordinator.js
const Table = require("../models/Table");
const WaitlistEntry = require("../models/WaitlistEntry");
const AuditEvent = require("../models/AuditEvent");
const assignmentEngine = require("./assignmentEngine");
const fairnessService = require("./fairnessService");
const mongoose = require("mongoose");

class SeatingCoordinator {
  /**
   * 🎯 MAIN SEATING ORCHESTRATOR with Real-time Updates
   */
  async seatPartyFromWaitlist(partyId, requestedBy, options = {}) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1. Get party details
      const party = await WaitlistEntry.findById(partyId).session(session);
      if (!party || party.partyStatus !== "waiting") {
        throw new Error("Party not found or already seated");
      }

      // 2. Find optimal assignment (delegates to assignmentEngine)
      const assignment = await assignmentEngine.findBestAssignment(
        party.partySize,
        options
      );

      if (!assignment) {
        throw new Error("No suitable tables available");
      }

      // 3. Execute atomic seating transaction
      const result = await this.executeAtomicSeating(
        party,
        assignment,
        requestedBy,
        session
      );

      await session.commitTransaction();

      // 4. 🔥 EMIT SOCKET EVENTS after successful commit
      this.emitSeatingEvents(result, requestedBy);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async executeAtomicSeating(party, assignment, requestedBy, session) {
    // 1. Update table state
    const updatedTable = await Table.findOneAndUpdate(
      {
        tableNumber: assignment.table.tableNumber,
        state: "available", // Optimistic locking
      },
      {
        state: "occupied",
        assignedWaiter: assignment.waiter._id,
        partySize: assignment.partySize,
        assignedAt: new Date(),
        occupiedBy: {
          partyId: party._id,
          partyName: party.partyName,
          size: assignment.partySize,
        },
      },
      { new: true, session }
    );

    if (!updatedTable) {
      throw new Error("Table no longer available - conflict detected");
    }

    // 2. Update party status
    const updatedParty = await WaitlistEntry.findByIdAndUpdate(
      party._id,
      {
        partyStatus: "seated",
        seatedAt: new Date(),
        assignedTable: assignment.table.tableNumber,
        assignedWaiter: assignment.waiter._id,
      },
      { new: true, session }
    );

    // 3. Create comprehensive audit trail
    await AuditEvent.create(
      [
        {
          eventType: "ASSIGNMENT",
          tableId: assignment.table._id,
          userId: requestedBy._id,
          metadata: {
            partyId: party._id,
            partyName: party.partyName,
            partySize: assignment.partySize,
            waiterId: assignment.waiter._id,
            waiterName: assignment.waiter.userName,
            waiterSection: assignment.waiter.section,
            confidence: assignment.confidence,
            reason: assignment.reason,
            algorithm: assignment.algorithm,
            assignmentType: "smart_waitlist",
          },
        },
      ],
      { session }
    );

    // 4. Update fairness tracking
    await fairnessService.recordAssignment(
      assignment.waiter._id,
      assignment.partySize
    );

    return {
      assignment,
      updatedTable,
      updatedParty,
      matrixUpdate: {
        waiterId: assignment.waiter._id,
        waiterSection: assignment.waiter.section,
        partySize: assignment.partySize,
        operation: "increment",
      },
    };
  }

  /**
   * 🎯 MANUAL FLOOR PLAN SEATING with Socket Updates
   */
  async seatManuallyOnFloorPlan(tableNumber, partySize, requestedBy) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1. Validate table availability
      const table = await Table.findOne({
        tableNumber,
        state: "available",
      }).session(session);

      if (!table) {
        throw new Error("Table not available");
      }

      // 2. Find waiter for this section
      const waiter = await User.findOne({
        section: table.section,
        role: "waiter",
        isActive: true,
      }).session(session);

      if (!waiter) {
        throw new Error("No active waiter for this section");
      }

      // 3. Create manual assignment object
      const manualAssignment = {
        waiter,
        table,
        partySize,
        confidence: 100,
        reason: "Manual floor plan selection",
        algorithm: "manual",
        timestamp: new Date(),
      };

      // 4. Execute atomic manual seating
      const result = await this.executeManualSeating(
        manualAssignment,
        requestedBy,
        session
      );

      await session.commitTransaction();

      // 5. 🔥 EMIT SOCKET EVENTS
      this.emitManualSeatingEvents(result, requestedBy);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async executeManualSeating(assignment, requestedBy, session) {
    // Similar to executeAtomicSeating but for manual assignments
    const updatedTable = await Table.findOneAndUpdate(
      {
        tableNumber: assignment.table.tableNumber,
        state: "available",
      },
      {
        state: "occupied",
        assignedWaiter: assignment.waiter._id,
        partySize: assignment.partySize,
        assignedAt: new Date(),
        occupiedBy: {
          name: `Manual Party of ${assignment.partySize}`,
          size: assignment.partySize,
          source: "floor_plan",
        },
      },
      { new: true, session }
    );

    if (!updatedTable) {
      throw new Error("Table no longer available");
    }

    // Create audit trail for manual assignment
    await AuditEvent.create(
      [
        {
          eventType: "ASSIGNMENT",
          tableId: assignment.table._id,
          userId: requestedBy._id,
          metadata: {
            partySize: assignment.partySize,
            waiterId: assignment.waiter._id,
            waiterName: assignment.waiter.userName,
            waiterSection: assignment.waiter.section,
            confidence: assignment.confidence,
            reason: assignment.reason,
            algorithm: assignment.algorithm,
            assignmentType: "manual_floorplan",
          },
        },
      ],
      { session }
    );

    await fairnessService.recordAssignment(
      assignment.waiter._id,
      assignment.partySize
    );

    return {
      assignment,
      updatedTable,
      matrixUpdate: {
        waiterId: assignment.waiter._id,
        waiterSection: assignment.waiter.section,
        partySize: assignment.partySize,
        operation: "increment",
      },
    };
  }

  /**
   * 🔥 SOCKET EMISSION METHODS
   */
  emitSeatingEvents(result, requestedBy) {
    const io = global.io; // Assuming io is attached to global in server.js
    if (!io) {
      console.warn("Socket.IO not available - skipping real-time updates");
      return;
    }

    const { assignment, updatedTable, updatedParty, matrixUpdate } = result;

    // 1. Emit table state change
    io.emit("table_state_changed", {
      tableId: updatedTable._id,
      tableNumber: updatedTable.tableNumber,
      previousState: "available",
      newState: "occupied",
      partySize: assignment.partySize,
      waiterId: assignment.waiter._id,
      waiterName: assignment.waiter.userName,
      changedBy: {
        id: requestedBy._id,
        name: requestedBy.userName,
        role: requestedBy.role,
      },
      timestamp: new Date(),
    });

    // 2. Emit waitlist change
    io.emit("waitlist_changed", {
      action: "party_seated",
      partyId: updatedParty._id,
      partyName: updatedParty.partyName,
      partySize: updatedParty.partySize,
      tableNumber: updatedTable.tableNumber,
      waiterName: assignment.waiter.userName,
      seatedBy: {
        id: requestedBy._id,
        name: requestedBy.userName,
      },
      timestamp: new Date(),
    });

    // 3. Emit matrix update for fairness tracking
    io.emit("matrix_updated", {
      waiterId: matrixUpdate.waiterId,
      waiterSection: matrixUpdate.waiterSection,
      partySize: matrixUpdate.partySize,
      operation: matrixUpdate.operation,
      timestamp: new Date(),
    });

    // 4. Emit to waiter's specific room
    io.to(`waiter_${assignment.waiter._id}`).emit("new_table_assigned", {
      tableNumber: updatedTable.tableNumber,
      partyName: updatedParty.partyName,
      partySize: assignment.partySize,
      specialRequests: updatedParty.specialRequests,
      confidence: assignment.confidence,
      reason: assignment.reason,
    });

    // 5. Log for debugging
    console.log(
      `🔔 Emitted seating events for table ${updatedTable.tableNumber}`
    );
  }

  emitManualSeatingEvents(result, requestedBy) {
    const io = global.io;
    if (!io) return;

    const { assignment, updatedTable, matrixUpdate } = result;

    // Similar to above but for manual seating
    io.emit("table_state_changed", {
      tableId: updatedTable._id,
      tableNumber: updatedTable.tableNumber,
      previousState: "available",
      newState: "occupied",
      partySize: assignment.partySize,
      waiterId: assignment.waiter._id,
      waiterName: assignment.waiter.userName,
      isManual: true,
      changedBy: {
        id: requestedBy._id,
        name: requestedBy.userName,
        role: requestedBy.role,
      },
      timestamp: new Date(),
    });

    // Matrix update
    io.emit("matrix_updated", {
      waiterId: matrixUpdate.waiterId,
      waiterSection: matrixUpdate.waiterSection,
      partySize: matrixUpdate.partySize,
      operation: matrixUpdate.operation,
      isManual: true,
      timestamp: new Date(),
    });

    // Notify specific waiter
    io.to(`waiter_${assignment.waiter._id}`).emit("new_table_assigned", {
      tableNumber: updatedTable.tableNumber,
      partySize: assignment.partySize,
      isWalkIn: true,
      assignedBy: requestedBy.userName,
    });

    console.log(
      `🔔 Emitted manual seating events for table ${updatedTable.tableNumber}`
    );
  }

  /**
   * 🔥 UTILITY: Emit table cleared event
   */
  async emitTableCleared(tableNumber, clearedBy) {
    const io = global.io;
    if (!io) return;

    const table = await Table.findOne({ tableNumber });
    if (!table) return;

    io.emit("table_state_changed", {
      tableId: table._id,
      tableNumber: table.tableNumber,
      previousState: "occupied",
      newState: "available",
      clearedBy: {
        id: clearedBy._id,
        name: clearedBy.userName,
        role: clearedBy.role,
      },
      timestamp: new Date(),
    });

    console.log(`🔔 Emitted table cleared event for ${tableNumber}`);
  }
}

// Create singleton instance
const seatingCoordinator = new SeatingCoordinator();

// Export both the instance and class for testing
module.exports = seatingCoordinator;
module.exports.SeatingCoordinator = SeatingCoordinator;
