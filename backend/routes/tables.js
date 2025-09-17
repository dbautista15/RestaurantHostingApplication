// backend/routes/tables.js
const express = require('express');
const Table = require('../models/Table');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateTableStateUpdate } = require('../middleware/validation');
const { validateCompleteTransition, calculateEstimatedWait } = require('../utils/businessRules');
const { logStateTransition, logWaiterAssignment } = require('../utils/auditLogger');

const router = express.Router();

/**
 * 🎯 ENGINEERING CONCEPTS YOU'RE LEARNING:
 * - RESTful resource design
 * - Atomic operations with transactions
 * - Event-driven architecture
 * - Error handling patterns
 * - Real-time data synchronization
 */

/**
 * GET /api/tables - Get all tables with current state
 * 
 * ENGINEERING PATTERN: Resource listing with populated relationships
 * AUTHENTICATION: All authenticated users can view tables
 * BUSINESS LOGIC: Shows real-time restaurant state
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // CONCEPT: Database optimization through selective population
    // WHY: We only need waiter name/section, not password/sensitive data
    const tables = await Table.find({})
      .populate('assignedWaiter', 'userName role section clockInNumber')
      .sort({ section: 1, tableNumber: 1 }); // Logical ordering for UI

    // CONCEPT: Data transformation for client consumption
    // WHY: Frontend needs computed properties and clean structure
    const tablesWithMetadata = tables.map(table => ({
      id: table._id,
      tableNumber: table.tableNumber,
      section: table.section,
      capacity: table.capacity,
      state: table.state,
      partySize: table.partySize,
      assignedWaiter: table.assignedWaiter ? {
        id: table.assignedWaiter._id,
        name: table.assignedWaiter.userName,
        clockInNumber: table.assignedWaiter.clockInNumber,
        section: table.assignedWaiter.section
      } : null,
      assignedAt: table.assignedAt,
      lastStateChange: table.lastStateChange,
      // Computed properties
      timeInCurrentState: table.timeInCurrentState,
      isAvailable: table.isAvailable
    }));

    res.status(200).json({
      success: true,
      tables: tablesWithMetadata,
      count: tablesWithMetadata.length
    });

  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tables',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/tables/:id/state - Update table state
 * 
 * ENGINEERING PATTERN: State machine implementation via HTTP
 * AUTHENTICATION: All authenticated users (business rule: waiters can clear their own tables)
 * VALIDATION: Uses business rules engine for state transition validation
 */
