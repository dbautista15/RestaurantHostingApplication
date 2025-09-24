// frontend/src/components/floorplan/FloorPlanView.jsx - PURE PRESENTATION VERSION
import React, { useState, useRef, useCallback, useImperativeHandle } from 'react';

// ✅ SIMPLE Modal Component (UI only - no business logic)
const PartySizeModal = ({ isOpen, tableNumber, onConfirm, onCancel }) => {
  const [partySize, setPartySize] = useState(4);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm mx-4">
        <h3 className="text-lg font-semibold mb-4">Seat Party at Table {tableNumber}</h3>
        
        <form onSubmit={(e) => { e.preventDefault(); onConfirm(partySize); }}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Party Size
            </label>
            <input
              type="number"
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
              min="1" max="20"
              className="w-full p-3 border border-gray-300 rounded-lg text-center"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button" onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Seat Party
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 🎯 MAIN Component - Now truly "dumb" presentation only
export const FloorPlanView = React.forwardRef(({ 
  tables = [],           // 🎯 WHY: Tables come from backend with ALL data (position, state, waiter)
  gridConfig = {},       // 🎯 WHY: Grid config comes from backend (could change per location)
  onTableClick,          // 🎯 WHY: Just report clicks, don't decide what happens
  onTableDrop,           // 🎯 WHY: Just report drop position, backend validates
  onRequestPartySize     // 🎯 WHY: Let parent/backend decide when to show modal
}, ref) => {
  
  // 🎯 MINIMAL State - Only UI concerns, no business data
  const [draggedTable, setDraggedTable] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPartySizeModal, setShowPartySizeModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  const gridRef = useRef(null);
  
  // 🎯 WHY: Grid config from backend allows different restaurants/layouts
  const { 
    size = 30, 
    cols = 22, 
    rows = 18,
    snapToGrid = true 
  } = gridConfig;

  // 🎯 EXPOSE only UI update methods (no business logic)
  useImperativeHandle(ref, () => ({
    // Parent can trigger visual updates based on backend responses
    highlightTable: (tableId) => {
      // Pure visual feedback
      const element = document.getElementById(`table-${tableId}`);
      if (element) {
        element.classList.add('ring-4', 'ring-blue-500');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-blue-500');
        }, 2000);
      }
    },
    showError: (tableId, message) => {
      // Pure visual feedback for errors
      console.log(`Table ${tableId} error: ${message}`);
      // Could show a tooltip or shake animation
    }
  }), []);

  // ✅ PURE UI Logic - Drag and Drop (no business validation)
  const handleMouseDown = useCallback((e, table) => {
    // 🎯 WHY: Let backend decide if table is draggable
    if (!table.isDraggable) return;
    
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
    const x = Math.round((e.clientX - gridRect.left - dragOffset.x) / size);
    const y = Math.round((e.clientY - gridRect.top - dragOffset.y) / size);

    // Just update visual position - backend will validate on drop
    const element = document.getElementById(`table-${draggedTable.id}`);
    if (element) {
      element.style.left = `${x * size + 2}px`;
      element.style.top = `${y * size + 2}px`;
    }
  }, [draggedTable, dragOffset, size]);

  const handleMouseUp = useCallback((e) => {
    if (!draggedTable || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - gridRect.left - dragOffset.x) / size);
    const y = Math.round((e.clientY - gridRect.top - dragOffset.y) / size);

    // 🎯 WHY: Just report the drop - backend decides if valid
    if (onTableDrop) {
      onTableDrop(draggedTable.id, { x, y });
    }

    setDraggedTable(null);
  }, [draggedTable, dragOffset, size, onTableDrop]);

  // 🎯 SIMPLE Table Click Handler (no business logic)
  const handleTableClick = useCallback((table) => {
    // 🎯 WHY: Don't decide what click means - just report it
    if (onTableClick) {
      onTableClick(table.id, table);
    }
  }, [onTableClick]);

  // 🎯 SIMPLE Double Click Handler
  const handleTableDoubleClick = useCallback((table) => {
    // 🎯 WHY: Backend tells us if we need party size
    if (onRequestPartySize) {
      const needsPartySize = onRequestPartySize(table.id);
      if (needsPartySize) {
        setPendingAction({ tableId: table.id, tableNumber: table.number });
        setShowPartySizeModal(true);
      } else {
        // Backend handles the action directly
        handleTableClick(table);
      }
    }
  }, [onRequestPartySize, handleTableClick]);

  // 🎯 MODAL Handlers (just pass data up)
  const handlePartySizeConfirm = useCallback((partySize) => {
    if (pendingAction && onTableClick) {
      // 🎯 WHY: Send the click with metadata - backend decides what to do
      onTableClick(pendingAction.tableId, { partySize });
    }
    setShowPartySizeModal(false);
    setPendingAction(null);
  }, [pendingAction, onTableClick]);

  const handleModalCancel = useCallback(() => {
    setShowPartySizeModal(false);
    setPendingAction(null);
  }, []);

  // 🎯 DRAG Event Listeners
  React.useEffect(() => {
    if (draggedTable) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTable, handleMouseMove, handleMouseUp]);

  // 🎯 DISPLAY Helpers (pure functions)
  const getTableClasses = (table) => {
    // 🎯 WHY: All styling decisions come from backend data
    const baseClasses = "absolute cursor-pointer select-none transition-all duration-200 rounded border-2 flex flex-col items-center justify-center text-xs font-medium p-1";
    
    // Use backend-provided style hints
    if (table.styleHint) {
      return `${baseClasses} ${table.styleHint}`;
    }
    
    // Fallback to basic styling based on state
    const stateClasses = {
      available: 'bg-green-100 border-green-400 text-green-800',
      occupied: 'bg-red-100 border-red-400 text-red-800',
      assigned: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      inactive: 'bg-gray-50 border-gray-300 text-gray-400 opacity-50'
    };
    
    return `${baseClasses} ${stateClasses[table.state] || stateClasses.inactive} ${
      draggedTable?.id === table.id ? 'z-50 shadow-lg scale-105' : 'hover:shadow-md'
    }`;
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 🎯 SIMPLE Header - Display only */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Floor Plan</h2>
            <p className="text-sm text-gray-600">
              {tables.filter(t => t.isActive).length} active tables
              {draggedTable && " • Dragging " + draggedTable.number}
            </p>
          </div>
        </div>

        {/* 🎯 SIMPLE Legend - Data from backend */}
        <div className="flex flex-wrap gap-2">
          {tables
            .filter(t => t.waiterInfo)
            .reduce((acc, table) => {
              const key = table.waiterInfo.id;
              if (!acc.some(w => w.id === key)) {
                acc.push(table.waiterInfo);
              }
              return acc;
            }, [])
            .map(waiter => (
              <div key={waiter.id} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded border"
                  style={{ 
                    backgroundColor: waiter.color?.bg || '#e5e7eb',
                    borderColor: waiter.color?.border || '#9ca3af'
                  }}
                />
                <span className="text-xs text-gray-700">
                  {waiter.name}
                </span>
              </div>
            ))
          }
        </div>
      </div>

      {/* 🎯 MAIN Floor Plan Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={gridRef}
          className="relative bg-gray-100 rounded-lg mx-auto"
          style={{
            width: cols * size,
            height: rows * size,
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${size}px ${size}px`
          }}
        >
          {/* 🎯 SECTION Backgrounds - Visual only, from backend data */}
          {tables
            .filter(t => t.sectionInfo)
            .reduce((acc, table) => {
              const key = table.sectionInfo.id;
              if (!acc.find(s => s.id === key)) {
                acc.push({
                  ...table.sectionInfo,
                  tables: tables.filter(t => t.sectionInfo?.id === key)
                });
              }
              return acc;
            }, [])
            .map(section => {
              const sectionTables = section.tables;
              const minX = Math.min(...sectionTables.map(t => t.position.x));
              const maxX = Math.max(...sectionTables.map(t => t.position.x));
              const minY = Math.min(...sectionTables.map(t => t.position.y));
              const maxY = Math.max(...sectionTables.map(t => t.position.y));

              return (
                <div
                  key={`section-${section.id}`}
                  className="absolute rounded border-2 border-dashed opacity-20 pointer-events-none"
                  style={{
                    left: (minX - 0.5) * size,
                    top: (minY - 0.5) * size,
                    width: (maxX - minX + 2) * size,
                    height: (maxY - minY + 2) * size,
                    backgroundColor: section.color?.bg || 'transparent',
                    borderColor: section.color?.border || '#e5e7eb'
                  }}
                />
              );
            })
          }

          {/* 🎯 TABLE Rendering - Pure display from backend data */}
          {tables.map((table) => (
            <div
              key={table.id}
              id={`table-${table.id}`}
              className={getTableClasses(table)}
              style={{
                left: table.position.x * size + 2,
                top: table.position.y * size + 2,
                width: size - 4,
                height: size - 4,
                ...(draggedTable?.id === table.id ? { position: 'fixed' } : {})
              }}
              onMouseDown={(e) => handleMouseDown(e, table)}
              onClick={() => handleTableClick(table)}
              onDoubleClick={() => handleTableDoubleClick(table)}
            >
              <div className="font-bold">{table.number}</div>
              <div className="text-[10px] opacity-75">
                {table.displayCapacity || table.capacity}
              </div>
              {table.displayText && (
                <div className="text-[8px] opacity-80 text-center">
                  {table.displayText}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 🎯 SIMPLE Stats - All calculated by backend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          {tables
            .reduce((acc, table) => {
              if (table.stats) {
                Object.entries(table.stats).forEach(([key, value]) => {
                  if (!acc[key]) acc[key] = { value: 0, color: 'gray', label: key };
                  acc[key].value += value;
                  acc[key].color = table.stats.color || 'gray';
                });
              }
              return acc;
            }, {})
            .slice(0, 3)
            .map((stat, index) => (
              <div key={index}>
                <div className={`text-lg font-bold text-${stat.color}-600`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))
          }
        </div>
      </div>

      {/* 🎯 MODAL */}
      <PartySizeModal
        isOpen={showPartySizeModal}
        tableNumber={pendingAction?.tableNumber}
        onConfirm={handlePartySizeConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
});

FloorPlanView.displayName = 'FloorPlanView';

/*
🎯 WHAT WE REMOVED (Business Logic Now in Backend):

❌ Section assignment calculations
❌ Waiter-to-table mapping logic
❌ Table state transition rules (available → occupied)
❌ Validation of what tables can be dragged
❌ Capacity checking
❌ Decision of when to show party size modal
❌ State change logic on double-click
❌ Hardcoded grid configuration
❌ Hardcoded waiter colors
❌ Table combination logic

🎯 WHAT WE KEPT (Pure UI Concerns):

✅ Drag and drop visual feedback
✅ Mouse event handling
✅ Modal display management
✅ Visual styling application
✅ Grid rendering
✅ Click event reporting

🎯 HOW IT WORKS NOW:

1. Backend sends complete table data with:
   - position: { x, y }
   - state: 'available' | 'occupied' | etc
   - waiterInfo: { id, name, color }
   - sectionInfo: { id, color }
   - styleHint: 'extra CSS classes'
   - isDraggable: boolean
   - displayText: what to show
   - stats: for the footer

2. Frontend just:
   - Renders what it's told
   - Reports user interactions
   - Provides visual feedback

3. Parent component (Dashboard) handles:
   - onTableClick → calls backend API
   - onTableDrop → validates with backend
   - onRequestPartySize → asks backend if needed

This is now a truly "dumb" component! 🎉
*/