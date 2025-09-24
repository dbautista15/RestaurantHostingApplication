// backend/routes/dashboard.js (NEW - replaces restaurant.js)
const express = require('express');
const WaitlistEntry = require('../models/WaitlistEntry');
const Table = require('../models/Table');
const suggestionService = require('../services/suggestionService');
const fairnessService = require('../services/fairnessService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * 🎯 SINGLE DASHBOARD ENDPOINT
 * Replaces multiple frontend API calls with one optimized call
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [waitlist, tables, fairnessData, suggestions] = await Promise.all([
      WaitlistEntry.find({ partyStatus: 'waiting' })
        .sort({ priority: -1, createdAt: 1 }),
      
      Table.find({})
        .populate('assignedWaiter', 'userName section')
        .sort({ section: 1, tableNumber: 1 }),
      
      fairnessService.getCurrentMatrix(),
      
      suggestionService.generateSuggestions(3)
    ]);

    res.json({
      success: true,
      data: {
        waitlist,
        tables: tables.map(table => ({
          id: table._id,
          tableNumber: table.tableNumber,
          section: table.section,
          capacity: table.capacity,
          state: table.state,
          partySize: table.partySize,
          assignedWaiter: table.assignedWaiter,
          assignedAt: table.assignedAt
        })),
        matrix: fairnessData.matrix,
        waiters: fairnessData.waiters,
        fairnessScore: fairnessData.fairnessScore,
        suggestions
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load dashboard data' 
    });
  }
});

module.exports = router;