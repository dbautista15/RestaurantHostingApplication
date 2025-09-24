// backend/services/floorPlanService.js - SINGLE SOURCE OF TRUTH
const Table = require('../models/Table');
const User = require('../models/User');
const SectionConfiguration = require('../models/SectionConfiguration');
const { RESTAURANT_TABLES, getTableByNumber } = require('../config/restaurantLayout');

class FloorPlanService {
  /**
   * 🎯 SINGLE METHOD that provides EVERYTHING the floor plan needs
   * No business logic in frontend - just display this data
   */
  async getFloorPlanData(requestingUser) {
    try {
      // 1. Get all tables with current state
      const tables = await Table.find({})
        .populate('assignedWaiter', 'userName role section clockInNumber');

      // 2. Get active configuration
      const activeConfig = await SectionConfiguration.findOne({ isActive: true });

      // 3. Get active waiters
      const activeWaiters = await User.find({
        role: 'waiter',
        isActive: true,
        shiftStart: { $ne: null }
      }).sort({ section: 1 });

      // 4. Build complete table data for frontend
      const floorPlanTables = await Promise.all(
        tables.map(async (table) => {
          const layoutInfo = getTableByNumber(table.tableNumber);
          
          return {
            // Core identification
            id: table._id,
            number: table.tableNumber,
            
            // 🎯 WHY: Frontend needs position but shouldn't calculate it
            position: {
              x: layoutInfo?.x || 0,
              y: layoutInfo?.y || 0
            },
            
            // 🎯 WHY: All state comes from backend
            state: table.state,
            isActive: table.section !== null,
            
            // 🎯 WHY: Frontend needs to know but not decide
            isDraggable: this.canTableBeDragged(table, requestingUser),
            isClickable: this.canTableBeClicked(table, requestingUser),
            
            // 🎯 WHY: Pre-calculated display information
            capacity: table.capacity,
            displayCapacity: `${table.capacity}`,
            displayText: this.getTableDisplayText(table),
            
            // 🎯 WHY: Waiter info for coloring
            waiterInfo: table.assignedWaiter ? {
              id: table.assignedWaiter._id,
              name: table.assignedWaiter.userName,
              section: table.assignedWaiter.section,
              color: this.getWaiterColor(table.assignedWaiter.section)
            } : null,
            
            // 🎯 WHY: Section info for grouping
            sectionInfo: table.section ? {
              id: table.section,
              color: this.getSectionColor(table.section)
            } : null,
            
            // 🎯 WHY: Backend decides styling
            styleHint: this.getTableStyleHint(table),
            
            // 🎯 WHY: Stats for footer (pre-calculated)
            stats: this.getTableStats(table)
          };
        })
      );

      // 5. Grid configuration (could vary by restaurant)
      const gridConfig = {
        size: 30,
        cols: 22,
        rows: 18,
        snapToGrid: true
      };

      // 6. Calculate summary statistics
      const stats = {
        available: floorPlanTables.filter(t => t.isActive && t.state === 'available').length,
        assigned: floorPlanTables.filter(t => t.isActive && t.state === 'assigned').length,
        occupied: floorPlanTables.filter(t => t.isActive && t.state === 'occupied').length,
        total: floorPlanTables.filter(t => t.isActive).length
      };

      return {
        success: true,
        tables: floorPlanTables,
        gridConfig,
        stats,
        activeConfig: activeConfig ? {
          name: activeConfig.shiftName,
          serverCount: activeConfig.serverCount
        } : null,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Floor plan service error:', error);
      throw error;
    }
  }

  /**
   * 🎯 BUSINESS RULES - All decided server-side
   */
  canTableBeDragged(table, user) {
    // Only managers can drag tables
    if (user.role !== 'manager') return false;
    
    // Can't drag occupied tables
    if (table.state === 'occupied') return false;
    
    // Only active tables can be moved
    return table.section !== null;
  }

  canTableBeClicked(table, user) {
    // Inactive tables can't be clicked
    if (table.section === null) return false;
    
    // Different roles have different permissions
    if (user.role === 'host') return true;
    if (user.role === 'waiter') {
      // Waiters can only click their own tables
      return table.assignedWaiter?.toString() === user._id.toString();
    }
    
    return false;
  }

  getTableDisplayText(table) {
    if (table.state === 'occupied' && table.partySize) {
      return `Party of ${table.partySize}`;
    }
    if (table.state === 'assigned') {
      return 'Assigned';
    }
    return '';
  }

  getTableStyleHint(table) {
    const hints = [];
    
    // State-based styling
    if (!table.section) hints.push('opacity-50 cursor-not-allowed');
    if (table.state === 'available') hints.push('hover:ring-2 hover:ring-green-400');
    if (table.state === 'occupied') hints.push('hover:ring-2 hover:ring-red-400');
    
    // Special cases
    if (table.capacity >= 8) hints.push('text-sm font-bold'); // Large tables
    if (table.combinedWith?.length > 0) hints.push('ring-2 ring-blue-500'); // Combined
    
    return hints.join(' ');
  }

  getTableStats(table) {
    if (!table.section || table.state !== 'occupied') return null;
    
    return {
      occupied: table.state === 'occupied' ? 1 : 0,
      capacity: table.capacity,
      partySize: table.partySize || 0
    };
  }

  getWaiterColor(section) {
    const colors = [
      { bg: '#fee2e2', border: '#ef4444' }, // red
      { bg: '#dcfce7', border: '#22c55e' }, // green
      { bg: '#fef3c7', border: '#f59e0b' }, // yellow
      { bg: '#dbeafe', border: '#3b82f6' }, // blue
      { bg: '#f3e8ff', border: '#a855f7' }, // purple
      { bg: '#fce7f3', border: '#ec4899' }, // pink
      { bg: '#ccfbf1', border: '#14b8a6' }  // teal
    ];
    
    return colors[section - 1] || colors[0];
  }

  getSectionColor(section) {
    return this.getWaiterColor(section);
  }

  /**
   * 🎯 HANDLE TABLE INTERACTIONS (Backend decides what happens)
   */
  async handleTableClick(tableId, user, metadata = {}) {
    const table = await Table.findById(tableId);
    if (!table) throw new Error('Table not found');
    
    // Check permissions
    if (!this.canTableBeClicked(table, user)) {
      throw new Error('Permission denied');
    }
    
    // Decide action based on state
    if (table.state === 'available' && metadata.partySize) {
      // Seat a party
      return this.seatPartyAtTable(table, metadata.partySize, user);
    }
    
    if (table.state === 'occupied' && !metadata.partySize) {
      // Clear table
      return this.clearTable(table, user);
    }
    
    // Toggle between states (for demo)
    const transitions = {
      'available': 'assigned',
      'assigned': 'occupied',
      'occupied': 'available'
    };
    
    const newState = transitions[table.state];
    return this.updateTableState(table, newState, user);
  }

  async handleTableDrop(tableId, newPosition, user) {
    if (user.role !== 'manager') {
      throw new Error('Only managers can move tables');
    }
    
    const table = await Table.findById(tableId);
    if (!table) throw new Error('Table not found');
    
    // In a real system, you'd update the position in the database
    // For now, just return success
    return {
      success: true,
      message: `Table ${table.tableNumber} moved to position (${newPosition.x}, ${newPosition.y})`,
      // In production: await this.updateTablePosition(tableId, newPosition);
    };
  }

  /**
   * 🎯 CHECK IF PARTY SIZE NEEDED (Backend decides)
   */
  needsPartySizeForClick(tableId) {
    // This is called before showing the modal
    // Backend decides if we need party size input
    const table = Table.findById(tableId);
    
    // Need party size if table is available
    return table && table.state === 'available';
  }

  // Helper methods for state changes
  async seatPartyAtTable(table, partySize, user) {
    // Implementation would update table state
    return {
      success: true,
      action: 'seated',
      table: table.tableNumber,
      partySize
    };
  }

  async clearTable(table, user) {
    // Implementation would clear table
    return {
      success: true,
      action: 'cleared',
      table: table.tableNumber
    };
  }

  async updateTableState(table, newState, user) {
    // Implementation would update state
    return {
      success: true,
      action: 'state_changed',
      table: table.tableNumber,
      from: table.state,
      to: newState
    };
  }
}

module.exports = new FloorPlanService();

/**
 * 🎯 WHY THIS DESIGN:
 * 
 * 1. SINGLE SOURCE OF TRUTH
 *    - All table data comes from one place
 *    - No duplicate logic between services
 *    - Easy to modify business rules
 * 
 * 2. PRE-CALCULATED DISPLAY DATA
 *    - Frontend doesn't need to know HOW to calculate
 *    - Just needs to know WHAT to display
 *    - Reduces frontend complexity
 * 
 * 3. PERMISSION-BASED ACTIONS
 *    - Backend decides what user can do
 *    - Frontend just enables/disables based on flags
 *    - Security enforced server-side
 * 
 * 4. STYLE HINTS NOT RULES
 *    - Backend suggests styling
 *    - Frontend can override for themes
 *    - Separation of concerns maintained
 * 
 * 5. COMPLETE DATA PACKAGE
 *    - One API call gets everything
 *    - No need for multiple requests
 *    - Better performance
 */