import { useState, useEffect } from 'react';
import { RESTAURANT_LAYOUT, WAITER_ASSIGNMENTS } from '../config/restaurantLayout';

export const useFloorPlan = () => {
  const [waiterCount, setWaiterCount] = useState(4);
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [combinedTables, setCombinedTables] = useState(new Map());

  useEffect(() => {
    setTables(RESTAURANT_LAYOUT);
    setSelectedTables(new Set());
    setCombinedTables(new Map());
  }, []);

  const getActiveWaiters = () => Array.from({length: waiterCount}, (_, i) => i + 1);
  
  const isTableActive = (tableId) => {
    return getActiveWaiters().some(waiterId => 
      WAITER_ASSIGNMENTS[waiterId]?.includes(tableId)
    );
  };

  const getTableWaiter = (tableId) => {
    for (let waiterId = 1; waiterId <= 5; waiterId++) {
      if (WAITER_ASSIGNMENTS[waiterId]?.includes(tableId)) {
        return waiterId;
      }
    }
    return null;
  };

  const toggleTableState = (tableId) => {
    if (!isTableActive(tableId)) return;
    
    setTables(prev => prev.map(table => {
      if (table.id === tableId) {
        const states = ['available', 'assigned', 'occupied'];
        const currentIndex = states.indexOf(table.state);
        const nextIndex = (currentIndex + 1) % states.length;
        return { ...table, state: states[nextIndex] };
      }
      return table;
    }));
  };

  const combineSelectedTables = () => {
    if (selectedTables.size < 2) return;

    const selectedTableIds = Array.from(selectedTables);
    const combinedId = `combined-${Date.now()}`;
    const selectedTableObjects = tables.filter(t => selectedTableIds.includes(t.id));
    
    const totalCapacity = selectedTableObjects.reduce((sum, table) => sum + table.capacity, 0);
    const firstTable = selectedTableObjects[0];
    
    setCombinedTables(prev => {
      const newMap = new Map(prev);
      newMap.set(combinedId, {
        id: combinedId,
        tableIds: selectedTableIds,
        capacity: totalCapacity,
        x: firstTable.x,
        y: firstTable.y,
        section: firstTable.section
      });
      return newMap;
    });

    setTables(prev => prev.filter(table => !selectedTableIds.includes(table.id)));
    setSelectedTables(new Set());
  };

  const separateCombinedTable = (combinedId) => {
    const combinedTable = combinedTables.get(combinedId);
    if (!combinedTable) return;

    const originalTables = RESTAURANT_LAYOUT.filter(table => 
      combinedTable.tableIds.includes(table.id)
    );

    setTables(prev => [...prev, ...originalTables]);
    setCombinedTables(prev => {
      const newMap = new Map(prev);
      newMap.delete(combinedId);
      return newMap;
    });
  };

  const updateTablePosition = (tableId, x, y) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, x, y } : table
    ));
  };

  return {
    waiterCount,
    setWaiterCount,
    tables,
    selectedTables,
    setSelectedTables,
    combinedTables,
    getActiveWaiters,
    isTableActive,
    getTableWaiter,
    toggleTableState,
    combineSelectedTables,
    separateCombinedTable,
    updateTablePosition
  };
};
