// backend/routes/waitlist.js
const express = require('express');
const WaitlistEntry = require('../models/WaitlistEntry');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * 🎯 YOUR ENGINEERING TASK: Waitlist Management API
 */

// TODO: GET /waitlist - Get current waitlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    // TODO: Get active waitlist entries ordered by priority and time
    // YOUR CODE HERE:
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TODO: POST /waitlist - Add party to waitlist
router.post('/', authenticateToken, requireRole(['host']), async (req, res) => {
  try {
    // TODO: Create new waitlist entry
    // TODO: Calculate estimated wait time
    // TODO: Broadcast update to connected clients
    // YOUR CODE HERE:
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TODO: PUT /waitlist/:id/status - Update waitlist entry status
router.put('/:id/status', authenticateToken, requireRole(['host']), async (req, res) => {
  // TODO: Update waitlist entry status (seated, cancelled, etc.)
  // YOUR CODE HERE:
});

// TODO: DELETE /waitlist/:id - Remove from waitlist
router.delete('/:id', authenticateToken, requireRole(['host']), async (req, res) => {
  // TODO: Remove waitlist entry
  // YOUR CODE HERE:
});

module.exports = router;