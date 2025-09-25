// backend/routes/users.js
const express = require("express");
const User = require("../models/User");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/users/clocked-in-waiters
 * Get all waiters who have clocked in (for shift setup)
 */
router.get(
  "/clocked-in-waiters",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    try {
      const waiters = await User.find({
        role: "waiter",
        isActive: true,
        shiftStart: { $ne: null }, // Only waiters who have started their shift
      })
        .select("_id userName clockInNumber shiftStart section")
        .sort({ shiftStart: 1 }); // Sort by clock-in time (first to arrive is first in list)

      res.json({
        success: true,
        waiters,
        count: waiters.length,
      });
    } catch (error) {
      console.error("Error fetching clocked-in waiters:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch waiters",
      });
    }
  }
);

/**
 * GET /api/users/active-staff
 * Get all active staff members (hosts and waiters)
 */
router.get("/active-staff", authenticateToken, async (req, res) => {
  try {
    // Show ALL active staff (hosts + waiters), whether clocked in or not.
    const staff = await User.find({ isActive: true })
      .select("_id userName role clockInNumber section shiftStart")
      // Helpful sort: role first, then earliest clock-in first, then name.
      .sort({ role: 1, shiftStart: 1, userName: 1 });

    const grouped = {
      hosts: staff.filter((s) => s.role === "host"),
      waiters: staff.filter((s) => s.role === "waiter"),
    };

    res.json({
      success: true,
      staff: grouped,
      totalActive: staff.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch active staff",
    });
  }
});

/**
 * POST /api/users/clock-out
 * Clock out a user (end their shift)
 */
router.post("/clock-out", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Clear shift start and section
    user.shiftStart = null;
    user.section = null;
    await user.save();

    res.json({
      success: true,
      message: "Clocked out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to clock out",
    });
  }
});

/**
 * GET /api/users/waiters-by-section
 * Get waiters organized by their current section
 */
router.get("/waiters-by-section", authenticateToken, async (req, res) => {
  try {
    const waiters = await User.find({
      role: "waiter",
      isActive: true,
      section: { $ne: null },
    })
      .select("_id userName clockInNumber section")
      .sort({ section: 1 });

    // Group by section
    const bySection = {};
    for (let i = 1; i <= 7; i++) {
      bySection[i] = waiters.filter((w) => w.section === i);
    }

    res.json({
      success: true,
      waitersBySection: bySection,
      totalWaiters: waiters.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch waiters by section",
    });
  }
});

module.exports = router;
