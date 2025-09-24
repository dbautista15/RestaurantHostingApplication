// backend/routes/seating.js (CLEAN VERSION)
const express = require('express');
const seatingCoordinator = require('../services/seatingCoordinator');
const suggestionService = require('../services/suggestionService');
const fairnessService = require('../services/fairnessService');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * 🎯 SINGLE SOURCE OF TRUTH for all seating operations
 */

// GET suggestions (replaces frontend calculation)
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const suggestions = await suggestionService.generateSuggestions();
    
    res.json({
      success: true,
      suggestions,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST seat party from waitlist (ONLY seating endpoint needed)
router.post('/seat-party', authenticateToken, requireRole(['host']), async (req, res) => {
  try {
    const { partyId, options = {} } = req.body;
    
    const result = await seatingCoordinator.seatPartyFromWaitlist(
      partyId,
      req.user,
      options
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT manual floor plan seating
router.put('/manual/:tableNumber', authenticateToken, async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const { partySize } = req.body;

    const result = await seatingCoordinator.seatManuallyOnFloorPlan(
      tableNumber,
      partySize,
      req.user
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET fairness matrix
router.get('/fairness-matrix', authenticateToken, async (req, res) => {
  try {
    const matrix = await fairnessService.getCurrentMatrix();
    
    res.json({
      success: true,
      ...matrix
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;