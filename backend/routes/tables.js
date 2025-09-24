// backend/routes/tables.js - COMPLETE VERSION with new routes
const express = require('express');
const Table = require('../models/Table');
const AuditEvent = require('../models/AuditEvent');
const User = require('../models/User');
const floorPlanService = require('../services/floorPlanService');
const { authenticateToken } = require('../middleware/auth');
const { validateStateTransition } = require('../utils/businessRules');

const router = express.Router();

// EXISTING ROUTES (keep these)

// GET all tables with current state
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tables = await Table.find({})
      .populate('assignedWaiter', 'userName role section clockInNumber')
      .sort({ section: 1, tableNumber: 1 });

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
      timeInCurrentState: table.timeInCurrentState,
      isAvailable: table.isAvailable
    }));

    res.json({
      success: true,
      tables: tablesWithMetadata,
      count: tablesWithMetadata.length
    });

  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tables'
    });
  }
});

// GET tables by section
router.get('/section/:section', authenticateToken, async (req, res) => {
  try {
    const sectionNum = parseInt(req.params.section, 10);
    if (isNaN(sectionNum) || sectionNum < 1 || sectionNum > 7) {
      return res.status(400).json({
        success: false,
        error: 'Invalid section number'
      });
    }

    const tables = await Table.find({ section: sectionNum })
      .populate('assignedWaiter', 'userName role section clockInNumber')
      .sort({ tableNumber: 1 });

    const stats = {
      total: tables.length,
      available: tables.filter(t => t.state === 'available').length,
      assigned: tables.filter(t => t.state === 'assigned').length,
      occupied: tables.filter(t => t.state === 'occupied').length
    };

    res.json({
      success: true,
      section: sectionNum,
      tables: tables.map(table => ({
        id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        state: table.state,
        partySize: table.partySize,
        assignedWaiter: table.assignedWaiter,
        timeInCurrentState: table.timeInCurrentState
      })),
      stats
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch section tables' 
    });
  }
});

// GET table statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Table.aggregate([
      {
        $group: {
          _id: '$section',
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ['$state', 'available'] }, 1, 0] } },
          assigned: { $sum: { $cond: [{ $eq: ['$state', 'assigned'] }, 1, 0] } },
          occupied: { $sum: { $cond: [{ $eq: ['$state', 'occupied'] }, 1, 0] } },
          totalCapacity: { $sum: '$capacity' },
          currentPartySize: { $sum: { $ifNull: ['$partySize', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const overall = stats.reduce((acc, section) => ({
      total: acc.total + section.total,
      available: acc.available + section.available,
      assigned: acc.assigned + section.assigned,
      occupied: acc.occupied + section.occupied,
      totalCapacity: acc.totalCapacity + section.totalCapacity,
      currentPartySize: acc.currentPartySize + section.currentPartySize
    }), { total: 0, available: 0, assigned: 0, occupied: 0, totalCapacity: 0, currentPartySize: 0 });

    res.json({
      success: true,
      overall,
      sections: stats,
      utilizationRate: overall.totalCapacity > 0 ? 
        Math.round((overall.currentPartySize / overall.totalCapacity) * 100) : 0
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch table statistics' 
    });
  }
});

// 🎯 NEW ROUTES FOR REFACTORED FLOORPLAN

/**
 * POST /tables/:tableId/click
 * Handle table click from floor plan
 * Backend decides what action to take
 */
router.post('/:tableId/click', authenticateToken, async (req, res) => {
  try {
    const { tableId } = req.params;
    const { partySize } = req.body;
    
    // Find the table
    const table = await Table.findById(tableId)
      .populate('assignedWaiter', 'userName section');
    
    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }

    // 🎯 Backend decides based on current state and user role
    let result;
    
    if (table.state === 'available' && partySize) {
      // Seat a walk-in party
      result = await handleWalkInSeating(table, partySize, req.user);
    } 
    else if (table.state === 'occupied' && !partySize) {
      // Clear the table
      result = await handleTableClearing(table, req.user);
    }
    else if (table.state === 'assigned') {
      // Mark as occupied (party arrived)
      result = await handlePartyArrival(table, req.user);
    }
    else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action for current table state'
      });
    }

    // 🎯 Return action taken and new state
    res.json({
      success: true,
      action: result.action,
      table: {
        id: table._id,
        number: table.tableNumber,
        state: result.newState,
        waiter: result.waiter,
        partySize: result.partySize
      },
      message: result.message,
      requiresRefresh: true // Tell frontend to refresh dashboard
    });

  } catch (error) {
    console.error('Table click error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process table click'
    });
  }
});

/**
 * POST /tables/:tableId/drop
 * Handle table drag and drop (position change)
 * Only managers can move tables
 */
