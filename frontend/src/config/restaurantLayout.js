export const RESTAURANT_LAYOUT = [
  { id: 'B1', number: 'B1', section: 1, x: 2, y: 13, capacity: 4, state: 'available' },
  { id: 'B2', number: 'B2', section: 1, x: 5, y: 13, capacity: 4, state: 'available' },
  { id: 'B6', number: 'B6', section: 1, x: 18, y: 15, capacity: 2, state: 'available' },
  { id: 'A8', number: 'A8', section: 1, x: 18, y: 13, capacity: 6, state: 'available' },
  { id: 'A16', number: 'A16', section: 2, x: 2, y: 9, capacity: 4, state: 'available' },
  { id: 'A9', number: 'A9', section: 2, x: 5, y: 9, capacity: 4, state: 'available' },
  { id: 'A6', number: 'A6', section: 2, x: 18, y: 9, capacity: 6, state: 'available' },
  { id: 'A7', number: 'A7', section: 2, x: 18, y: 11, capacity: 2, state: 'available' },
  { id: 'A15', number: 'A15', section: 3, x: 2, y: 5, capacity: 4, state: 'available' },
  { id: 'A10', number: 'A10', section: 3, x: 5, y: 5, capacity: 4, state: 'available' },
  { id: 'A4', number: 'A4', section: 3, x: 18, y: 5, capacity: 2, state: 'available' },
  { id: 'A5', number: 'A5', section: 3, x: 18, y: 7, capacity: 6, state: 'available' },
  { id: 'A13', number: 'A13', section: 4, x: 2, y: 1, capacity: 6, state: 'available' },
  { id: 'A12', number: 'A12', section: 4, x: 5, y: 1, capacity: 4, state: 'available' },
  { id: 'A1', number: 'A1', section: 4, x: 15, y: 1, capacity: 4, state: 'available' },
  { id: 'A2', number: 'A2', section: 4, x: 18, y: 1, capacity: 2, state: 'available' },
  { id: 'A14', number: 'A14', section: 5, x: 2, y: 3, capacity: 4, state: 'available' },
  { id: 'A11', number: 'A11', section: 5, x: 5, y: 3, capacity: 4, state: 'available' },
  { id: 'A3', number: 'A3', section: 5, x: 18, y: 3, capacity: 4, state: 'available' },
  { id: 'B3', number: 'B3', section: 6, x: 3, y: 16, capacity: 4, state: 'available' },
  { id: 'B4', number: 'B4', section: 6, x: 12, y: 16, capacity: 4, state: 'available' },
  { id: 'B5', number: 'B5', section: 6, x: 15, y: 16, capacity: 2, state: 'available' },
];

export const WAITER_ASSIGNMENTS = {
  1: ['B1', 'B2', 'B6', 'A8'],
  2: ['A16', 'A9', 'A6', 'A7'],  
  3: ['A15', 'A10', 'A4', 'A5'],
  4: ['A13', 'A12', 'A1', 'A2'],
  5: ['A14', 'A11', 'A3']
};