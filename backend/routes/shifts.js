// backend/routes/shifts.js - COMPLETE with WebSocket
const express = require("express");
const Table = require("../models/Table");
const SectionConfiguration = require("../models/SectionConfiguration");
const User = require("../models/User");
const { authenticateToken, requireRole } = require("../middleware/auth");
const mongoose = require("mongoose");
const {
  broadcastShiftConfigChange,
  sendNotification,
} = require("../socket/handlers");
const router = express.Router();

// GET /api/shifts/configurations
router.get("/configurations", authenticateToken, async (req, res) => {
  try {
    const configurations = await SectionConfiguration.find({}).sort({
      serverCount: 1,
    });

    const activeConfig = configurations.find((c) => c.isActive);

    res.status(200).json({
      success: true,
      configurations,
      activeConfiguration: activeConfig,
      count: configurations.length,
    });
  } catch (error) {
    console.error("Error fetching configurations:", error);
    res.status(500).json({ error: "Failed to fetch shift configurations" });
  }
});

// POST /api/shifts/activate
router.post(
  "/activate",
  authenticateToken,
  requireRole(["host", "manager"]),
  async (req, res) => {
    try {
      const { configurationId } = req.body;
      const io = req.app.get("io");

      if (!configurationId) {
        return res.status(400).json({
          error: "Configuration ID is required",
        });
      }

      // Find the configuration
      const config = await SectionConfiguration.findById(configurationId);
      if (!config) {
        return res.status(404).json({
          error: "Configuration not found",
        });
      }

      // Deactivate all other configurations
      await SectionConfiguration.updateMany({}, { isActive: false });

      // Activate the selected configuration
      config.isActive = true;
      await config.save();

      // Apply the configuration to tables
      await applyConfigurationToTables(config);

      // Get updated table data
      const updatedTables = await Table.find({})
        .populate("assignedWaiter", "userName role section")
        .sort({ section: 1, tableNumber: 1 });

      // 🎯 WEBSOCKET: Broadcast shift configuration change
      broadcastShiftConfigChange(
        io,
        {
          configurationName: config.shiftName,
          serverCount: config.serverCount,
          activeSections: config.activeSections.length,
        },
        {
          id: req.user._id,
          userName: req.user.userName,
          role: req.user.role,
        }
      );

      // 🎯 WEBSOCKET: Notify all active staff
      sendNotification(
        io,
        { type: "role", value: "waiter" },
        {
          type: "shift_configuration_changed",
          message: `Shift configuration changed to ${config.shiftName} by ${req.user.userName}`,
          priority: "high",
          newConfiguration: config.shiftName,
        }
      );

      res.status(200).json({
        success: true,
        message: `Activated ${config.shiftName} configuration`,
        activeConfiguration: config,
        tables: updatedTables,
        summary: {
          totalTables: updatedTables.length,
          activeTables: updatedTables.filter((t) => t.section !== null).length,
          sections: config.activeSections.length,
          servers: config.serverCount,
        },
      });
    } catch (error) {
      console.error("Error activating configuration:", error);
      res.status(500).json({ error: "Failed to activate configuration" });
    }
  }
);

