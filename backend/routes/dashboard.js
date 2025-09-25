// backend/routes/dashboard.js - COMPLETE SSOT VERSION
const express = require("express");
const WaitlistEntry = require("../models/WaitlistEntry");
const Table = require("../models/Table");
const User = require("../models/User");
const SectionConfiguration = require("../models/SectionConfiguration");
const suggestionService = require("../services/suggestionService");
const fairnessService = require("../services/fairnessService");
const floorPlanService = require("../services/floorPlanService");
const { authenticateToken } = require("../middleware/auth");
const { RESTAURANT_TABLES } = require("../config/restaurantLayout");

const router = express.Router();

/**
 * 🎯 SINGLE DASHBOARD ENDPOINT - TRUE SSOT
 * One call gets EVERYTHING the frontend needs
 * Frontend just displays this data - no calculations needed
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    // 🎯 PARALLEL DATA FETCHING - All at once for performance
    const [
      waitlist,
      tables,
      fairnessData,
      suggestions,
      activeConfig,
      activeWaiters,
      floorPlanData,
    ] = await Promise.all([
      // 1. Waitlist with full details
      WaitlistEntry.find({ partyStatus: "waiting" })
        .sort({ priority: -1, createdAt: 1 })
        .populate("addedBy", "userName"),

      // 2. Raw table data (will be enriched below)
      Table.find({})
        .populate("assignedWaiter", "userName section clockInNumber")
        .sort({ section: 1, tableNumber: 1 }),

      // 3. Fairness calculations
      fairnessService.getCurrentMatrix(),

      // 4. Smart suggestions
      suggestionService.generateSuggestions(3),

      // 5. Active shift configuration
      SectionConfiguration.findOne({ isActive: true }),

      // 6. Active waiters on shift
      User.find({
        role: "waiter",
        isActive: true,
        shiftStart: { $ne: null },
      }).sort({ section: 1 }),

      // 7. Complete floor plan data (NEW)
      floorPlanService.getFloorPlanData(req.user),
    ]);

    // 🎯 ENRICH TABLES with layout and display data
    const enrichedTables = tables.map((table) => {
      // Find the floor plan version of this table
      const floorPlanTable = floorPlanData.tables.find(
        (fpt) => fpt.number === table.tableNumber
      );

      // Find layout info from config
      const layoutInfo = RESTAURANT_TABLES.find(
        (t) => t.number === table.tableNumber
      );

      return {
        // Core data
        id: table._id,
        number: table.tableNumber,
        tableNumber: table.tableNumber, // Keep for compatibility

        // 🎯 Position from SSOT
        position: {
          x: layoutInfo?.x || 0,
          y: layoutInfo?.y || 0,
        },

        // State and capacity
        state: table.state,
        capacity: table.capacity,
        partySize: table.partySize,

        // Section info
        section: table.section,
        isActive: table.section !== null,

        // 🎯 Display helpers from floor plan service
        isDraggable: floorPlanTable?.isDraggable || false,
        isClickable: floorPlanTable?.isClickable || false,
        styleHint: floorPlanTable?.styleHint || "",
        displayText: floorPlanTable?.displayText || "",

        // Waiter assignment with display info
        assignedWaiter: table.assignedWaiter,
        waiterInfo: floorPlanTable?.waiterInfo || null,

        // Timing info
        assignedAt: table.assignedAt,
        lastStateChange: table.lastStateChange,

        // 🎯 Pre-calculated display values
        displayCapacity: `${table.capacity}`,
        timeInCurrentState: table.assignedAt
          ? Math.floor((Date.now() - new Date(table.assignedAt)) / (1000 * 60))
          : 0,

        // Section coloring
        sectionInfo: table.section
          ? {
              id: table.section,
              color: getWaiterColor(table.section),
            }
          : null,
      };
    });

    // 🎯 PREPARE SHIFT DATA for frontend
    const shiftData = {
      isConfigured: activeConfig !== null,
      configuration: activeConfig
        ? {
            name: activeConfig.shiftName,
            serverCount: activeConfig.serverCount,
            sections: activeConfig.activeSections.length,
          }
        : null,
      activeWaiters: activeWaiters.map((waiter) => ({
        id: waiter._id,
        userName: waiter.userName,
        section: waiter.section,
        clockInNumber: waiter.clockInNumber,
        tablesAssigned: enrichedTables.filter(
          (t) => t.assignedWaiter?._id.toString() === waiter._id.toString()
        ).length,
        color: getWaiterColor(waiter.section),
      })),
    };

    // 🎯 CALCULATE STATISTICS (backend does all math)
    const statistics = {
      tables: {
        total: enrichedTables.length,
        active: enrichedTables.filter((t) => t.isActive).length,
        available: enrichedTables.filter(
          (t) => t.isActive && t.state === "available"
        ).length,
        assigned: enrichedTables.filter(
          (t) => t.isActive && t.state === "assigned"
        ).length,
        occupied: enrichedTables.filter(
          (t) => t.isActive && t.state === "occupied"
        ).length,
      },
      waitlist: {
        total: waitlist.length,
        avgWaitTime:
          waitlist.length > 0
            ? Math.round(
                waitlist.reduce((sum, party) => {
                  return (
                    sum +
                    Math.floor(
                      (Date.now() - new Date(party.createdAt)) / (1000 * 60)
                    )
                  );
                }, 0) / waitlist.length
              )
            : 0,
        byPriority: {
          normal: waitlist.filter((p) => p.priority === "normal").length,
          large_party: waitlist.filter((p) => p.priority === "large_party")
            .length,
          coworker: waitlist.filter((p) => p.priority === "coworker").length,
        },
      },
      capacity: {
        totalSeats: enrichedTables.reduce(
          (sum, t) => sum + (t.isActive ? t.capacity : 0),
          0
        ),
        occupiedSeats: enrichedTables.reduce(
          (sum, t) =>
            sum + (t.isActive && t.state === "occupied" ? t.partySize || 0 : 0),
          0
        ),
        utilizationPercent: 0, // Calculated below
      },
    };

    // Calculate utilization
    if (statistics.capacity.totalSeats > 0) {
      statistics.capacity.utilizationPercent = Math.round(
        (statistics.capacity.occupiedSeats / statistics.capacity.totalSeats) *
          100
      );
    }

    // 🎯 SEND COMPLETE DASHBOARD DATA
    res.json({
      success: true,
      data: {
        // Waitlist data
        waitlist: waitlist.map((entry) => ({
          _id: entry._id,
          partyName: entry.partyName,
          partySize: entry.partySize,
          phoneNumber: entry.phoneNumber,
          priority: entry.priority,
          specialRequests: entry.specialRequests,
          partyStatus: entry.partyStatus,
          estimatedWait: entry.estimatedWait,
          actualWaitTime: Math.floor(
            (Date.now() - new Date(entry.createdAt)) / (1000 * 60)
          ),
          createdAt: entry.createdAt,
          addedBy: entry.addedBy,
        })),

        // Enriched table data with positions
        tables: enrichedTables,

        // Grid configuration
        gridConfig: floorPlanData.gridConfig,

        // Fairness data
        matrix: fairnessData.matrix,
        waiters: fairnessData.waiters,
        fairnessScore: fairnessData.fairnessScore,

        // Suggestions
        suggestions,

        // Shift information
        shift: shiftData,

        // Pre-calculated statistics
        statistics,

        // User permissions (frontend can enable/disable features)
        permissions: {
          canDragTables: req.user.role === "host",
          canSeatParties: ["host"].includes(req.user.role),
          canEditWaitlist: ["host"].includes(req.user.role),
          canViewMatrix: true,
        },
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load dashboard data",
      message: error.message,
    });
  }
});

// 🎯 HELPER FUNCTION - Waiter colors (should match frontend theme)
function getWaiterColor(section) {
  const colors = [
    { bg: "#fee2e2", border: "#ef4444" }, // red
    { bg: "#dcfce7", border: "#22c55e" }, // green
    { bg: "#fef3c7", border: "#f59e0b" }, // yellow
    { bg: "#dbeafe", border: "#3b82f6" }, // blue
    { bg: "#f3e8ff", border: "#a855f7" }, // purple
    { bg: "#fce7f3", border: "#ec4899" }, // pink
    { bg: "#ccfbf1", border: "#14b8a6" }, // teal
  ];

  return colors[(section - 1) % colors.length] || colors[0];
}

module.exports = router;

/**
 * 🎯 WHAT THIS PROVIDES:
 *
 * 1. COMPLETE TABLE DATA
 *    - Position from layout config
 *    - State and assignments
 *    - Display hints and permissions
 *    - Pre-calculated styling
 *
 * 2. ENRICHED WAITLIST
 *    - Actual wait times calculated
 *    - Priority already sorted
 *    - All fields needed for display
 *
 * 3. SHIFT INFORMATION
 *    - Active configuration
 *    - Waiter list with colors
 *    - Table counts per waiter
 *
 * 4. PRE-CALCULATED STATS
 *    - No frontend math needed
 *    - Utilization percentages
 *    - Counts by category
 *
 * 5. USER PERMISSIONS
 *    - What actions are allowed
 *    - Frontend just enables/disables
 *    - Security still enforced backend
 *
 * Frontend receives this and just displays it!
 * No calculations, no business logic, just presentation.
 */
