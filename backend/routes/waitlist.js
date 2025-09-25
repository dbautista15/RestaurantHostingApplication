// backend/routes/waitlist.js - COMPLETE with WebSocket
const express = require("express");
const WaitlistEntry = require("../models/WaitlistEntry");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { validateWaitlistEntry } = require("../middleware/validation");
const { broadcastWaitlistUpdate } = require("../socket/handlers");

const router = express.Router();

// GET /waitlist - Get current waitlist
router.get("/", authenticateToken, async (req, res) => {
  try {
    const waitlist = await WaitlistEntry.find({ partyStatus: "waiting" })
      .populate("addedBy", "userName")
      .sort({ priority: -1, createdAt: 1 });

    res.json({
      success: true,
      waitlist,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /waitlist - Add party to waitlist
router.post(
  "/",
  authenticateToken,
  requireRole(["host"]),
  validateWaitlistEntry,
  async (req, res) => {
    try {
      const {
        partyName,
        partySize,
        phoneNumber,
        estimatedWait,
        priority,
        partyStatus,
        specialRequests,
      } = req.body;

      // Create new waitlist entry
      const newWaitlistEntry = new WaitlistEntry({
        partyName,
        partySize,
        phoneNumber,
        estimatedWait: estimatedWait || 15,
        priority: priority || "normal",
        partyStatus: partyStatus || "waiting",
        specialRequests: specialRequests || "",
        addedBy: req.user._id,
      });

      await newWaitlistEntry.save();

      // Populate addedBy for response
      await newWaitlistEntry.populate("addedBy", "userName");

      // 🎯 WEBSOCKET: Broadcast new waitlist entry
      const io = req.app.get("io");
      broadcastWaitlistUpdate(io, "added", {
        _id: newWaitlistEntry._id,
        partyName: newWaitlistEntry.partyName,
        partySize: newWaitlistEntry.partySize,
        phoneNumber: newWaitlistEntry.phoneNumber,
        estimatedWait: newWaitlistEntry.estimatedWait,
        priority: newWaitlistEntry.priority,
        partyStatus: newWaitlistEntry.partyStatus,
        specialRequests: newWaitlistEntry.specialRequests,
        createdAt: newWaitlistEntry.createdAt,
        addedBy: newWaitlistEntry.addedBy,
      });

      res.status(201).json({
        success: true,
        message: "Party added to waitlist",
        waitlist: newWaitlistEntry,
      });
    } catch (error) {
      console.error("Waitlist creation error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// PATCH /waitlist/:id - Update waitlist entry
router.patch(
  "/:id",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { partyName, partySize, phoneNumber, specialRequests, priority } =
        req.body;

      // Find the waitlist entry
      const waitlistEntry = await WaitlistEntry.findById(id);
      if (!waitlistEntry) {
        return res.status(404).json({
          error: "Waitlist entry not found",
        });
      }

      // Only allow updating if still waiting
      if (waitlistEntry.partyStatus !== "waiting") {
        return res.status(400).json({
          error: "Cannot update a party that is no longer waiting",
        });
      }

      // Update only provided fields
      const updateFields = {};
      if (partyName !== undefined) updateFields.partyName = partyName;
      if (partySize !== undefined) updateFields.partySize = partySize;
      if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
      if (specialRequests !== undefined)
        updateFields.specialRequests = specialRequests;
      if (priority !== undefined) updateFields.priority = priority;

      // Update the entry
      const updatedEntry = await WaitlistEntry.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: true }
      ).populate("addedBy", "userName");

      // 🎯 WEBSOCKET: Broadcast update
      const io = req.app.get("io");
      broadcastWaitlistUpdate(io, "updated", {
        _id: updatedEntry._id,
        ...updateFields,
        updatedBy: {
          _id: req.user._id,
          userName: req.user.userName,
        },
      });

      res.status(200).json({
        success: true,
        message: "Waitlist entry updated successfully",
        waitlist: updatedEntry,
      });
    } catch (error) {
      console.error("Waitlist update error:", error);

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
      }

      res.status(500).json({
        error: "Failed to update waitlist entry",
      });
    }
  }
);

// PUT /waitlist/:id/status - Update waitlist entry status (seat or cancel)
router.put(
  "/:id/partyStatus",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { partyStatus } = req.body;

      if (
        !partyStatus ||
        !["seated", "cancelled", "no-show"].includes(partyStatus)
      ) {
        return res.status(400).json({
          error: "Invalid party status",
        });
      }

      const waitlist = await WaitlistEntry.findById(id);
      if (!waitlist) {
        return res.status(404).json({
          error: "Waitlist entry not found",
        });
      }

      // Update status and timestamp
      waitlist.partyStatus = partyStatus;
      if (partyStatus === "seated") {
        waitlist.seatedAt = new Date();
      }

      await waitlist.save();

      // 🎯 WEBSOCKET: Broadcast status change
      const io = req.app.get("io");
      broadcastWaitlistUpdate(io, partyStatus, {
        _id: waitlist._id,
        partyName: waitlist.partyName,
        partySize: waitlist.partySize,
        partyStatus: waitlist.partyStatus,
        seatedAt: waitlist.seatedAt,
        changedBy: {
          _id: req.user._id,
          userName: req.user.userName,
        },
      });

      res.status(200).json({
        success: true,
        message: `Party ${partyStatus} successfully`,
        waitlist,
      });
    } catch (error) {
      console.error("Waitlist status update error:", error);
      res.status(500).json({
        error: "Failed to update party status",
      });
    }
  }
);

// DELETE /waitlist/:id - Remove from waitlist (cancel)
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const updatedWaitlistEntry = await WaitlistEntry.findByIdAndUpdate(
        id,
        { partyStatus: "cancelled" },
        { new: true }
      );

      if (!updatedWaitlistEntry) {
        return res.status(404).json({
          error: "Waitlist entry not found",
        });
      }

      // 🎯 WEBSOCKET: Broadcast removal
      const io = req.app.get("io");
      broadcastWaitlistUpdate(io, "removed", {
        _id: updatedWaitlistEntry._id,
        partyName: updatedWaitlistEntry.partyName,
        removedBy: {
          _id: req.user._id,
          userName: req.user.userName,
        },
      });

      res.status(200).json({
        success: true,
        message: "Waitlist entry cancelled successfully",
        waitlist: updatedWaitlistEntry,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to cancel party",
      });
    }
  }
);

module.exports = router;
