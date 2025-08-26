// TABLE GRID COMPONENT
const TableGrid = ({ tables, onTableAction, userRole }) => {
  const getStateColor = (state) => {
    switch (state) {
      case 'available': return 'bg-green-100 border-green-500 text-green-800';
      case 'assigned': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'occupied': return 'bg-red-100 border-red-500 text-red-800';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  const getStatsForSection = (section) => {
    const sectionTables = Object.values(tables).filter(t => t.section === section);
    return {
      total: sectionTables.length,
      available: sectionTables.filter(t => t.state === 'available').length,
      assigned: sectionTables.filter(t => t.state === 'assigned').length,
      occupied: sectionTables.filter(t => t.state === 'occupied').length
    };
  };

  const handleTableAction = (tableId, action, extraData = {}) => {
    // MOCK ACTION HANDLER - YOU WILL REPLACE WITH REAL API CALLS
    console.log('Table action:', { tableId, action, extraData });
    onTableAction(tableId, action, extraData);
  };

  return (
    <div className="space-y-6">
      {/* Section Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['A', 'B', 'C'].map(section => {
          const stats = getStatsForSection(section);
          return (
            <div key={section} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Section {section}</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                  <div className="text-gray-500">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.assigned}</div>
                  <div className="text-gray-500">Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
                  <div className="text-gray-500">Occupied</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['A', 'B', 'C'].map(section => (
          <div key={section} className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-xl mb-4 text-center">Section {section}</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(tables)
                .filter(table => table.section === section)
                .map(table => (
                  <div key={table.id} className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStateColor(table.state)} hover:shadow-md`}>
                    <div className="text-center">
                      <div className="text-xl font-bold mb-1">Table {table.tableNumber}</div>
                      <div className="text-sm opacity-75 mb-2">Seats {table.capacity}</div>
                      <div className="text-xs font-medium uppercase tracking-wide mb-3">
                        {table.state}
                      </div>
                      
                      {table.assignedWaiter && (
                        <div className="text-xs mb-2">
                          <div>Waiter: {table.assignedWaiter.name}</div>
                          <div>Party: {table.partySize}</div>
                        </div>
                      )}

                      {/* Action Buttons Based on State and Role */}
                      <div className="space-y-1">
                        {userRole === 'host' && table.state === 'available' && (
                          <button
                            onClick={() => handleTableAction(table.id, 'assign', {
                              waiterId: 'W001',
                              waiterName: 'Mock Waiter',
                              partySize: Math.floor(Math.random() * 6) + 2
                            })}
                            className="w-full px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Assign Party
                          </button>
                        )}
                        
                        {userRole === 'host' && table.state === 'assigned' && (
                          <>
                            <button
                              onClick={() => handleTableAction(table.id, 'seat')}
                              className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 mb-1"
                            >
                              Seat Party
                            </button>
                            <button
                              onClick={() => handleTableAction(table.id, 'cancel')}
                              className="w-full px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        
                        {table.state === 'occupied' && (
                          <button
                            onClick={() => handleTableAction(table.id, 'clear')}
                            className="w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Clear Table
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
