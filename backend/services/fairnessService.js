const AuditEvent = require('../models/AuditEvent');
const User = require('../models/User');

class FairnessService {
  /**
   * 🎯 SINGLE SOURCE OF TRUTH for fairness calculations
   */
  async getCurrentMatrix() {
    const activeWaiters = await User.find({
      role: 'waiter',
      isActive: true,
      shiftStart: { $ne: null }
    }).sort({ section: 1 });

    if (activeWaiters.length === 0) {
      return { matrix: [], waiters: [], fairnessScore: 100 };
    }

    // Build matrix from audit events (real assignments)
    const matrix = await this.buildMatrixFromAuditTrail(activeWaiters);
    const fairnessScore = this.calculateFairnessScore(matrix);

    return {
      matrix,
      waiters: activeWaiters.map(w => ({
        id: w._id,
        name: w.userName,
        section: w.section
      })),
      fairnessScore
    };
  }

  async buildMatrixFromAuditTrail(waiters) {
    const matrix = Array(waiters.length).fill().map(() => Array(6).fill(0));
    
    // Get today's assignments from audit trail
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignments = await AuditEvent.find({
      eventType: 'ASSIGNMENT',
      createdAt: { $gte: today }
    }).populate('userId');

    // Build matrix from actual assignments
    assignments.forEach(assignment => {
      if (!assignment.metadata?.partySize) return;

      const waiterIndex = waiters.findIndex(w => 
        w._id.toString() === assignment.userId?._id.toString()
      );

      if (waiterIndex >= 0) {
        const partySizeIndex = Math.min(5, Math.max(0, assignment.metadata.partySize - 1));
        matrix[waiterIndex][partySizeIndex]++;
      }
    });

    return matrix;
  }

  calculateFairnessScore(matrix) {
    if (!matrix.length) return 100;

    const totals = matrix.map(row => row.reduce((a, b) => a + b, 0));
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const variance = totals.reduce((sum, total) => sum + Math.pow(total - avg, 2), 0) / totals.length;
    
    return Math.max(0, 100 - Math.round(variance * 10));
  }

  async recordAssignment(waiterId, partySize) {
    // This method is called by the seating coordinator
    // It ensures the audit trail is updated consistently
    const waiter = await User.findById(waiterId);
    if (!waiter) throw new Error('Waiter not found');

    // The audit event creation happens in seatingCoordinator
    // This method can do additional fairness-related tracking if needed
    console.log(`Fairness: Recorded ${partySize}-top for ${waiter.userName}`);
  }
}

module.exports = new FairnessService();
