// frontend/src/components/floorplan/FloorPlanView.jsx
// ✅ UPDATED: Now includes party size modal for manual seating
import { WAITER_COLORS } from '../../config/constants';
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import { useShift } from '../../context/ShiftContext';

// ✅ NEW: Party Size Modal Component
const PartySizeModal = ({ isOpen, tableNumber, tableCapacity, onConfirm, onCancel }) => {
  const [partySize, setPartySize] = useState(tableCapacity || 4);

  useEffect(() => {
    if (isOpen) {
      setPartySize(tableCapacity || 4);
    }
  }, [isOpen, tableCapacity]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (partySize >= 1 && partySize <= 20) {
      onConfirm(partySize);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm mx-4">
        <h3 className="text-lg font-semibold mb-4">Seat Party at Table {tableNumber}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Party Size
            </label>
            <input
              type="number"
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
              min="1"
              max="20"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg text-center"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Table capacity: {tableCapacity} people
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Seat Party
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  
  // ✅ NEW: Party size modal state
  const [showPartySizeModal, setShowPartySizeModal] = useState(false);
  const [pendingOccupiedTable, setPendingOccupiedTable] = useState(null);
  
  const gridRef = useRef(null);

  // ✅ Use waiterCount from shift context
  const waiterCount = shiftData.serverCount || 4;
  const activeWaiters = shiftData.serverOrder || [];

  // FIXED: Add proper dependencies to updateTableState
  const updateTableState = useCallback(async (tableId, newState, partyInfo = null) => {
    // Update local state immediately for responsive UI
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            state: newState,
            occupiedBy: newState === 'occupied' ? partyInfo : null
          }
        : table
    ));

    // Persist to backend
    try {
      const token = localStorage.getItem('token');
      const requestBody = { newState };
      
      if (newState === 'occupied' && partyInfo) {
        requestBody.partySize = partyInfo.size;
      }

      await fetch(`http://localhost:3000/api/tables/${tableId}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
    } catch (error) {
      console.error('Failed to persist table state:', error);
    }
  }, []); // No external dependencies needed

  // FIXED: Add proper dependencies to useImperativeHandle
  useImperativeHandle(ref, () => ({
    updateTableState
  }), [updateTableState]);

  const handleRemoveServer = useCallback((serverId) => {
    const result = removeServer(serverId);
    if (result.success) {
      console.log(result.message);
    }
  }, [removeServer]);

  const handleAddServer = useCallback(() => {
    if (!newServerName.trim()) return;
    const result = addServer(newServerName.trim());
    if (result.success) {
      setNewServerName('');
      setShowAddServer(false);
      console.log(result.message);
    }
  }, [newServerName, addServer]);

  const GRID_SIZE = 30;
  const GRID_COLS = 22;
  const GRID_ROWS = 18;

  // ✅ Helper function to get table positions
  const getTablePosition = useCallback((tableNumber) => {
    const positions = {
      'B1': { x: 2, y: 13 }, 'B2': { x: 5, y: 13 }, 'B6': { x: 18, y: 15 }, 'A8': { x: 18, y: 13 },
      'A16': { x: 2, y: 9 }, 'A9': { x: 5, y: 9 }, 'A6': { x: 18, y: 9 }, 'A7': { x: 18, y: 11 },
      'A15': { x: 2, y: 5 }, 'A10': { x: 5, y: 5 }, 'A4': { x: 18, y: 5 }, 'A5': { x: 18, y: 7 },
      'A13': { x: 2, y: 1 }, 'A12': { x: 5, y: 1 }, 'A1': { x: 15, y: 1 }, 'A2': { x: 18, y: 1 },
      'A14': { x: 2, y: 3 }, 'A11': { x: 5, y: 3 }, 'A3': { x: 18, y: 3 },
      'B3': { x: 3, y: 16 }, 'B4': { x: 12, y: 16 }, 'B5': { x: 15, y: 16 }
    };
    return positions[tableNumber] || { x: 0, y: 0 };
  }, []);

  // FIXED: Add proper dependencies to loadTablesFromBackend
  const loadTablesFromBackend = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tables', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      
      const data = await response.json();
      console.log('Loaded tables from backend:', data.tables);
      
      // Transform backend data to match frontend format
      const transformedTables = data.tables.map(table => ({
        id: table.tableNumber,
        number: table.tableNumber,
        section: table.section,
        capacity: table.capacity,
        state: table.state,
        x: getTablePosition(table.tableNumber).x,
        y: getTablePosition(table.tableNumber).y,
        occupiedBy: table.occupiedBy || null
      }));
      
      setTables(transformedTables);
      
    } catch (error) {
      console.error('Error loading tables from backend:', error);
      // Fallback to hardcoded layout if backend fails
      const fallbackTables = [
        { id: 'B1', number: 'B1', section: null, x: 2, y: 13, capacity: 4, state: 'available' },
        { id: 'B2', number: 'B2', section: null, x: 5, y: 13, capacity: 4, state: 'available' },
        { id: 'B6', number: 'B6', section: null, x: 18, y: 15, capacity: 2, state: 'available' },
        { id: 'A8', number: 'A8', section: null, x: 18, y: 13, capacity: 6, state: 'available' },
        { id: 'A16', number: 'A16', section: null, x: 2, y: 9, capacity: 4, state: 'available' },
        { id: 'A9', number: 'A9', section: null, x: 5, y: 9, capacity: 4, state: 'available' },
        { id: 'A6', number: 'A6', section: null, x: 18, y: 9, capacity: 6, state: 'available' },
        { id: 'A7', number: 'A7', section: null, x: 18, y: 11, capacity: 2, state: 'available' },
        { id: 'A15', number: 'A15', section: null, x: 2, y: 5, capacity: 4, state: 'available' },
        { id: 'A10', number: 'A10', section: null, x: 5, y: 5, capacity: 4, state: 'available' },
        { id: 'A4', number: 'A4', section: null, x: 18, y: 5, capacity: 2, state: 'available' },
        { id: 'A5', number: 'A5', section: null, x: 18, y: 7, capacity: 6, state: 'available' },
        { id: 'A13', number: 'A13', section: null, x: 2, y: 1, capacity: 6, state: 'available' },
        { id: 'A12', number: 'A12', section: null, x: 5, y: 1, capacity: 4, state: 'available' },
        { id: 'A1', number: 'A1', section: null, x: 15, y: 1, capacity: 4, state: 'available' },
        { id: 'A2', number: 'A2', section: null, x: 18, y: 1, capacity: 2, state: 'available' },
        { id: 'A14', number: 'A14', section: null, x: 2, y: 3, capacity: 4, state: 'available' },
        { id: 'A11', number: 'A11', section: null, x: 5, y: 3, capacity: 4, state: 'available' },
        { id: 'A3', number: 'A3', section: null, x: 18, y: 3, capacity: 4, state: 'available' },
        { id: 'B3', number: 'B3', section: null, x: 3, y: 16, capacity: 4, state: 'available' },
        { id: 'B4', number: 'B4', section: null, x: 12, y: 16, capacity: 4, state: 'available' },
        { id: 'B5', number: 'B5', section: null, x: 15, y: 16, capacity: 2, state: 'available' }
      ];
      setTables(fallbackTables);
    }
  }, [getTablePosition]); // Add getTablePosition as dependency

  // ✅ Load tables when component mounts
  useEffect(() => {
    loadTablesFromBackend();
    setSelectedTables(new Set());
    setCombinedTables(new Map());
  }, [loadTablesFromBackend]);

  // ✅ Reload tables when shift data changes - FIXED DEPENDENCIES
  useEffect(() => {
    if (shiftData.lastChange) {
      console.log('Shift changed, reloading tables:', shiftData.lastChange);
      loadTablesFromBackend();
    }
  }, [shiftData.lastChange, loadTablesFromBackend]);

  // Helper functions
  const getActiveWaiters = useCallback(() => activeWaiters.map(waiter => waiter.id), [activeWaiters]);
  
  const isTableActive = useCallback((tableId) => {
    const table = tables.find(t => t.id === tableId);
    return table && table.section !== null;
  }, [tables]);

  const getTableWaiter = useCallback((tableId) => {
    const table = tables.find(t => t.id === tableId);
    return table ? table.section : null;
  }, [tables]);

  // FIXED: Function to update matrix when party is manually seated
  const updateMatrixForManualSeating = useCallback((tableId, partySize) => {
    const waiterSection = getTableWaiter(tableId);
    if (!waiterSection) return;

    const waiterIndex = activeWaiters.findIndex(w => w.section === waiterSection);
    if (waiterIndex === -1) return;

    if (props.onUpdateMatrix) {
      console.log('🎯 Manual seating matrix update:', waiterIndex, partySize, 'for table', tableId);
      props.onUpdateMatrix(waiterIndex, partySize, tableId);
    }
  }, [getTableWaiter, activeWaiters, props.onUpdateMatrix]);

  // Drag and drop handlers
  const handleMouseDown = useCallback((e, table) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedTable(table);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

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
  const handleTableClick = useCallback((table, e) => {
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
  }, []);

  // ✅ UPDATED: Modified to handle party size modal for 'occupied' state
  const toggleTableState = useCallback((tableId) => {
    if (!isTableActive(tableId)) return;
    
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const states = ['available', 'assigned', 'occupied'];
    const currentIndex = states.indexOf(table.state);
    const nextState = states[(currentIndex + 1) % states.length];

    // ✅ NEW: If transitioning to 'occupied', show party size modal
    if (nextState === 'occupied') {
      setPendingOccupiedTable(table);
      setShowPartySizeModal(true);
      return;
    }

    // For other state transitions, update normally
    setTables(prev => prev.map(t => 
      t.id === tableId ? { ...t, state: nextState } : t
    ));
  }, [isTableActive, tables]);

  // ✅ NEW: Handle party size confirmation
  const handlePartySizeConfirm = useCallback((partySize) => {
    if (!pendingOccupiedTable) return;

    // Update table state to occupied with party info
    const partyInfo = {
      name: `Party of ${partySize}`,
      size: partySize
    };

    setTables(prev => prev.map(table => 
      table.id === pendingOccupiedTable.id 
        ? { 
            ...table, 
            state: 'occupied', 
            occupiedBy: partyInfo 
          }
        : table
    ));

    // ✅ NEW: Update matrix for fairness tracking
    updateMatrixForManualSeating(pendingOccupiedTable.id, partySize);

    // Clean up modal state
    setShowPartySizeModal(false);
    setPendingOccupiedTable(null);
  }, [pendingOccupiedTable, updateMatrixForManualSeating]);

  // ✅ NEW: Handle modal cancellation
  const handlePartySizeCancel = useCallback(() => {
    setShowPartySizeModal(false);
    setPendingOccupiedTable(null);
  }, []);

// Table combining functionality - FIXED VERSION
  const combineSelectedTables = useCallback(() => {
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
        // FIXED: Store complete table objects instead of just IDs
        originalTables: selectedTableObjects, // This preserves ALL table data
        capacity: totalCapacity,
        x: firstTable.x,
        y: firstTable.y,
        section: firstTable.section
      });
      return newMap;
    });

    // This still removes tables from view (unchanged)
    setTables(prev => prev.filter(table => !selectedTableIds.includes(table.id)));
    setSelectedTables(new Set());
  }, [selectedTables, tables]);

  const separateCombinedTable = useCallback((combinedId) => {
    const combinedTable = combinedTables.get(combinedId);
    if (!combinedTable) return;

    // FIXED: Get original tables from stored data instead of trying to find them
    const originalTables = combinedTable.originalTables || [];

    // Restore the original tables to the tables array
    setTables(prev => [...prev, ...originalTables]);
    
    // Remove the combined table
    setCombinedTables(prev => {
      const newMap = new Map(prev);
      newMap.delete(combinedId);
      return newMap;
    });
  }, [combinedTables]); // Removed 'tables' dependency since we don't need it anymore

  // Styling functions
  const getTableStateColor = useCallback((state, isActive) => {
    if (!isActive) {
      return 'bg-gray-50 border-gray-300 text-gray-400';
    }
    
    switch(state) {
      case 'available': return 'bg-green-100 border-green-400 text-green-800';
      case 'occupied': return 'bg-red-100 border-red-400 text-red-800';
      case 'assigned': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  }, []);

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Floor Plan Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Floor Plan</h2>
            <p className="text-sm text-gray-600">
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

        {/* Waiter Legend */}
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

      {/* Floor Plan Grid */}
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
          {/* Waiter Section Backgrounds */}
          {getActiveWaiters().map(waiterNum => {
            const waiterTables = tables.filter(t => t.section === waiterNum);
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

          {/* Individual Tables */}
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

          {/* Combined Tables */}
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
                <div className="text-[9px] opacity-60">{combined.originalTables?.length || 0} tables</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Plan Stats */}
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

      {/* ✅ NEW: Party Size Modal */}
      <PartySizeModal
        isOpen={showPartySizeModal}
        tableNumber={pendingOccupiedTable?.number}
        tableCapacity={pendingOccupiedTable?.capacity}
        onConfirm={handlePartySizeConfirm}
        onCancel={handlePartySizeCancel}
      />
    </div>
  );
});

FloorPlanView.displayName = 'FloorPlanView';