// POST /api/shifts/setup-with-waiters
router.post(
  "/setup-with-waiters",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { serverCount, orderedWaiters } = req.body;
      const io = req.app.get("io");

      if (serverCount < 4 || serverCount > 7) {
        return res.status(400).json({
          error: "Server count must be between 4 and 7",
        });
      }

      // Find the best configuration
      const config = await SectionConfiguration.findOne({
        serverCount: { $lte: serverCount },
      })
        .sort({ serverCount: -1 })
        .session(session);

      if (!config) {
        throw new Error("No configuration available");
      }

      // Deactivate all configs
      await SectionConfiguration.updateMany(
        {},
        { isActive: false },
        { session }
      );

      // Activate selected
      config.isActive = true;
      await config.save({ session });

      // Apply to tables
      await applyConfigurationToTables(config);

      // Update each waiter's section
      for (const assignment of orderedWaiters) {
        await User.findByIdAndUpdate(
          assignment.waiterId,
          { section: assignment.section },
          { session }
        );
      }

      await session.commitTransaction();

      // 🎯 WEBSOCKET: Broadcast shift setup complete
      broadcastShiftConfigChange(
        io,
        {
          configurationName: config.shiftName,
          serverCount: serverCount,
          activeSections: orderedWaiters.length,
        },
        {
          id: req.user._id,
          userName: req.user.userName,
          role: req.user.role,
        }
      );

      // 🎯 WEBSOCKET: Notify each waiter of their section assignment
      for (const assignment of orderedWaiters) {
        sendNotification(
          io,
          { type: "user", value: assignment.waiterId },
          {
            type: "section_assigned",
            message: `You've been assigned to Section ${assignment.section}`,
            priority: "high",
            section: assignment.section,
          }
        );
      }

      res.json({
        success: true,
        message: `Shift started with ${serverCount} servers`,
        configuration: config.shiftName,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Shift setup error:", error);
      res.status(500).json({ error: "Failed to setup shift" });
    } finally {
      session.endSession();
    }
  }
);

// GET /api/shifts/active
router.get("/active", authenticateToken, async (req, res) => {
  try {
    const activeConfig = await SectionConfiguration.findOne({
      isActive: true,
    }).populate("userName role");

    if (!activeConfig) {
      return res.status(200).json({
        success: true,
        activeConfiguration: null,
        message: "No shift configuration is currently active",
      });
    }

    const tables = await Table.find({ section: { $ne: null } })
      .populate("assignedWaiter", "userName role section")
      .sort({ section: 1, tableNumber: 1 });

    const tablesBySection = tables.reduce((acc, table) => {
      if (!acc[table.section]) {
        acc[table.section] = [];
      }
      acc[table.section].push(table);
      return acc;
    }, {});

    const sectionSummary = activeConfig.activeSections.map((sectionConfig) => {
      const assignedTables = tablesBySection[sectionConfig.sectionNumber] || [];
      const totalCapacity = assignedTables.reduce(
        (sum, table) => sum + table.capacity,
        0
      );
      const occupiedTables = assignedTables.filter(
        (t) => t.state === "occupied"
      ).length;

      return {
        sectionNumber: sectionConfig.sectionNumber,
        tableCount: assignedTables.length,
        totalCapacity,
        occupiedTables,
        serverCount: sectionConfig.serverCount,
        tables: assignedTables,
      };
    });

    res.status(200).json({
      success: true,
      activeConfiguration: activeConfig,
      sectionSummary,
      totalStats: {
        activeTables: tables.length,
        totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
        occupiedTables: tables.filter((t) => t.state === "occupied").length,
        sections: activeConfig.activeSections.length,
        servers: activeConfig.serverCount,
      },
    });
  } catch (error) {
    console.error("Error fetching active configuration:", error);
    res.status(500).json({ error: "Failed to fetch active configuration" });
  }
});

// POST /api/shifts/quick-setup
router.post(
  "/quick-setup",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    try {
      const { serverCount } = req.body;
      const io = req.app.get("io");

      console.log("=== QUICK SETUP DEBUG ===");
      console.log("Requested server count:", serverCount);

      if (!serverCount || serverCount < 4 || serverCount > 10) {
        return res.status(400).json({
          error: "Server count must be between 4 and 10",
        });
      }

      let bestConfig = await SectionConfiguration.findOne({
        serverCount: { $lte: serverCount },
      }).sort({ serverCount: -1 });

      console.log("Found config:", bestConfig ? bestConfig.shiftName : "NONE");

      if (!bestConfig) {
        bestConfig = await SectionConfiguration.findOne({ serverCount: 4 });
        console.log(
          "Fallback to 4-server config:",
          bestConfig ? bestConfig.shiftName : "NONE"
        );
      }

      if (!bestConfig) {
        console.log("ERROR: No configurations found in database!");
        return res.status(404).json({
          error: "No shift configurations available. Please create one first.",
        });
      }

      console.log("About to apply configuration:", bestConfig.shiftName);

      await SectionConfiguration.updateMany({}, { isActive: false });
      bestConfig.isActive = true;
      await bestConfig.save();
      await applyConfigurationToTables(bestConfig);

      console.log("Configuration applied successfully");

      // 🎯 WEBSOCKET: Broadcast quick setup complete
      broadcastShiftConfigChange(
        io,
        {
          configurationName: bestConfig.shiftName,
          serverCount: serverCount,
          activeSections: bestConfig.activeSections.length,
        },
        {
          id: req.user._id,
          userName: req.user.userName,
          role: req.user.role,
        }
      );

      res.status(200).json({
        success: true,
        message: `Quick setup complete for ${serverCount} server(s)`,
        appliedConfiguration: bestConfig.shiftName,
      });
    } catch (error) {
      console.error("Error with quick setup:", error);
      res.status(500).json({ error: "Quick setup failed" });
    }
  }
);

