// backend/routes/shifts.js
const express = require('express');
const Table = require('../models/Table');
const SectionConfiguration = require('../models/SectionConfiguration');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * 🎯 SECTION CONFIGURATION MANAGEMENT
 * 
 * These endpoints manage dynamic table-to-section assignments
 * based on how many servers are working
 */

/**
 * GET /api/shifts/configurations
 * Get all available shift configurations
 */
router.get('/configurations', authenticateToken, async (req, res) => {
  try {
const configurations = await SectionConfiguration.find({})
  .sort({ serverCount: 1 });

    const activeConfig = configurations.find(c => c.isActive);

    res.status(200).json({
      success: true,
      configurations,
      activeConfiguration: activeConfig,
      count: configurations.length
    });

  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch shift configurations' });
  }
});

/**
 * POST /api/shifts/activate
 * Activate a specific shift configuration
 * This reassigns all tables to sections based on the configuration
 */
router.post('/activate', authenticateToken, requireRole(['host', 'manager']), async (req, res) => {
  try {
    const { configurationId } = req.body;
    
    if (!configurationId) {
      return res.status(400).json({
        error: 'Configuration ID is required'
      });
    }

    // Find the configuration
    const config = await SectionConfiguration.findById(configurationId);
    if (!config) {
      return res.status(404).json({
        error: 'Configuration not found'
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
      .populate('assignedWaiter', 'userName role section')
      .sort({ section: 1, tableNumber: 1 });

    // Broadcast the change via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.emit('shift_configuration_changed', {
        configurationName: config.shiftName,
        serverCount: config.serverCount,
        activeSections: config.activeSections.length,
        timestamp: new Date(),
        changedBy: {
          id: req.user._id,
          name: req.user.userName,
          role: req.user.role
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Activated ${config.shiftName} configuration`,
      activeConfiguration: config,
      tables: updatedTables,
      summary: {
        totalTables: updatedTables.length,
        activeTables: updatedTables.filter(t => t.section !== null).length,
        sections: config.activeSections.length,
        servers: config.serverCount
      }
    });

  } catch (error) {
    console.error('Error activating configuration:', error);
    res.status(500).json({ error: 'Failed to activate configuration' });
  }
});

/**
 * GET /api/shifts/active
 * Get the currently active shift configuration and affected tables
 */
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const activeConfig = await SectionConfiguration.findOne({ isActive: true })
      .populate( 'userName role');

    if (!activeConfig) {
      return res.status(200).json({
        success: true,
        activeConfiguration: null,
        message: 'No shift configuration is currently active'
      });
    }

    // Get tables organized by the active configuration
    const tables = await Table.find({ section: { $ne: null } })
      .populate('assignedWaiter', 'userName role section')
      .sort({ section: 1, tableNumber: 1 });

    // Organize tables by section
    const tablesBySection = tables.reduce((acc, table) => {
      if (!acc[table.section]) {
        acc[table.section] = [];
      }
      acc[table.section].push(table);
      return acc;
    }, {});

    // Get server assignments for each active section
    const sectionSummary = activeConfig.activeSections.map(sectionConfig => {
      const assignedTables = tablesBySection[sectionConfig.sectionNumber] || [];
      const totalCapacity = assignedTables.reduce((sum, table) => sum + table.capacity, 0);
      const occupiedTables = assignedTables.filter(t => t.state === 'occupied').length;
      
      return {
        sectionNumber: sectionConfig.sectionNumber,
        tableCount: assignedTables.length,
        totalCapacity,
        occupiedTables,
        serverCount: sectionConfig.serverCount,
        tables: assignedTables
      };
    });

    res.status(200).json({
      success: true,
      activeConfiguration: activeConfig,
      sectionSummary,
      totalStats: {
        activeTables: tables.length,
        totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
        occupiedTables: tables.filter(t => t.state === 'occupied').length,
        sections: activeConfig.activeSections.length,
        servers: activeConfig.serverCount
      }
    });

  } catch (error) {
    console.error('Error fetching active configuration:', error);
    res.status(500).json({ error: 'Failed to fetch active configuration' });
  }
});

/**
 * POST /api/shifts/quick-setup
 * Quick setup based on server count
 * Automatically selects the best configuration for the number of servers working
 */
router.post('/quick-setup', authenticateToken, requireRole(['host', 'manager']), async (req, res) => {
  try {
    const { serverCount, includePatioArea = false, includeBarArea = true } = req.body;
    
    if (!serverCount || serverCount < 1 || serverCount > 10) {
      return res.status(400).json({
        error: 'Server count must be between 1 and 10'
      });
    }

    // Find the best configuration for this server count
    let bestConfig = await SectionConfiguration.findOne({ 
      serverCount: { $lte: serverCount }
    }).sort({ serverCount: -1 });

    if (!bestConfig) {
      // If no configuration exists for this server count, use the smallest one
      bestConfig = await SectionConfiguration.findOne({}).sort({ serverCount: 1 });
    }

    if (!bestConfig) {
      return res.status(404).json({
        error: 'No shift configurations available. Please create one first.'
      });
    }

    // Optionally filter out patio/bar if requested
    let adjustedConfig = { ...bestConfig.toObject() };
    
    if (!includePatioArea) {
      adjustedConfig.activeSections = adjustedConfig.activeSections.map(section => ({
        ...section,
        assignedTables: section.assignedTables.filter(table => !table.startsWith('P'))
      }));
    }
    
    if (!includeBarArea) {
      adjustedConfig.activeSections = adjustedConfig.activeSections.map(section => ({
        ...section,
        assignedTables: section.assignedTables.filter(table => !table.startsWith('B'))
      }));
    }

    // Apply the configuration
    await SectionConfiguration.updateMany({}, { isActive: false });
    bestConfig.isActive = true;
    await bestConfig.save();
    await applyConfigurationToTables(bestConfig, { includePatioArea, includeBarArea });

    res.status(200).json({
      success: true,
      message: `Quick setup complete for ${serverCount} server(s)`,
      appliedConfiguration: bestConfig.shiftName,
      adjustments: {
        patioIncluded: includePatioArea,
        barIncluded: includeBarArea
      }
    });

  } catch (error) {
    console.error('Error with quick setup:', error);
    res.status(500).json({ error: 'Quick setup failed' });
  }
});

/**
 * Helper function to apply configuration to tables
 */
async function applyConfigurationToTables(config, options = {}) {
  try {
    // Reset all tables to no section
    await Table.updateMany({}, { 
      section: null,
      assignedWaiter: null,
      partySize: null,
      state: 'available' // Reset state when reconfiguring
    });

    // Apply the configuration
    for (const sectionConfig of config.activeSections) {
      let tablesToAssign = sectionConfig.assignedTables;
      
      // Apply filters if specified
      if (!options.includePatioArea) {
        tablesToAssign = tablesToAssign.filter(table => !table.startsWith('P'));
      }
      
      if (!options.includeBarArea) {
        tablesToAssign = tablesToAssign.filter(table => !table.startsWith('B'));
      }
      
      if (tablesToAssign.length > 0) {
        await Table.updateMany(
          { tableNumber: { $in: tablesToAssign } },
          { section: sectionConfig.sectionNumber }
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Error applying configuration to tables:', error);
    throw error;
  }
}

module.exports = router;

/**
 * 🎯 HOW THIS WORKS FOR YOUR RESTAURANT:
 * 
 * SCENARIO 1: Slow Tuesday Morning
 * - Only 1 server working
 * - POST /api/shifts/quick-setup { serverCount: 1 }
 * - System assigns only the easiest tables to manage
 * 
 * SCENARIO 2: Friday Night Rush
 * - 4 servers working + patio is open
 * - POST /api/shifts/quick-setup { serverCount: 4, includePatioArea: true }
 * - System opens all sections including patio
 * 
 * SCENARIO 3: Bad Weather
 * - 3 servers but close patio
 * - POST /api/shifts/quick-setup { serverCount: 3, includePatioArea: false }
 * - System redistributes patio tables to indoor sections
 * 
 * 🚀 BENEFITS:
 * - Servers know exactly which tables are theirs
 * - Management can quickly reconfigure based on staffing
 * - System prevents overburdening servers
 * - Easy to handle weather/seasonal changes
 */