// frontend/src/config/mockData.js
/**
 * 🎯 CENTRALIZED MOCK DATA
 * All fallback/development data in one place
 * Makes it easy to maintain and update test scenarios
 */

export const MOCK_WAITLIST = [
  { 
    _id: '1', 
    partyName: 'Smith', 
    partySize: 4, 
    phoneNumber: '555-0123', 
    priority: 'normal', 
    createdAt: new Date(Date.now() - 15*60000),
    partyStatus: 'waiting'
  },
  { 
    _id: '2', 
    partyName: 'Johnson', 
    partySize: 2, 
    phoneNumber: '555-0456', 
    priority: 'coworker', 
    createdAt: new Date(Date.now() - 8*60000),
    partyStatus: 'waiting'
  },
  { 
    _id: '3', 
    partyName: 'Williams', 
    partySize: 8, 
    phoneNumber: '555-0789', 
    priority: 'large_party', 
    createdAt: new Date(Date.now() - 22*60000),
    partyStatus: 'waiting'
  },
  { 
    _id: '4', 
    partyName: 'Davis', 
    partySize: 6, 
    phoneNumber: '555-0321', 
    priority: 'normal', 
    createdAt: new Date(Date.now() - 12*60000),
    partyStatus: 'waiting'
  }
];

export const MOCK_TABLES = [
  { id: 'A1', state: 'available', capacity: 4, section: 1 },
  { id: 'A2', state: 'occupied', capacity: 2, section: 1 },
  { id: 'A3', state: 'assigned', capacity: 4, section: 2 },
  { id: 'B1', state: 'available', capacity: 6, section: 1 },
  { id: 'B2', state: 'available', capacity: 4, section: 2 }
];

// Mock suggestions for testing the smart seating algorithm
export const MOCK_SUGGESTIONS = [
  {
    id: 'suggestion-1',
    party: MOCK_WAITLIST[0], // Smith party
    table: { id: 'A16', number: 'A16', capacity: 4 },
    waiter: { id: 1, name: 'Server 1', section: 1 },
    confidence: 85,
    reason: 'Best match for party size and server rotation'
  },
  {
    id: 'suggestion-2', 
    party: MOCK_WAITLIST[1], // Johnson party
    table: { id: 'A2', number: 'A2', capacity: 2 },
    waiter: { id: 2, name: 'Server 2', section: 2 },
    confidence: 92,
    reason: 'Perfect table size match'
  }
];

// Mock server configurations for testing
export const MOCK_SHIFT_CONFIGS = [
  {
    serverCount: 4,
    serverOrder: [
      { id: 1, name: 'Alice', section: 1 },
      { id: 2, name: 'Bob', section: 2 },
      { id: 3, name: 'Carol', section: 3 },
      { id: 4, name: 'David', section: 4 }
    ],
    isShiftSetup: true
  },
  {
    serverCount: 5,
    serverOrder: [
      { id: 1, name: 'Alice', section: 1 },
      { id: 2, name: 'Bob', section: 2 },
      { id: 3, name: 'Carol', section: 3 },
      { id: 4, name: 'David', section: 4 },
      { id: 5, name: 'Eve', section: 5 }
    ],
    isShiftSetup: true
  }
];

// Development helper functions
export const getRandomMockParty = () => {
  const names = ['Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Fisher'];
  const sizes = [2, 2, 3, 4, 4, 5, 6, 8];
  const priorities = ['normal', 'normal', 'normal', 'large_party', 'coworker'];
  
  return {
    _id: Date.now().toString(),
    partyName: names[Math.floor(Math.random() * names.length)],
    partySize: sizes[Math.floor(Math.random() * sizes.length)],
    phoneNumber: `555-${Math.floor(Math.random() * 9000) + 1000}`,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    createdAt: new Date(Date.now() - Math.random() * 30 * 60000), // Random wait time up to 30 min
    partyStatus: 'waiting'
  };
};

// Mock fairness matrix for testing
export const MOCK_FAIRNESS_MATRIX = [
  [2, 1, 3, 2, 0, 1], // Server 1: party sizes 1,2,3,4,5,6+
  [1, 2, 2, 3, 1, 0], // Server 2
  [3, 1, 1, 2, 2, 1], // Server 3
  [1, 3, 2, 1, 1, 0], // Server 4
];

export const getDevelopmentConfig = () => ({
  waitlist: MOCK_WAITLIST,
  tables: MOCK_TABLES,
  suggestions: MOCK_SUGGESTIONS,
  shiftConfig: MOCK_SHIFT_CONFIGS[0],
  fairnessMatrix: MOCK_FAIRNESS_MATRIX
});