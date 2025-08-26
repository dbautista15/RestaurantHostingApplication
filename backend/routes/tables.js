// backend/routes/tables.js
const express = require('express');
const Table = require('../models/Table');
const AuditEvent = require('../models/AuditEvent');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * 🎯 YOUR ENGINEERING TASK: Table Management API
 * 
 * LEARNING OBJECTIVES:
 * - RESTful resource design
 * - State transition validation
 * - Business rule enforcement
 * - Real-time event broadcasting
 */

// TODO: GET /tables - Get all tables with current state
router.get('/', authenticateToken, async (req, res) => {
  try {
    // TODO: Fetch all tables with populated waiter info
    // HINT: Use .populate() to include waiter details
    // YOUR CODE HERE:
    
    // TODO: Return tables array
    // YOUR CODE HERE:
    
  } catch (error) {
    // TODO: Error handling
    res.status(500).json({ error: error.message });
  }
});

// TODO: PUT /tables/:id/state - Update table state
router.put('/:id/state', authenticateToken, async (req, res) => {
  try {
    // TODO: Extract data from request
    // HINT: const { newState, waiterId, partySize, reason } = req.body;
    // YOUR CODE HERE:
    
    // TODO: Find table by ID
    // YOUR CODE HERE:
    
    // TODO: Validate state transition using business rules
    // HINT: Import and use business rules utility
    // YOUR CODE HERE:
    
    // TODO: Apply additional business rules (waiter table limits, etc.)
    // YOUR CODE HERE:
    
    // TODO: Execute state transition atomically
    // YOUR CODE HERE:
    
    // TODO: Create audit event
    // YOUR CODE HERE:
    
    // TODO: Broadcast real-time update via Socket.IO
    // HINT: req.app.get('io').emit('table_state_changed', data)
    // YOUR CODE HERE:
    
    // TODO: Return updated table
    // YOUR CODE HERE:
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TODO: GET /tables/section/:section - Get tables by section
router.get('/section/:section', authenticateToken, async (req, res) => {
  // TODO: Implement section-specific table listing
  // YOUR CODE HERE:
});

module.exports = router;