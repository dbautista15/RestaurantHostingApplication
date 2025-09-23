// src/services/tableAssignmentService.js
/**
 * 🎯 CENTRALIZED TABLE ASSIGNMENT SERVICE
 * 
 * This service consolidates all your proven smart assignment logic
 * from useMatrixSeating.js into a reusable service that all seating
 * paths can use consistently.
 * 
 * ENGINEERING PRINCIPLES APPLIED:
 * - Single Responsibility: One service handles all assignments
 * - DRY: No duplicate assignment logic across components
 * - Strategy Pattern: Same algorithm for all seating sources
 * - Dependency Injection: Accepts waiters, tables, matrixService
 */

export class TableAssignmentService {
  constructor(waiters, tables, matrixService) {
    this.waiters = waiters;
    this.tables = tables;
    this.matrixService = matrixService;
    
    // Cache for performance - invalidated when data changes
    this._waiterAssignmentsCache = null;
    this._lastUpdateTime = Date.now();
  }

  /**
   * 🎯 MAIN PUBLIC METHOD: Find Best Assignment
   * 
   * This is the primary method that all seating paths should use.
   * It encapsulates your proven fairness algorithm.
   * 
   * @param {number} partySize - Size of the party to seat
   * @param {Array} excludeWaiters - Waiter IDs to exclude (optional)
   * @returns {Object|null} - Assignment object or null if no tables available
   */
  findBestAssignment(partySize, excludeWaiters = []) {
    try {
      // Validate input
      if (!partySize || partySize < 1 || partySize > 20) {
        console.warn('Invalid party size:', partySize);
        return null;
      }

      // Get available waiters who have suitable tables
      const availableWaiters = this.getWaitersWithAvailableTables(partySize, excludeWaiters);
      
      if (!availableWaiters || availableWaiters.length === 0) {
        console.log(`No available waiters for party size ${partySize}`);
        return null;
      }

      // Use your proven FIFO + fairness algorithm
      const bestWaiter = this.findBestWaiterWithFIFO({ partySize }, availableWaiters);
      
      if (!bestWaiter) {
        console.log(`No suitable waiter found for party size ${partySize}`);
        return null;
      }

      // Find the best table for this waiter and party
      const bestTable = this.getBestTableForWaiterAndParty(bestWaiter, partySize);

      if (!bestTable) {
        console.log(`No suitable table found for waiter ${bestWaiter.id}, party size ${partySize}`);
        return null;
      }

      // Return standardized assignment object
      return {
        waiter: bestWaiter,
        table: bestTable,
        partySize,
        confidence: this.calculateConfidence({ partySize }, bestTable, bestWaiter),
        reason: this.generateReason({ partySize }, bestTable, bestWaiter),
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error in findBestAssignment:', error);
      return null;
    }
  }

  /**
   * 🎯 GET WAITERS WITH AVAILABLE TABLES
   * 
   * Copied and refined from your useMatrixSeating.js
   * Finds waiters who have tables that can accommodate the party size
   */
  getWaitersWithAvailableTables(partySize, excludeWaiters = []) {
    return this.waiters
      .filter(waiter => !excludeWaiters.includes(waiter.id))
      .filter(waiter => {
        const waiterTables = this.tables.filter(table =>
          this.getTableWaiter(table.id) === waiter.id
        );

        return waiterTables.some(table =>
          table.state === 'available' &&
          table.capacity >= partySize &&
          table.capacity <= (partySize + 2) && // Your business rule: max 2 extra seats
          !this.isPendingAssignment(table.id)
        );
      })
      .map(waiter => ({
        ...waiter,
        index: this.waiters.findIndex(w => w.id === waiter.id)
      }));
  }

  /**
   * 🎯 FIND BEST WAITER WITH FIFO LOGIC
   * 
   * Your proven algorithm that balances fairness with urgency
   * Copied from useMatrixSeating.js with improvements
   */
  findBestWaiterWithFIFO(party, availableWaiters) {
    const partySizeIndex = this.matrixService.getPartySizeIndex(party.partySize);
    const waitMinutes = party.createdAt ? 
      Math.floor((Date.now() - new Date(party.createdAt)) / (1000 * 60)) : 0;

    // If party has been waiting > 20 minutes, prioritize them (less strict fairness)
    const isUrgent = waitMinutes > 20;

    // Find waiters with lowest count for this party size
    const waiterCounts = availableWaiters.map(waiter => ({
      waiter,
      count: this.matrixService.matrix[waiter.index][partySizeIndex],
      totalTables: this.matrixService.getWaiterTotal(waiter.index)
    }));

    const minCount = Math.min(...waiterCounts.map(w => w.count));
    const fairestWaiters = waiterCounts.filter(w => w.count === minCount);

    if (fairestWaiters.length === 1) {
      return fairestWaiters[0].waiter;
    }

    // Tiebreaker: if urgent party, pick waiter with fewest total tables
    // Otherwise, use existing logic (total tables)
    if (isUrgent) {
      const minTotal = Math.min(...fairestWaiters.map(w => w.totalTables));
      const candidate = fairestWaiters.find(w => w.totalTables === minTotal);
      return candidate.waiter;
    }

    // Default to matrixService logic for normal priority
    return this.matrixService.findBestWaiter(party.partySize, availableWaiters);
  }

  /**
   * 🎯 GET BEST TABLE FOR WAITER AND PARTY
   * 
   * Finds the optimal table from waiter's section for the party size
   */
  getBestTableForWaiterAndParty(waiter, partySize) {
    const waiterTables = this.tables
      .filter(table => this.getTableWaiter(table.id) === waiter.id)
      .filter(table =>
        table.state === 'available' &&
        table.capacity >= partySize &&
        table.capacity <= (partySize + 2) &&
        !this.isPendingAssignment(table.id)
      );

    if (waiterTables.length === 0) return null;

    // Prefer table that best matches party size (minimize waste)
    return waiterTables.reduce((best, current) => {
      const bestDiff = Math.abs(best.capacity - partySize);
      const currentDiff = Math.abs(current.capacity - partySize);
      return currentDiff < bestDiff ? current : best;
    });
  }

  /**
   * 🎯 HELPER METHODS
   * 
   * Supporting functions that make the main algorithm work
   */

  // Get which waiter is assigned to a table (from your restaurant layout)
  getTableWaiter(tableId) {
    // This mirrors your WAITER_ASSIGNMENTS logic from restaurantLayout.js
    const waiterAssignments = {
      1: ['A13', 'A14', 'A15', 'A16'],
      2: ['A12', 'A11', 'A10', 'A9'],
      3: ['A1', 'A3', 'A4', 'A5'],
      4: ['A2', 'A6', 'A7', 'A8'],
      5: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6']
    };

    for (let waiterId = 1; waiterId <= 5; waiterId++) {
      if (waiterAssignments[waiterId]?.includes(tableId)) {
        return waiterId;
      }
    }
    return null;
  }

  // Check if table has pending assignment (to avoid double-booking)
  isPendingAssignment(tableId) {
    // This would integrate with your pendingAssignments state
    // For now, return false (can be enhanced later)
    return false;
  }

  // Calculate confidence score for the assignment
  calculateConfidence(party, table, waiter) {
    let confidence = 100;

    // Deduct for table size mismatch
    const sizeDiff = Math.abs(table.capacity - party.partySize);
    confidence -= sizeDiff * 10;

    // Deduct if waiter is overloaded
    const waiterTotal = this.matrixService.getWaiterTotal(waiter.index);
    const avgTotal = this.matrixService.matrix
      .reduce((sum, row) => sum + row.reduce((a, b) => a + b), 0) / this.waiters.length;

    if (waiterTotal > avgTotal + 2) {
      confidence -= 20;
    }

    // Bonus for perfect size match
    if (table.capacity === party.partySize) {
      confidence += 10;
    }

    return Math.max(50, Math.min(100, confidence));
  }

  // Generate human-readable reason for the assignment
  generateReason(party, table, waiter) {
    const partySizeIndex = this.matrixService.getPartySizeIndex(party.partySize);
    const count = this.matrixService.matrix[waiter.index][partySizeIndex];

    if (count === 0) {
      return `${waiter.name} hasn't had a ${party.partySize}-top yet today`;
    }
    
    if (table.capacity === party.partySize) {
      return `Perfect table size match with fair rotation`;
    }
    
    return `${waiter.name} has the fewest ${party.partySize}-tops (${count})`;
  }

  /**
   * 🎯 UTILITY METHODS FOR CACHE MANAGEMENT
   */

  // Invalidate cache when data changes (call this when waiters/tables update)
  invalidateCache() {
    this._waiterAssignmentsCache = null;
    this._lastUpdateTime = Date.now();
  }

  // Update the service with new data
  updateData(waiters, tables, matrixService) {
    this.waiters = waiters;
    this.tables = tables;
    this.matrixService = matrixService;
    this.invalidateCache();
  }

  /**
   * 🎯 DEBUG AND ANALYSIS METHODS
   */

  // Get assignment statistics for debugging
  getAssignmentStats() {
    const availableTablesByWaiter = {};
    
    this.waiters.forEach(waiter => {
      const waiterTables = this.tables.filter(table => 
        this.getTableWaiter(table.id) === waiter.id && table.state === 'available'
      );
      availableTablesByWaiter[waiter.id] = {
        name: waiter.name,
        availableTables: waiterTables.length,
        totalCapacity: waiterTables.reduce((sum, table) => sum + table.capacity, 0),
        tables: waiterTables.map(t => ({ id: t.id, capacity: t.capacity }))
      };
    });

    return {
      totalAvailableTables: this.tables.filter(t => t.state === 'available').length,
      availableTablesByWaiter,
      matrixFairnessScore: this.matrixService.getFairnessScore()
    };
  }

  // Validate assignment before executing (additional safety check)
  validateAssignment(assignment) {
    if (!assignment) return { valid: false, reason: 'No assignment provided' };

    const { waiter, table, partySize } = assignment;

    // Check waiter exists
    if (!this.waiters.find(w => w.id === waiter.id)) {
      return { valid: false, reason: 'Waiter not found' };
    }

    // Check table exists and is available
    const tableObj = this.tables.find(t => t.id === table.id);
    if (!tableObj) {
      return { valid: false, reason: 'Table not found' };
    }

    if (tableObj.state !== 'available') {
      return { valid: false, reason: 'Table is not available' };
    }

    // Check capacity
    if (tableObj.capacity < partySize) {
      return { valid: false, reason: 'Table too small for party' };
    }

    // Check waiter assignment
    if (this.getTableWaiter(table.id) !== waiter.id) {
      return { valid: false, reason: 'Table not in waiter\'s section' };
    }

    return { valid: true };
  }
}

/**
 * 🎯 FACTORY FUNCTION FOR EASY INSTANTIATION
 * 
 * Creates a new TableAssignmentService with proper dependency injection
 */
export const createTableAssignmentService = (waiters, tables, matrixService) => {
  return new TableAssignmentService(waiters, tables, matrixService);
};

/**
 * 🎯 USAGE EXAMPLES:
 * 
 * // In your components:
 * const assignmentService = new TableAssignmentService(waiters, tables, matrixService);
 * 
 * // Find best assignment for any party size:
 * const assignment = assignmentService.findBestAssignment(4);
 * 
 * // Use the assignment:
 * if (assignment) {
 *   handleAnyTableAssignment(assignment, 'smart-assignment');
 * }
 * 
 * // Debug the service:
 * console.log(assignmentService.getAssignmentStats());
 */