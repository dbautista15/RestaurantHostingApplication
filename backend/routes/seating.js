// backend/routes/seating.js - COMPLETE with WebSocket
const express = require("express");
const seatingCoordinator = require("../services/seatingCoordinator");
const suggestionService = require("../services/suggestionService");
const fairnessService = require("../services/fairnessService");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  broadcastTableStateChange,
  broadcastWaitlistUpdate,
  broadcastFairnessUpdate,
  sendNotification,
} = require("../socket/handlers");

const router = express.Router();

// GET suggestions
router.get("/suggestions", authenticateToken, async (req, res) => {
  try {
    const suggestions = await suggestionService.generateSuggestions();

    res.json({
      success: true,
      suggestions,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST seat party from waitlist
router.post(
  "/seat-party",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    try {
      const { partyId, options = {} } = req.body;
      const io = req.app.get("io");

      const result = await seatingCoordinator.seatPartyFromWaitlist(
        partyId,
        req.user,
        options
      );

      if (result.success) {
        // 🎯 WEBSOCKET: Broadcast table state change
        broadcastTableStateChange(io, {
          tableId: result.updatedTable._id,
          tableNumber: result.updatedTable.tableNumber,
          newState: result.updatedTable.state,
          partySize: result.updatedTable.partySize,
          assignedWaiter: {
            _id: result.assignment.waiter._id,
            userName: result.assignment.waiter.userName,
            section: result.assignment.waiter.section,
          },
          partyInfo: {
            name: result.updatedParty.partyName,
            size: result.updatedParty.partySize,
          },
          assignedBy: {
            _id: req.user._id,
            userName: req.user.userName,
          },
        });

        // 🎯 WEBSOCKET: Broadcast waitlist update (party seated)
        broadcastWaitlistUpdate(io, "seated", {
          _id: result.updatedParty._id,
          partyName: result.updatedParty.partyName,
          tableNumber: result.updatedTable.tableNumber,
          seatedBy: {
            _id: req.user._id,
            userName: req.user.userName,
          },
        });

        // 🎯 WEBSOCKET: Broadcast fairness matrix update
        const fairnessMatrix = await fairnessService.getCurrentMatrix();
        broadcastFairnessUpdate(io, fairnessMatrix);

        // 🎯 WEBSOCKET: Notify the assigned waiter
        sendNotification(
          io,
          { type: "user", value: result.assignment.waiter._id },
          {
            type: "new_table_assigned",
            message: `${result.updatedParty.partyName} (party of ${result.updatedParty.partySize}) assigned to your table ${result.updatedTable.tableNumber}`,
            priority: "high",
            tableNumber: result.updatedTable.tableNumber,
            partyName: result.updatedParty.partyName,
            partySize: result.updatedParty.partySize,
            specialRequests: result.updatedParty.specialRequests,
          }
        );

        // If party has special requests, notify waiter specifically
        if (result.updatedParty.specialRequests) {
          sendNotification(
            io,
            { type: "user", value: result.assignment.waiter._id },
            {
              type: "special_request",
              message: `Special request for ${result.updatedTable.tableNumber}: ${result.updatedParty.specialRequests}`,
              priority: "medium",
              tableNumber: result.updatedTable.tableNumber,
            }
          );
        }
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// PUT manual floor plan seating
router.put("/manual/:tableNumber", authenticateToken, async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const { partySize } = req.body;
    const io = req.app.get("io");

    const result = await seatingCoordinator.seatManuallyOnFloorPlan(
      tableNumber,
      partySize,
      req.user
    );

    if (result.success) {
      // 🎯 WEBSOCKET: Broadcast table state change
      broadcastTableStateChange(io, {
        tableId: result.updatedTable._id,
        tableNumber: result.updatedTable.tableNumber,
        newState: result.updatedTable.state,
        partySize: result.updatedTable.partySize,
        assignedWaiter: {
          _id: result.assignment.waiter._id,
          userName: result.assignment.waiter.userName,
          section: result.assignment.waiter.section,
        },
        assignmentType: "manual_floorplan",
        assignedBy: {
          _id: req.user._id,
          userName: req.user.userName,
        },
      });

      // 🎯 WEBSOCKET: Broadcast fairness matrix update
      const fairnessMatrix = await fairnessService.getCurrentMatrix();
      broadcastFairnessUpdate(io, fairnessMatrix);

      // 🎯 WEBSOCKET: Notify the assigned waiter
      sendNotification(
        io,
        { type: "user", value: result.assignment.waiter._id },
        {
          type: "manual_assignment",
          message: `Walk-in party of ${partySize} seated at your table ${tableNumber}`,
          priority: "high",
          tableNumber: tableNumber,
          partySize: partySize,
        }
      );
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET fairness matrix
router.get("/fairness-matrix", authenticateToken, async (req, res) => {
  try {
    const matrix = await fairnessService.getCurrentMatrix();

    res.json({
      success: true,
      ...matrix,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