router.post('/:tableId/drop', authenticateToken, async (req, res) => {
  try {
    const { tableId } = req.params;
    const { x, y } = req.body;
    
    // 🎯 Check permissions
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Only managers can reposition tables'
      });
    }
    
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }
    
    // 🎯 Validate new position
    if (!isValidPosition(x, y)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table position',
        revertPosition: true // Tell frontend to revert
      });
    }
    
    // In a real system, you'd update the position in database
    // For now, just log it
    await AuditEvent.create({
      eventType: 'TABLE_MOVED',
      tableId: table._id,
      userId: req.user._id,
      metadata: {
        tableNumber: table.tableNumber,
        fromPosition: { x: table.x || 0, y: table.y || 0 },
        toPosition: { x, y }
      }
    });
    
    res.json({
      success: true,
      message: `Table ${table.tableNumber} repositioned`,
      newPosition: { x, y }
    });

  } catch (error) {
    console.error('Table drop error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reposition table'
    });
  }
});

/**
 * GET /tables/:tableId/actions
 * Get available actions for a table based on state and user role
 * This helps frontend know what to show/enable
 */
router.get('/:tableId/actions', authenticateToken, async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await Table.findById(tableId);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }
    
    // 🎯 Backend determines available actions
    const actions = getAvailableActions(table, req.user);
    
    res.json({
      success: true,
      tableState: table.state,
      actions,
      needsPartySize: table.state === 'available'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get table actions'
    });
  }
});

// 🎯 HELPER FUNCTIONS (Business Logic)

async function handleWalkInSeating(table, partySize, user) {
  // Find waiter for this section
  const waiter = await User.findOne({
    section: table.section,
    role: 'waiter',
    isActive: true
  });
  
  if (!waiter) {
    throw new Error('No active waiter for this section');
  }
  
  // Update table
  table.state = 'occupied';
  table.partySize = partySize;
  table.assignedWaiter = waiter._id;
  table.assignedAt = new Date();
  await table.save();
  
  // Create audit event
  await AuditEvent.create({
    eventType: 'ASSIGNMENT',
    tableId: table._id,
    userId: user._id,
    fromState: 'available',
    toState: 'occupied',
    metadata: {
      partySize,
      waiterId: waiter._id,
      waiterName: waiter.userName,
      assignmentType: 'walk_in'
    }
  });
  
  return {
    action: 'seated_walk_in',
    newState: 'occupied',
    waiter: waiter.userName,
    partySize,
    message: `Walk-in party of ${partySize} seated at ${table.tableNumber}`
  };
}

async function handleTableClearing(table, user) {
  const previousState = table.state;
  
  // Clear table
  table.state = 'available';
  table.partySize = null;
  table.assignedWaiter = null;
  table.assignedAt = null;
  await table.save();
  
  // Create audit event
  await AuditEvent.create({
    eventType: 'STATE_TRANSITION',
    tableId: table._id,
    userId: user._id,
    fromState: previousState,
    toState: 'available',
    metadata: {
      clearedBy: user.userName
    }
  });
  
  return {
    action: 'cleared',
    newState: 'available',
    message: `Table ${table.tableNumber} is now available`
  };
}

async function handlePartyArrival(table, user) {
  // Change from assigned to occupied
  table.state = 'occupied';
  await table.save();
  
  await AuditEvent.create({
    eventType: 'STATE_TRANSITION',
    tableId: table._id,
    userId: user._id,
    fromState: 'assigned',
    toState: 'occupied',
    metadata: {
      arrivedAt: new Date()
    }
  });
  
  return {
    action: 'party_arrived',
    newState: 'occupied',
    waiter: table.assignedWaiter?.userName,
    partySize: table.partySize,
    message: `Party has arrived at ${table.tableNumber}`
  };
}

function isValidPosition(x, y) {
  // Add validation logic based on your grid
  const GRID_COLS = 22;
  const GRID_ROWS = 18;
  
  return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
}

function getAvailableActions(table, user) {
  const actions = [];
  
  if (table.state === 'available') {
    actions.push({ 
      action: 'seat_party', 
      label: 'Seat Party',
      requiresPartySize: true 
    });
  }
  
  if (table.state === 'occupied') {
    actions.push({ 
      action: 'clear_table', 
      label: 'Clear Table' 
    });
  }
  
  if (table.state === 'assigned') {
    actions.push({ 
      action: 'mark_arrived', 
      label: 'Party Arrived' 
    });
  }
  
  if (user.role === 'manager') {
    actions.push({ 
      action: 'move_table', 
      label: 'Reposition Table' 
    });
  }
  
  return actions;
}

module.exports = router;