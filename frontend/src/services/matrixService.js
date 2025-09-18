export class MatrixSeatService {
  constructor(waiters) {
    // Initialize matrix: [waiterIndex][partySizeIndex] = count
    this.matrix = Array(waiters.length).fill().map(() => Array(6).fill(0));
    this.waiters = waiters;
  }

  // Convert party size to matrix index (1→0, 2→1, 3→2, 4→3, 5→4, 6+→5)
  getPartySizeIndex(partySize) {
    if (partySize >= 6) return 5;
    return Math.max(0, partySize - 1);
  }

  // Find waiter with lowest count for specific party size
  findBestWaiter(partySize, availableWaiters) {
    if (availableWaiters.length === 0) return null;

    const partySizeIndex = this.getPartySizeIndex(partySize);
    let bestWaiter = availableWaiters[0];
    let lowestCount = this.matrix[bestWaiter.index][partySizeIndex];

    for (let waiter of availableWaiters) {
      const waiterCount = this.matrix[waiter.index][partySizeIndex];
      
      if (waiterCount < lowestCount) {
        lowestCount = waiterCount;
        bestWaiter = waiter;
      }
      // Tiebreaker: use total tables served today
      else if (waiterCount === lowestCount) {
        const currentTotal = this.matrix[bestWaiter.index].reduce((a, b) => a + b);
        const waiterTotal = this.matrix[waiter.index].reduce((a, b) => a + b);
        
        if (waiterTotal < currentTotal) {
          bestWaiter = waiter;
        }
      }
    }
    
    return bestWaiter;
  }

  // Update matrix when party is seated
  seatParty(waiterIndex, partySize) {
    const partySizeIndex = this.getPartySizeIndex(partySize);
    this.matrix[waiterIndex][partySizeIndex]++;
  }

  // Get current matrix state
  getMatrix() {
    return this.matrix;
  }

  // Reset matrix (new shift)
  reset() {
    this.matrix = Array(this.waiters.length).fill().map(() => Array(6).fill(0));
  }

  // Get waiter's total tables served
  getWaiterTotal(waiterIndex) {
    return this.matrix[waiterIndex].reduce((a, b) => a + b);
  }

  // Get fairness score (lower = more fair distribution)
  getFairnessScore() {
    const totals = this.matrix.map(row => row.reduce((a, b) => a + b));
    const avg = totals.reduce((a, b) => a + b) / totals.length;
    return totals.reduce((sum, total) => sum + Math.abs(total - avg), 0);
  }
}






