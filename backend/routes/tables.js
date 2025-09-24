// backend/routes/tables.js (SIMPLIFIED)
const express = require('express');
const Table = require('../models/Table');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * 🎯 READ-ONLY table information
 * All mutations go through seating.js
 */

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
// Add to backend/routes/tables.js
router.post('/:tableId/click', authenticateToken, async (req, res) => {
  const { tableId } = req.params;
  const { partySize } = req.body;
  // Use floorPlanService.handleTableClick()
});

router.post('/:tableId/drop', authenticateToken, async (req, res) => {
  const { tableId } = req.params;
  const { x, y } = req.body;
  // Use floorPlanService.handleTableDrop()
});

module.exports = router;

