// backend/routes/smartSeating.js
const express = require("express");
const SmartSeatingController = require("../controllers/smartSeatingController");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();
const smartSeatingController = new SmartSeatingController();

/**
 * 🎯 GET SMART SUGGESTIONS
 * Replaces frontend suggestion generation
 */
router.get("/suggestions", authenticateToken, async (req, res) => {
  await smartSeatingController.getSuggestions(req, res);
});

/**
 * 🎯 EXECUTE SMART ASSIGNMENT
 * Handles both smart and manual assignments
 */
router.post(
  "/assign",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    await smartSeatingController.executeSmartAssignment(req, res);
  }
);

/**
 * 🎯 GET FAIRNESS MATRIX
 * Provides current fairness statistics
 */
router.get("/fairness-matrix", authenticateToken, async (req, res) => {
  await smartSeatingController.getFairnessMatrix(req, res);
});

/**
 * 🎯 MANUAL TABLE UPDATE
 * For direct floor plan interactions
 */
router.put(
  "/table/:tableNumber/manual-seat",
  authenticateToken,
  async (req, res) => {
    try {
      const { tableNumber } = req.params;
      const { partySize } = req.body;

      if (!partySize || partySize < 1 || partySize > 20) {
        return res.status(400).json({
          error: "Valid party size required",
        });
      }

      const Table = require("../models/Table");
      const User = require("../models/User");

      // Find table and assigned waiter
      const table = await Table.findOne({ tableNumber });
      if (!table || table.state !== "available") {
        return res.status(400).json({
          error: "Table not available",
        });
      }

      const waiter = await User.findOne({
        section: table.section,
        role: "waiter",
        isActive: true,
      });

      if (!waiter) {
        return res.status(400).json({
          error: "No active waiter for this section",
        });
      }

      // Update table state
      await Table.findByIdAndUpdate(table._id, {
        state: "occupied",
        assignedWaiter: waiter._id,
        partySize,
        assignedAt: new Date(),
      });

      // Create audit trail
      const AuditEvent = require("../models/AuditEvent");
      await AuditEvent.create({
        eventType: "ASSIGNMENT",
        tableId: table._id,
        userId: req.user._id,
        metadata: {
          partySize,
          waiterId: waiter._id,
          waiterName: waiter.userName,
          assignmentType: "manual_floorplan",
        },
      });

      res.json({
        success: true,
        table: {
          id: table.tableNumber,
          state: "occupied",
          waiter: {
            id: waiter._id,
            userName: waiter.userName,
            section: waiter.section,
          },
          partySize,
        },
      });
    } catch (error) {
      console.error("Error with manual seating:", error);
      res.status(500).json({
        error: "Failed to seat party manually",
        message: error.message,
      });
    }
  }
);

module.exports = router;
