// frontend/src/services/cacheService.js
class CacheService {
  constructor() {
    this.cacheKeys = {
      WAITLIST: 'restaurant-waitlist',
      TABLES: 'restaurant-tables', 
      MATRIX: 'restaurant-fairness-matrix',
      PENDING_OPERATIONS: 'restaurant-pending-ops'
    };
  }

  // Get cached data with fallback
  getCachedData(key, fallback = null) {
    try {
      const cached = localStorage.getItem(this.cacheKeys[key]);
      return cached ? JSON.parse(cached) : fallback;
    } catch (error) {
      console.warn(`Cache read error for ${key}:`, error);
      return fallback;
    }
  }

  // Cache data with timestamp
  setCachedData(key, data) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        version: 1
      };
      localStorage.setItem(this.cacheKeys[key], JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn(`Cache write error for ${key}:`, error);
    }
  }

  // Queue operations when offline
  queueOperation(operation) {
    const pending = this.getCachedData('PENDING_OPERATIONS', []);
    pending.push({
      ...operation,
      timestamp: Date.now(),
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    this.setCachedData('PENDING_OPERATIONS', pending);
  }

  // Get and clear pending operations
  getPendingOperations() {
    const pending = this.getCachedData('PENDING_OPERATIONS', []);
    this.setCachedData('PENDING_OPERATIONS', []); // Clear queue
    return pending;
  }
}

export const cacheService = new CacheService();