// POST /api/shifts/add-waiter
router.post(
  "/add-waiter",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { clockInNumber, targetServerCount } = req.body;
      const io = req.app.get("io");

      if (!clockInNumber) {
        return res.status(400).json({
          success: false,
          error: "Clock-in number is required",
        });
      }

      const waiter = await User.findOne({
        clockInNumber: clockInNumber.toUpperCase().trim(),
        role: "waiter",
        isActive: true,
      }).session(session);

      if (!waiter) {
        return res.status(404).json({
          success: false,
          error: `Waiter ${clockInNumber} not found or not active`,
        });
      }

      if (!waiter.shiftStart) {
        return res.status(400).json({
          success: false,
          error: `Waiter ${clockInNumber} is not logged in`,
        });
      }

      if (waiter.section !== null) {
        return res.status(400).json({
          success: false,
          error: `${waiter.userName} is already working in section ${waiter.section}`,
        });
      }

      if (targetServerCount > 7) {
        return res.status(400).json({
          success: false,
          error: "Maximum 7 waiters supported",
        });
      }

      const assignedSections = await User.find({
        role: "waiter",
        isActive: true,
        section: { $ne: null },
        shiftStart: { $ne: null },
      })
        .distinct("section")
        .session(session);

      let nextSection = 1;
      while (assignedSections.includes(nextSection) && nextSection <= 7) {
        nextSection++;
      }

      if (nextSection > 7) {
        return res.status(400).json({
          success: false,
          error: "All sections are already assigned",
        });
      }

      waiter.section = nextSection;
      await waiter.save({ session });

      const configName = getConfigName(targetServerCount);
      const config = await SectionConfiguration.findOne({
        shiftName: configName,
      }).session(session);

      if (config) {
        await SectionConfiguration.updateMany(
          {},
          { isActive: false },
          { session }
        );
        config.isActive = true;
        await config.save({ session });
        await applyConfigurationToTables(config);
      }

      await session.commitTransaction();

      // 🎯 WEBSOCKET: Broadcast waiter added
      broadcastShiftConfigChange(
        io,
        {
          action: "waiter_added",
          waiterName: waiter.userName,
          section: waiter.section,
          newServerCount: targetServerCount,
          configurationName: configName,
        },
        {
          id: req.user._id,
          userName: req.user.userName,
          role: req.user.role,
        }
      );

      // 🎯 WEBSOCKET: Notify the waiter
      sendNotification(
        io,
        { type: "user", value: waiter._id },
        {
          type: "section_assigned",
          message: `You've been assigned to Section ${nextSection}`,
          priority: "high",
          section: nextSection,
        }
      );

      res.json({
        success: true,
        message: `${waiter.userName} added to section ${nextSection}`,
        waiter: {
          id: waiter._id,
          userName: waiter.userName,
          clockInNumber: waiter.clockInNumber,
          section: waiter.section,
        },
        newConfiguration: configName,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Add waiter error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add waiter to shift",
      });
    } finally {
      session.endSession();
    }
  }
);

