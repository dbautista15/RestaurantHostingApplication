import {WAITER_COLORS} from '../../config/constants';
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import { useShift } from '../../context/ShiftContext';
import { RESTAURANT_LAYOUT } from '../../config/restaurantLayout';

export const FloorPlanView = React.forwardRef((props, ref) => {
  const { shiftData, removeServer, addServer } = useShift();
  
  // State management for floor plan
  const [tables, setTables] = useState([]);
  const [draggedTable, setDraggedTable] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [combinedTables, setCombinedTables] = useState(new Map());
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const gridRef = useRef(null);

  // ✅ Use waiterCount from shift context instead of local state
  const waiterCount = shiftData.serverCount || 4;
  const activeWaiters = shiftData.serverOrder || [];

  // ✅ NEW: Add the simple table update function
  const updateTableState = useCallback((tableId, newState, partyInfo = null) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            state: newState,
            // If seating a party, optionally store party info on the table
            occupiedBy: newState === 'occupied' ? partyInfo : null
          }
        : table
    ));
  }, []);

  // ✅ NEW: Expose the function to parent components
  useImperativeHandle(ref, () => ({
    updateTableState
  }), [updateTableState]);

  const handleRemoveServer = (serverId) => {
    const result = removeServer(serverId);
    if (result.success) {
      console.log(result.message);
    }
  };

  const handleAddServer = () => {
    if (!newServerName.trim()) return;
    const result = addServer(newServerName.trim());
    if (result.success) {
      setNewServerName('');
      setShowAddServer(false);
      console.log(result.message);
    }
  };

  const WAITER_ASSIGNMENTS = {
    1: ['B1', 'B2', 'B6', 'A8'],
    2: ['A16', 'A9', 'A6', 'A7'],  
    3: ['A15', 'A10', 'A4', 'A5'],
    4: ['A13', 'A12', 'A1', 'A2'],
    5: ['A14', 'A11', 'A3']
  };

  const GRID_SIZE = 30;
  const GRID_COLS = 22;
  const GRID_ROWS = 18;

  // 🔧 FIXED: Initialize tables from localStorage first, then fallback to config
  useEffect(() => {
    // Try to load saved table states from localStorage
    try {
      const savedTables = localStorage.getItem('restaurant-table-states');
      if (savedTables) {
        const parsedTables = JSON.parse(savedTables);
        setTables(parsedTables);
        console.log('Loaded table states from localStorage');
      } else {
        // No saved data, use default layout
        setTables(RESTAURANT_LAYOUT);
        console.log('Using default restaurant layout');
      }
    } catch (error) {
      console.error('Error loading table states:', error);
      // If there's an error, fall back to default
      setTables(RESTAURANT_LAYOUT);
    }
    
    setSelectedTables(new Set());
    setCombinedTables(new Map());
  }, []);

  // 🔧 NEW: Save table states to localStorage whenever tables change
  useEffect(() => {
    if (tables.length > 0) {
      try {
        localStorage.setItem('restaurant-table-states', JSON.stringify(tables));
      } catch (error) {
        console.error('Error saving table states:', error);
      }
    }
  }, [tables]);

  // Helper functions
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

  // Drag and drop handlers (unchanged)
  const handleMouseDown = (e, table) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedTable(table);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!draggedTable || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - gridRect.left - dragOffset.x) / GRID_SIZE);
    const y = Math.round((e.clientY - gridRect.top - dragOffset.y) / GRID_SIZE);

    const constrainedX = Math.max(0, Math.min(GRID_COLS - 2, x));
    const constrainedY = Math.max(0, Math.min(GRID_ROWS - 1, y));

    setTables(prev => prev.map(table => 
      table.id === draggedTable.id 
        ? { ...table, x: constrainedX, y: constrainedY }
        : table
    ));
  }, [draggedTable, dragOffset.x, dragOffset.y]);

  const handleMouseUp = useCallback(() => {
    setDraggedTable(null);
  }, []);

  // Set up global mouse events for dragging
  useEffect(() => {
    if (draggedTable) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTable, handleMouseMove, handleMouseUp]);

  // Table interaction handlers
  const handleTableClick = (table, e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setSelectedTables(prev => {
        const newSet = new Set(prev);
        if (newSet.has(table.id)) {
          newSet.delete(table.id);
        } else {
          newSet.add(table.id);
        }
        return newSet;
      });
    }
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

  // Table combining functionality (unchanged)
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

  // Styling functions
  const getTableStateColor = (state, isActive) => {
    if (!isActive) {
      return 'bg-gray-50 border-gray-300 text-gray-400';
    }
    
    switch(state) {
      case 'available': return 'bg-green-100 border-green-400 text-green-800';
      case 'occupied': return 'bg-red-100 border-red-400 text-red-800';
      case 'assigned': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Floor Plan Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Floor Plan</h2>
            <p className="text-sm text-gray-600">
              {/* ✅ Show shift info instead of generic text */}
              {waiterCount} servers working • Drag tables • Double-click to change state
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Server Management Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Servers: {waiterCount}
              </span>
              
              {/* Add Server Button */}
              {!showAddServer ? (
                <button
                  onClick={() => setShowAddServer(true)}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                  disabled={waiterCount >= 7}
                >
                  + Add
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="Server name"
                    className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddServer()}
                  />
                  <button
                    onClick={handleAddServer}
                    className="px-1 py-0.5 bg-green-600 text-white rounded text-xs"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {setShowAddServer(false); setNewServerName('')}}
                    className="px-1 py-0.5 bg-gray-400 text-white rounded text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {/* Remove Server Dropdown */}
              {waiterCount > 1 && (
                <select
                  onChange={(e) => e.target.value && handleRemoveServer(Number(e.target.value))}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                  value=""
                >
                  <option value="">Send Home</option>
                  {activeWaiters.map(waiter => (
                    <option key={waiter.id} value={waiter.id}>
                      {waiter.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedTables.size > 1 && (
              <button
                onClick={combineSelectedTables}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Combine ({selectedTables.size})
              </button>
            )}
          </div>
        </div>

        {/* ✅ Updated Waiter Legend - uses actual waiter data */}
        <div className="flex flex-wrap gap-2">
          {activeWaiters.map(waiter => (
            <div key={waiter.id} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded border"
                style={{ 
                  backgroundColor: WAITER_COLORS.background[waiter.id],
                  borderColor: WAITER_COLORS.border[waiter.id]
                }}
              />
              <span className="text-xs text-gray-700">
                {waiter.name} (Section {waiter.section})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Plan Grid (unchanged except for comments) */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={gridRef}
          className="relative bg-gray-100 rounded-lg mx-auto"
          style={{
            width: GRID_COLS * GRID_SIZE,
            height: GRID_ROWS * GRID_SIZE,
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
          }}
        >
          {/* ✅ Waiter Section Backgrounds - now based on shift data */}
          {getActiveWaiters().map(waiterNum => {
            const waiterTables = tables.filter(t => getTableWaiter(t.id) === waiterNum);
            if (waiterTables.length === 0) return null;

            const minX = Math.min(...waiterTables.map(t => t.x));
            const maxX = Math.max(...waiterTables.map(t => t.x));
            const minY = Math.min(...waiterTables.map(t => t.y));
            const maxY = Math.max(...waiterTables.map(t => t.y));

            return (
              <div
                key={`waiter-section-${waiterNum}`}
                className="absolute rounded border-2 border-dashed opacity-20 pointer-events-none"
                style={{
                  left: (minX - 0.5) * GRID_SIZE,
                  top: (minY - 0.5) * GRID_SIZE,
                  width: (maxX - minX + 2) * GRID_SIZE,
                  height: (maxY - minY + 2) * GRID_SIZE,
                  backgroundColor: WAITER_COLORS.background[waiterNum],
                  borderColor: WAITER_COLORS.border[waiterNum]
                }}
              />
            );
          })}

          {/* Individual Tables (unchanged) */}
          {tables.map((table) => {
            const isActive = isTableActive(table.id);
            const waiterNum = getTableWaiter(table.id);
            
            return (
              <div
                key={table.id}
                className={`absolute cursor-move select-none transition-all duration-200 ${getTableStateColor(table.state, isActive)} ${
                  selectedTables.has(table.id) ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                } ${draggedTable?.id === table.id ? 'z-50 shadow-lg scale-105' : 'hover:shadow-md'} ${
                  !isActive ? 'opacity-50' : ''
                }`}
                style={{
                  left: table.x * GRID_SIZE + 2,
                  top: table.y * GRID_SIZE + 2,
                  width: GRID_SIZE - 4,
                  height: GRID_SIZE - 4,
                }}
                onMouseDown={(e) => isActive ? handleMouseDown(e, table) : null}
                onClick={(e) => isActive ? handleTableClick(table, e) : null}
                onDoubleClick={() => isActive ? toggleTableState(table.id) : null}
              >
                <div className="w-full h-full rounded border-2 flex flex-col items-center justify-center text-xs font-medium p-1">
                  <div className="font-bold">{table.number}</div>
                  <div className="text-[10px] opacity-75">{table.capacity}</div>
                  {/* ✅ NEW: Show party name if table is occupied by someone */}
                  {table.occupiedBy && (
                    <div className="text-[8px] opacity-80 text-center">
                      {table.occupiedBy.name}
                    </div>
                  )}
                  {isActive && waiterNum && (
                    <div className="text-[9px] opacity-60">W{waiterNum}</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Combined Tables (unchanged) */}
          {Array.from(combinedTables.values()).map((combined) => (
            <div
              key={combined.id}
              className="absolute cursor-move select-none bg-purple-100 border-2 border-purple-400 text-purple-800 rounded shadow-md hover:shadow-lg transition-all duration-200"
              style={{
                left: combined.x * GRID_SIZE + 2,
                top: combined.y * GRID_SIZE + 2,
                width: GRID_SIZE * 2 - 4,
                height: GRID_SIZE - 4,
              }}
              onDoubleClick={() => separateCombinedTable(combined.id)}
            >
              <div className="w-full h-full rounded flex flex-col items-center justify-center text-xs font-medium p-1">
                <div className="font-bold">Combined</div>
                <div className="text-[10px] opacity-75">Cap: {combined.capacity}</div>
                <div className="text-[9px] opacity-60">{combined.tableIds.length} tables</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Plan Stats (unchanged) */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              {tables.filter(t => isTableActive(t.id) && t.state === 'available').length}
            </div>
            <div className="text-xs text-gray-600">Available</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {tables.filter(t => isTableActive(t.id) && t.state === 'assigned').length}
            </div>
            <div className="text-xs text-gray-600">Assigned</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {tables.filter(t => isTableActive(t.id) && t.state === 'occupied').length}
            </div>
            <div className="text-xs text-gray-600">Occupied</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {combinedTables.size}
            </div>
            <div className="text-xs text-gray-600">Combined</div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ✅ NEW: Add display name for debugging
FloorPlanView.displayName = 'FloorPlanView';