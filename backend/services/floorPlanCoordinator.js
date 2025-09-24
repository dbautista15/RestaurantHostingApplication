// backend/services/floorPlanCoordinator.js - ENHANCED
const Table = require('../models/Table');
const User = require('../models/User');
const mongoose = require('mongoose');
const fairnessTracker = require('./fairnessService');

class FloorPlanCoordinator {
  
  // Existing methods...
  async getTableWaiter(tableId) {
    const table = await Table.findOne({ tableNumber: tableId });
    return table?.section || null;
  }
  
  async validateStateTransition(tableId, fromState, toState) {
    const validTransitions = {
      'available': ['assigned', 'occupied'],
      'assigned': ['occupied', 'available'],
      'occupied': ['available']
    };
    
    return validTransitions[fromState]?.includes(toState) || false;
  }

  // NEW: Coordinate manual table seating
  async coordinateManualSeating(tableId, partySize, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const table = await Table.findOne({ tableNumber: tableId }).session(session);
      if (!table || table.state !== 'available') {
        throw new Error('Table is not available');
      }

      // Update table state
      const updatedTable = await Table.findOneAndUpdate(
        { tableNumber: tableId },
        {
          state: 'occupied',
          partySize: partySize,
          occupiedBy: {
            name: `Party of ${partySize}`,
            size: partySize,
            seatedAt: new Date()
          },
          assignedAt: new Date()
        },
        { new: true, session }
      );

      // Update fairness matrix
      const waiter = await User.findOne({ section: table.section }).session(session);
      if (waiter) {
        await this.updateFairnessMatrix(waiter._id, partySize, session);
      }

      await session.commitTransaction();
      
      return {
        success: true,
        table: updatedTable,
        matrixUpdate: {
          waiterId: waiter?._id,
          waiterSection: waiter?.section,
          partySize: partySize,
          operation: 'increment'
        }
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // NEW: Combine tables for large parties
  async combineTablesForParty(tableIds, partySize) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate all tables are available
      const tables = await Table.find({ 
        tableNumber: { $in: tableIds },
        state: 'available'
      }).session(session);

      if (tables.length !== tableIds.length) {
        throw new Error('One or more tables are not available');
      }

      // 2. Check if any tables are already combined
      const alreadyCombined = tables.some(table => 
        table.combinedWith && table.combinedWith.length > 0
      );
      
      if (alreadyCombined) {
        throw new Error('One or more tables are already part of a combination');
      }

      // 3. Calculate combined capacity and waiter credits
      const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
      const waiterCredits = new Map();

      // Calculate proportional credits per waiter
      for (const table of tables) {
        const waiter = await User.findOne({ section: table.section }).session(session);
        if (waiter) {
          const proportionalCredit = Math.round((table.capacity / totalCapacity) * partySize);
          waiterCredits.set(waiter._id, {
            waiter,
            credit: proportionalCredit,
            originalCapacity: table.capacity
          });
        }
      }

      // 4. Update all tables with combination info
      const primaryTable = tables[0]; // Use first table as primary
      const otherTableIds = tableIds.filter(id => id !== primaryTable.tableNumber);

      await Table.updateMany(
        { tableNumber: { $in: tableIds } },
        {
          $set: {
            state: 'occupied',
            combinedWith: tableIds.filter(id => id !== primaryTable.tableNumber),
            combinedCapacity: totalCapacity,
            combinedPartySize: partySize,
            occupiedBy: {
              name: `Combined Party of ${partySize}`,
              size: partySize,
              seatedAt: new Date()
            },
            assignedAt: new Date()
          }
        },
        { session }
      );

      // 5. Update fairness matrix for each waiter
      for (const [waiterId, creditInfo] of waiterCredits) {
        await this.updateFairnessMatrix(waiterId, creditInfo.credit, session);
      }

      await session.commitTransaction();

      return {
        success: true,
        combinedTables: tables,
        primaryTable: primaryTable.tableNumber,
        totalCapacity,
        partySize,
        waiterCredits: Array.from(waiterCredits.values()),
        matrixUpdates: Array.from(waiterCredits.entries()).map(([waiterId, info]) => ({
          waiterId,
          waiterSection: info.waiter.section,
          partySize: info.credit,
          operation: 'increment'
        }))
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // NEW: Separate combined tables
  async separateCombinedTable(primaryTableId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the primary table and its combination
      const primaryTable = await Table.findOne({ 
        tableNumber: primaryTableId 
      }).session(session);

      if (!primaryTable || !primaryTable.combinedWith || primaryTable.combinedWith.length === 0) {
        throw new Error('Table is not part of a combination');
      }

      // Get all tables in the combination
      const allCombinedTableIds = [primaryTableId, ...primaryTable.combinedWith];
      const allTables = await Table.find({
        tableNumber: { $in: allCombinedTableIds }
      }).session(session);

      // Reset all tables to available state
      await Table.updateMany(
        { tableNumber: { $in: allCombinedTableIds } },
        {
          $set: {
            state: 'available'
          },
          $unset: {
            combinedWith: 1,
            combinedCapacity: 1,
            combinedPartySize: 1,
            occupiedBy: 1,
            assignedAt: 1,
            partySize: 1
          }
        },
        { session }
      );

      await session.commitTransaction();

      return {
        success: true,
        separatedTables: allTables.map(table => table.tableNumber),
        restoredTables: allTables
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // NEW: Toggle table state (replaces frontend logic)
  async toggleTableState(tableId) {
    try {
      const table = await Table.findOne({ tableNumber: tableId });
      if (!table || !table.section) {
        throw new Error('Table not found or not assigned to a section');
      }

      const states = ['available', 'assigned', 'occupied'];
      const currentIndex = states.indexOf(table.state);
      const nextState = states[(currentIndex + 1) % states.length];

      // Validate transition
      const isValidTransition = await this.validateStateTransition(tableId, table.state, nextState);
      if (!isValidTransition) {
        throw new Error(`Invalid state transition from ${table.state} to ${nextState}`);
      }

      // For occupied state, we need party size (handled by manual seating flow)
      if (nextState === 'occupied') {
        return {
          success: false,
          requiresPartySize: true,
          message: 'Please specify party size for occupied table'
        };
      }

      // Update table state
      const updatedTable = await Table.findOneAndUpdate(
        { tableNumber: tableId },
        { 
          state: nextState,
          ...(nextState === 'available' && {
            $unset: { occupiedBy: 1, partySize: 1, assignedAt: 1 }
          })
        },
        { new: true }
      );

      return {
        success: true,
        table: updatedTable,
        previousState: table.state,
        newState: nextState
      };

    } catch (error) {
      throw error;
    }
  }

  // Helper method for fairness matrix updates
  async updateFairnessMatrix(waiterId, partySize, session = null) {
    // This integrates with your existing fairnessTracker service
    return await fairnessTracker.recordAssignment(waiterId, partySize, session);
  }

  // NEW: Update table position (for WebSocket sync)
  async updateTablePosition(tableId, x, y) {
    try {
      const updatedTable = await Table.findOneAndUpdate(
        { tableNumber: tableId },
        { 
          $set: { 
            'position.x': x, 
            'position.y': y 
          } 
        },
        { new: true }
      );

      return {
        success: true,
        table: updatedTable
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FloorPlanCoordinator();