// POST /api/shifts/remove-waiter
router.post(
  "/remove-waiter",
  authenticateToken,
  requireRole(["host"]),
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { waiterId, targetServerCount } = req.body;
      const io = req.app.get("io");

      if (!waiterId) {
        return res.status(400).json({
          success: false,
          error: "Waiter ID is required",
        });
      }

      if (targetServerCount < 4) {
        return res.status(400).json({
          success: false,
          error: "Minimum 4 waiters required",
        });
      }

      const waiter = await User.findById(waiterId).session(session);
      if (!waiter) {
        return res.status(404).json({
          success: false,
          error: "Waiter not found",
        });
      }

      if (waiter.section === null) {
        return res.status(400).json({
          success: false,
          error: `${waiter.userName} is not currently assigned to a section`,
        });
      }

      const removedSection = waiter.section;
      waiter.section = null;
      await waiter.save({ session });

      await Table.updateMany(
        { assignedWaiter: waiterId },
        {
          $unset: {
            assignedWaiter: 1,
            partySize: 1,
            occupiedBy: 1,
            assignedAt: 1,
          },
          state: "available",
        },
        { session }
      );

      const configName = getConfigName(targetServerCount);
      const config = await SectionConfiguration.findOne({
        shiftName: configName,
      }).session(session);

      if (config) {
        await SectionConfiguration.updateMany(
          {},
          { isActive: false },
          { session }
        );
        config.isActive = true;
        await config.save({ session });
        await applyConfigurationToTables(config);
      }

      await session.commitTransaction();

      // 🎯 WEBSOCKET: Broadcast waiter removed
      broadcastShiftConfigChange(
        io,
        {
          action: "waiter_removed",
          waiterName: waiter.userName,
          removedSection: removedSection,
          newServerCount: targetServerCount,
          configurationName: configName,
        },
        {
          id: req.user._id,
          userName: req.user.userName,
          role: req.user.role,
        }
      );

      // 🎯 WEBSOCKET: Notify the waiter
      sendNotification(
        io,
        { type: "user", value: waiter._id },
        {
          type: "section_removed",
          message: `You've been removed from Section ${removedSection}. Please see the host.`,
          priority: "high",
        }
      );

      res.json({
        success: true,
        message: `${waiter.userName} removed from section ${removedSection}`,
        waiter: {
          id: waiter._id,
          userName: waiter.userName,
          clockInNumber: waiter.clockInNumber,
          section: waiter.section,
        },
        newConfiguration: configName,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Remove waiter error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove waiter from shift",
      });
    } finally {
      session.endSession();
    }
  }
);

// Helper function
async function applyConfigurationToTables(config, options = {}) {
  try {
    console.log("=== APPLYING CONFIGURATION TO TABLES ===");
    console.log("Config name:", config.shiftName);
    console.log("Active sections:", config.activeSections.length);

    const resetResult = await Table.updateMany(
      {},
      {
        section: null,
        assignedWaiter: null,
        partySize: null,
        state: "available",
      }
    );

    console.log("Reset tables result:", resetResult);

    const allTables = await Table.find({}, "tableNumber");
    console.log(
      "Tables in database:",
      allTables.map((t) => t.tableNumber)
    );

    for (const sectionConfig of config.activeSections) {
      let tablesToAssign = sectionConfig.assignedTables;

      console.log(
        `Assigning section ${sectionConfig.sectionNumber} these tables:`,
        tablesToAssign
      );

      if (!options.includePatioArea) {
        tablesToAssign = tablesToAssign.filter(
          (table) => !table.startsWith("P")
        );
      }

      if (!options.includeBarArea) {
        tablesToAssign = tablesToAssign.filter(
          (table) => !table.startsWith("B")
        );
      }

      if (tablesToAssign.length > 0) {
        const updateResult = await Table.updateMany(
          { tableNumber: { $in: tablesToAssign } },
          { section: sectionConfig.sectionNumber }
        );

        console.log(
          `Section ${sectionConfig.sectionNumber} update result:`,
          updateResult
        );
      }
    }

    console.log("Table configuration complete");
    return true;
  } catch (error) {
    console.error("Error applying configuration to tables:", error);
    throw error;
  }
}

function getConfigName(serverCount) {
  const names = {
    4: "four-servers",
    5: "five-servers",
    6: "six-servers",
    7: "seven-servers",
  };
  return names[serverCount] || "six-servers";
}

module.exports = router;
