// backend/services/core/seatingCoordinator.js
const Table = require('../models/Table');
const WaitlistEntry = require('../models/WaitlistEntry');
const AuditEvent = require('../models/AuditEvent');
const assignmentEngine = require('./assignmentEngine');
const fairnessService = require('./fairnessService');
const mongoose = require('mongoose');

class SeatingCoordinator {
  /**
   * 🎯 MAIN SEATING ORCHESTRATOR
   * Coordinates all services in atomic transactions
   */
  async seatPartyFromWaitlist(partyId, requestedBy, options = {}) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      // 1. Get party details
      const party = await WaitlistEntry.findById(partyId).session(session);
      if (!party || party.partyStatus !== 'waiting') {
        throw new Error('Party not found or already seated');
      }

      // 2. Find optimal assignment (delegates to assignmentEngine)
      const assignment = await assignmentEngine.findBestAssignment(
        party.partySize, 
        options
      );

      if (!assignment) {
        throw new Error('No suitable tables available');
      }

      // 3. Execute atomic seating transaction
      const result = await this.executeAtomicSeating(
        party, 
        assignment, 
        requestedBy, 
        session
      );

      await session.commitTransaction();

      return {
        success: true,
        ...result
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
        state: 'available' // Optimistic locking
      },
      {
        state: 'occupied',
        assignedWaiter: assignment.waiter._id,
        partySize: assignment.partySize,
        assignedAt: new Date(),
        occupiedBy: {
          partyId: party._id,
          partyName: party.partyName,
          size: assignment.partySize
        }
      },
      { new: true, session }
    );

    if (!updatedTable) {
      throw new Error('Table no longer available - conflict detected');
    }

    // 2. Update party status
    const updatedParty = await WaitlistEntry.findByIdAndUpdate(
      party._id,
      {
        partyStatus: 'seated',
        seatedAt: new Date(),
        assignedTable: assignment.table.tableNumber,
        assignedWaiter: assignment.waiter._id
      },
      { new: true, session }
    );

    // 3. Create comprehensive audit trail
    await AuditEvent.create([{
      eventType: 'ASSIGNMENT',
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
        assignmentType: 'smart_waitlist'
      }
    }], { session });

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
        operation: 'increment'
      }
    };
  }

  /**
   * 🎯 MANUAL FLOOR PLAN SEATING
   */
  async seatManuallyOnFloorPlan(tableNumber, partySize, requestedBy) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      // 1. Validate table availability
      const table = await Table.findOne({ 
        tableNumber,
        state: 'available'
      }).session(session);

      if (!table) {
        throw new Error('Table not available');
      }

      // 2. Find waiter for this section
      const waiter = await User.findOne({
        section: table.section,
        role: 'waiter',
        isActive: true
      }).session(session);

      if (!waiter) {
        throw new Error('No active waiter for this section');
      }

      // 3. Create manual assignment object
      const manualAssignment = {
        waiter,
        table,
        partySize,
        confidence: 100,
        reason: 'Manual floor plan selection',
        algorithm: 'manual',
        timestamp: new Date()
      };

      // 4. Execute atomic manual seating
      const result = await this.executeManualSeating(
        manualAssignment,
        requestedBy,
        session
      );

      await session.commitTransaction();

      return {
        success: true,
        ...result
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
        state: 'available'
      },
      {
        state: 'occupied',
        assignedWaiter: assignment.waiter._id,
        partySize: assignment.partySize,
        assignedAt: new Date(),
        occupiedBy: {
          name: `Manual Party of ${assignment.partySize}`,
          size: assignment.partySize,
          source: 'floor_plan'
        }
      },
      { new: true, session }
    );

    if (!updatedTable) {
      throw new Error('Table no longer available');
    }

    // Create audit trail for manual assignment
    await AuditEvent.create([{
      eventType: 'ASSIGNMENT',
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
        assignmentType: 'manual_floorplan'
      }
    }], { session });

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
        operation: 'increment'
      }
    };
  }
}

module.exports = new SeatingCoordinator();