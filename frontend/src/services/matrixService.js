export class MatrixSeatService {
  constructor(waiters) {
    this.waiters = waiters;

    // Try to load saved matrix from localStorage
    this.loadMatrixFromStorage();
  }

  // NEW: Load matrix from localStorage
  loadMatrixFromStorage() {
    try {
      const saved = localStorage.getItem('restaurant-fairness-matrix');
      if (saved) {
        const savedMatrix = JSON.parse(saved);
        // Validate the saved matrix matches current waiter count
        if (savedMatrix.length === this.waiters.length) {
          this.matrix = savedMatrix;
          console.log('Loaded fairness matrix from storage');
          return;
        } else {
          console.log('Saved matrix size mismatch, creating new matrix');
        }
      }
    } catch (error) {
      console.error('Error loading matrix from storage:', error);
    }

    // Create fresh matrix if no valid saved data
    this.matrix = Array(this.waiters.length).fill().map(() => Array(6).fill(0));
  }

  // NEW: Save matrix to localStorage
  saveMatrixToStorage() {
    try {
      localStorage.setItem('restaurant-fairness-matrix', JSON.stringify(this.matrix));
    } catch (error) {
      console.error('Error saving matrix to storage:', error);
    }
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

  // In matrixService.js
  seatParty(waiterIndex, partySize) {
    const partySizeIndex = this.getPartySizeIndex(partySize);
    console.log(`🎯 Matrix Update: Waiter ${waiterIndex}, Party Size ${partySize}, Cell [${waiterIndex}][${partySizeIndex}] before:`, this.matrix[waiterIndex][partySizeIndex]);
    this.matrix[waiterIndex][partySizeIndex]++;
    console.log(`🎯 Matrix Update: Cell [${waiterIndex}][${partySizeIndex}] after:`, this.matrix[waiterIndex][partySizeIndex]);
    this.saveMatrixToStorage();
  }

  // Get current matrix state
  getMatrix() {
    return this.matrix;
  }

  // Reset matrix (new shift) - NOW CLEARS STORAGE
  reset() {
    this.matrix = Array(this.waiters.length).fill().map(() => Array(6).fill(0));

    // NEW: Clear from localStorage
    localStorage.removeItem('restaurant-fairness-matrix');
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