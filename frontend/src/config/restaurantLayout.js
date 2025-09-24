// backend/config/restaurantLayout.js (NEW - matches your frontend exactly)
/**
 * 🏢 RESTAURANT LAYOUT - SINGLE SOURCE OF TRUTH
 * This layout is used by both frontend AND backend
 * Frontend coordinates, backend logic, same data structure
 */

const RESTAURANT_TABLES = [
  // Your exact frontend layout
  { id: 'B1', number: 'B1', x: 2, y: 13, capacity: 4, section: 1 },
  { id: 'B2', number: 'B2', x: 5, y: 13, capacity: 4, section: 1 },
  { id: 'B6', number: 'B6', x: 18, y: 15, capacity: 2, section: 1 },
  { id: 'A8', number: 'A8', x: 18, y: 13, capacity: 6, section: 1 },
  
  { id: 'A16', number: 'A16', x: 2, y: 9, capacity: 4, section: 2 },
  { id: 'A9', number: 'A9', x: 5, y: 9, capacity: 4, section: 2 },
  { id: 'A6', number: 'A6', x: 18, y: 9, capacity: 6, section: 2 },
  { id: 'A7', number: 'A7', x: 18, y: 11, capacity: 2, section: 2 },
  
  { id: 'A15', number: 'A15', x: 2, y: 5, capacity: 4, section: 3 },
  { id: 'A10', number: 'A10', x: 5, y: 5, capacity: 4, section: 3 },
  { id: 'A4', number: 'A4', x: 18, y: 5, capacity: 2, section: 3 },
  { id: 'A5', number: 'A5', x: 18, y: 7, capacity: 6, section: 3 },
  
  { id: 'A13', number: 'A13', x: 2, y: 1, capacity: 6, section: 4 },
  { id: 'A12', number: 'A12', x: 5, y: 1, capacity: 4, section: 4 },
  { id: 'A1', number: 'A1', x: 15, y: 1, capacity: 4, section: 4 },
  { id: 'A2', number: 'A2', x: 18, y: 1, capacity: 2, section: 4 },
  
  { id: 'A14', number: 'A14', x: 2, y: 3, capacity: 4, section: 5 },
  { id: 'A11', number: 'A11', x: 5, y: 3, capacity: 4, section: 5 },
  { id: 'A3', number: 'A3', x: 18, y: 3, capacity: 4, section: 5 },
  
  { id: 'B3', number: 'B3', x: 3, y: 16, capacity: 15, section: 6 },
  { id: 'B4', number: 'B4', x: 12, y: 16, capacity: 4, section: 6 },
  { id: 'B5', number: 'B5', x: 15, y: 16, capacity: 15, section: 6 }
];

const SHIFT_CONFIGURATIONS = [
  {
    name: 'four-servers',
    serverCount: 4,
    sections: [
      { number: 1, tables: ['A16', 'A9', 'A7', 'A8', 'B6'] },
      { number: 2, tables: ['A15', 'A10', 'A5', 'A6', 'B1'] },
      { number: 3, tables: ['A14', 'A11', 'A3', 'A4', 'B2'] },
      { number: 4, tables: ['A1', 'A2', 'A13', 'A12'] }
    ],
    partyTables: ['B3', 'B5'] // Available when 4+ servers
  },
  
  {
    name: 'five-servers',
    serverCount: 5,
    sections: [
      { number: 1, tables: ['B1', 'B2', 'B6', 'A8'] },
      { number: 2, tables: ['A16', 'A9', 'A7', 'A6'] },
      { number: 3, tables: ['A15', 'A10', 'A4', 'A5'] },
      { number: 4, tables: ['A1', 'A2', 'A13', 'A12'] },
      { number: 5, tables: ['A14', 'A11', 'A3'] }
    ],
    partyTables: ['B3', 'B5']
  },
  
  {
    name: 'six-servers',
    serverCount: 6,
    sections: [
      { number: 1, tables: ['B1', 'B2', 'B6', 'A8'] },
      { number: 2, tables: ['A16', 'A9', 'A7'] },
      { number: 3, tables: ['A15', 'A10', 'A6'] },
      { number: 4, tables: ['A14', 'A11', 'A5'] },
      { number: 5, tables: ['A12', 'A3', 'A4'] },
      { number: 6, tables: ['A1', 'A2', 'A13'] }
    ],
    partyTables: ['B3', 'B5']
  }
];

// Helper functions that both frontend and backend can use
const getTableByNumber = (tableNumber) => {
  return RESTAURANT_TABLES.find(t => t.number === tableNumber);
};

const getTablesInSection = (sectionNumber, configName = 'six-servers') => {
  const config = SHIFT_CONFIGURATIONS.find(c => c.name === configName);
  const section = config?.sections.find(s => s.number === sectionNumber);
  return section ? section.tables.map(getTableByNumber).filter(Boolean) : [];
};

const getSectionForTable = (tableNumber, configName = 'six-servers') => {
  const config = SHIFT_CONFIGURATIONS.find(c => c.name === configName);
  const section = config?.sections.find(s => s.tables.includes(tableNumber));
  return section?.number || null;
};

module.exports = {
  RESTAURANT_TABLES,
  SHIFT_CONFIGURATIONS,
  getTableByNumber,
  getTablesInSection,
  getSectionForTable
};