router.put('/:id/state', authenticateToken, validateTableStateUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { newState, waiterId, partySize, reason } = req.body;
    const currentUser = req.user;

    // STEP 1: Find and validate table exists
    const table = await Table.findById(id).populate('assignedWaiter');
    if (!table) {
      return res.status(404).json({
        error: 'Table not found',
        message: `No table found with ID: ${id}`
      });
    }

    // STEP 2: Role-based authorization for specific actions
    // BUSINESS RULE: Only hosts can assign tables, waiters can clear their own
    if (newState === 'assigned' && currentUser.role !== 'host') {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only hosts can assign tables to waiters'
      });
    }

    if (newState === 'available' && table.assignedWaiter && 
        currentUser.role === 'waiter' && 
        table.assignedWaiter._id.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Waiters can only clear their own assigned tables'
      });
    }

    // STEP 3: Business rules validation
    const validationResult = await validateCompleteTransition(table, newState, {
      waiterId,
      partySize
    });

    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Invalid state transition',
        message: validationResult.error,
        currentState: table.state,
        requestedState: newState
      });
    }

    // STEP 4: Prepare state transition data
    const oldState = table.state;
    const transitionData = {
      state: newState,
      lastStateChange: new Date()
    };

    // State-specific updates
    switch (newState) {
      case 'assigned':
        transitionData.assignedWaiter = waiterId;
        transitionData.partySize = partySize;
        transitionData.assignedAt = new Date();
        break;
        
      case 'occupied':
        // Keep existing assignment data
        break;
        
      case 'available':
        transitionData.assignedWaiter = null;
        transitionData.partySize = null;
        transitionData.assignedAt = null;
        break;
    }

    // STEP 5: Atomic update with optimistic locking
    // ENGINEERING CONCEPT: Prevent race conditions
    const updatedTable = await Table.findOneAndUpdate(
      { 
        _id: id,
        state: oldState  // Optimistic locking: only update if state hasn't changed
      },
      transitionData,
      { 
        new: true,  // Return updated document
        runValidators: true  // Run mongoose validators
      }
    ).populate('assignedWaiter', 'userName role section clockInNumber');

    if (!updatedTable) {
      return res.status(409).json({
        error: 'State conflict',
        message: 'Table state was modified by another user. Please refresh and try again.',
        currentState: table.state
      });
    }

    // STEP 6: Create audit trail
    try {
      if (newState === 'assigned') {
        await logWaiterAssignment(
          updatedTable._id,
          currentUser._id,
          waiterId,
          partySize,
          { reason, ipAddress: req.ip }
        );
      } else {
        await logStateTransition(
          updatedTable,
          currentUser._id,
          oldState,
          newState,
          { reason, ipAddress: req.ip }
        );
      }
    } catch (auditError) {
      // ENGINEERING DECISION: Don't fail the operation if audit fails
      console.error('Audit logging failed:', auditError);
    }

    // STEP 7: Broadcast real-time update
    const io = req.app.get('io');
    if (io) {
      const updatePayload = {
        tableId: updatedTable._id,
        tableNumber: updatedTable.tableNumber,
        section: updatedTable.section,
        oldState,
        newState: updatedTable.state,
        assignedWaiter: updatedTable.assignedWaiter,
        partySize: updatedTable.partySize,
        timestamp: new Date(),
        updatedBy: {
          id: currentUser._id,
          name: currentUser.userName,
          role: currentUser.role
        }
      };

      // Broadcast to all clients
      io.emit('table_state_changed', updatePayload);
      
      // Also broadcast to section-specific rooms if they exist
      io.to(`section_${updatedTable.section}`).emit('section_table_update', updatePayload);
    }

    // STEP 8: Return success response
    res.status(200).json({
      success: true,
      message: `Table ${updatedTable.tableNumber} ${oldState} → ${newState}`,
      table: {
        id: updatedTable._id,
        tableNumber: updatedTable.tableNumber,
        section: updatedTable.section,
        capacity: updatedTable.capacity,
        state: updatedTable.state,
        partySize: updatedTable.partySize,
        assignedWaiter: updatedTable.assignedWaiter ? {
          id: updatedTable.assignedWaiter._id,
          name: updatedTable.assignedWaiter.userName,
          clockInNumber: updatedTable.assignedWaiter.clockInNumber
        } : null,
        lastStateChange: updatedTable.lastStateChange,
        assignedAt: updatedTable.assignedAt
      },
      transition: {
        from: oldState,
        to: newState,
        timestamp: transitionData.lastStateChange
      }
    });

  } catch (error) {
    console.error('Table state update error:', error);
    
    // ENGINEERING PATTERN: Specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid table ID format'
      });
    }

    res.status(500).json({ 
      error: 'Table state update failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/tables/section/:section - Get tables by section
 * 
 * ENGINEERING PATTERN: Resource filtering
 * USE CASE: Waiter wants to see only their section's tables
 */
router.get('/section/:section', authenticateToken, async (req, res) => {
  try {
    const { section } = req.params;
    
    // Validate section number
    const sectionNum = parseInt(section, 10);
    if (isNaN(sectionNum) || sectionNum < 1 || sectionNum > 7) {
      return res.status(400).json({
        error: 'Invalid section',
        message: 'Section must be a number between 1 and 7'
      });
    }

    const tables = await Table.find({ section: sectionNum })
      .populate('assignedWaiter', 'userName role section clockInNumber')
      .sort({ tableNumber: 1 });

    // Calculate section statistics
    const stats = {
      total: tables.length,
      available: tables.filter(t => t.state === 'available').length,
      assigned: tables.filter(t => t.state === 'assigned').length,
      occupied: tables.filter(t => t.state === 'occupied').length
    };

    res.status(200).json({
      success: true,
      section: sectionNum,
      tables: tables.map(table => ({
        id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        state: table.state,
        partySize: table.partySize,
        assignedWaiter: table.assignedWaiter ? {
          id: table.assignedWaiter._id,
          name: table.assignedWaiter.userName,
          clockInNumber: table.assignedWaiter.clockInNumber
        } : null,
        timeInCurrentState: table.timeInCurrentState
      })),
      stats
    });

  } catch (error) {
    console.error('Error fetching section tables:', error);
    res.status(500).json({ error: 'Failed to fetch section tables' });
  }
});

/**
 * GET /api/tables/stats - Get overall table statistics
 * 
 * ENGINEERING PATTERN: Aggregation endpoint
 * USE CASE: Dashboard showing restaurant overview
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // CONCEPT: MongoDB aggregation for performance
    const stats = await Table.aggregate([
      {
        $group: {
          _id: '$section',
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$state', 'available'] }, 1, 0] }
          },
          assigned: {
            $sum: { $cond: [{ $eq: ['$state', 'assigned'] }, 1, 0] }
          },
          occupied: {
            $sum: { $cond: [{ $eq: ['$state', 'occupied'] }, 1, 0] }
          },
          totalCapacity: { $sum: '$capacity' },
          currentPartySize: {
            $sum: { $ifNull: ['$partySize', 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate overall totals
    const overall = stats.reduce((acc, section) => ({
      total: acc.total + section.total,
      available: acc.available + section.available,
      assigned: acc.assigned + section.assigned,
      occupied: acc.occupied + section.occupied,
      totalCapacity: acc.totalCapacity + section.totalCapacity,
      currentPartySize: acc.currentPartySize + section.currentPartySize
    }), { total: 0, available: 0, assigned: 0, occupied: 0, totalCapacity: 0, currentPartySize: 0 });

    res.status(200).json({
      success: true,
      overall,
      sections: stats.map(section => ({
        section: section._id,
        ...section
      })),
      utilizationRate: overall.totalCapacity > 0 ? 
        Math.round((overall.currentPartySize / overall.totalCapacity) * 100) : 0
    });

  } catch (error) {
    console.error('Error fetching table stats:', error);
    res.status(500).json({ error: 'Failed to fetch table statistics' });
  }
});

module.exports = router;

/**
 * 🧪 TESTING YOUR TABLE ROUTES:
 * 
 * 1. Get all tables:
 *    GET /api/tables
 *    Headers: Authorization: Bearer <token>
 * 
 * 2. Assign table:
 *    PUT /api/tables/:id/state
 *    Body: { "newState": "assigned", "waiterId": "...", "partySize": 4 }
 * 
 * 3. Seat party:
 *    PUT /api/tables/:id/state  
 *    Body: { "newState": "occupied" }
 * 
 * 4. Clear table:
 *    PUT /api/tables/:id/state
 *    Body: { "newState": "available" }
 * 
 * 💭 ENGINEERING PATTERNS YOU'RE LEARNING:
 * - Atomic operations with optimistic locking
 * - State machine implementation via REST
 * - Role-based authorization at the operation level
 * - Real-time event broadcasting
 * - Comprehensive error handling
 * - Audit trail creation
 * - Resource aggregation and statistics
 */