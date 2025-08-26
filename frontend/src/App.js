import React, { useState, useEffect } from 'react';

// 🎯 COMPLETE WORKING FRONTEND WITH MOCK DATA
// You can interact with this immediately while you build the real backend
// All API calls are mocked - YOU will replace with real implementations

// MOCK DATA (Replace with your real API calls)
const MOCK_TABLES = {
  1: { id: 1, tableNumber: 1, section: 'A', capacity: 4, state: 'available', assignedWaiter: null, partySize: null },
  2: { id: 2, tableNumber: 2, section: 'A', capacity: 6, state: 'assigned', assignedWaiter: { name: 'Alice', clockNumber: 'W001' }, partySize: 4 },
  3: { id: 3, tableNumber: 3, section: 'A', capacity: 2, state: 'occupied', assignedWaiter: { name: 'Bob', clockNumber: 'W002' }, partySize: 2 },
  4: { id: 4, tableNumber: 4, section: 'A', capacity: 8, state: 'available', assignedWaiter: null, partySize: null },
  5: { id: 5, tableNumber: 5, section: 'B', capacity: 4, state: 'available', assignedWaiter: null, partySize: null },
  6: { id: 6, tableNumber: 6, section: 'B', capacity: 6, state: 'assigned', assignedWaiter: { name: 'Carol', clockNumber: 'W003' }, partySize: 3 },
  7: { id: 7, tableNumber: 7, section: 'B', capacity: 4, state: 'occupied', assignedWaiter: { name: 'Dave', clockNumber: 'W004' }, partySize: 5 },
  8: { id: 8, tableNumber: 8, section: 'B', capacity: 2, state: 'available', assignedWaiter: null, partySize: null },
  9: { id: 9, tableNumber: 9, section: 'C', capacity: 6, state: 'available', assignedWaiter: null, partySize: null },
  10: { id: 10, tableNumber: 10, section: 'C', capacity: 4, state: 'assigned', assignedWaiter: { name: 'Eve', clockNumber: 'W005' }, partySize: 2 },
  11: { id: 11, tableNumber: 11, section: 'C', capacity: 8, state: 'occupied', assignedWaiter: { name: 'Frank', clockNumber: 'W006' }, partySize: 6 },
  12: { id: 12, tableNumber: 12, section: 'C', capacity: 4, state: 'available', assignedWaiter: null, partySize: null }
};

const MOCK_WAITLIST = [
  { id: 1, partyName: 'Johnson', partySize: 4, phoneNumber: '555-0123', estimatedWait: 15, addedAt: new Date(Date.now() - 10 * 60000) },
  { id: 2, partyName: 'Smith', partySize: 2, phoneNumber: '555-0456', estimatedWait: 25, addedAt: new Date(Date.now() - 5 * 60000) },
  { id: 3, partyName: 'Williams', partySize: 6, phoneNumber: '555-0789', estimatedWait: 35, addedAt: new Date() }
];

const MOCK_ACTIVITY = [
  { id: 1, eventType: 'STATE_TRANSITION', tableNumber: 3, fromState: 'assigned', toState: 'occupied', user: { name: 'Host Alice' }, timestamp: new Date(Date.now() - 2 * 60000) },
  { id: 2, eventType: 'ASSIGNMENT', tableNumber: 6, user: { name: 'Host Alice' }, waiter: 'Carol', partySize: 3, timestamp: new Date(Date.now() - 5 * 60000) },
  { id: 3, eventType: 'STATE_TRANSITION', tableNumber: 7, fromState: 'available', toState: 'assigned', user: { name: 'Host Bob' }, timestamp: new Date(Date.now() - 8 * 60000) }
];

// LOGIN COMPONENT
const LoginForm = ({ onLogin }) => {
  const [clockNumber, setClockNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // MOCK LOGIN - YOU WILL REPLACE WITH REAL API CALL
    setTimeout(() => {
      if (clockNumber && password) {
        const mockUser = {
          id: '1',
          name: clockNumber.startsWith('H') ? 'Host User' : 'Waiter User',
          role: clockNumber.startsWith('H') ? 'host' : 'waiter',
          clockNumber,
          section: clockNumber.startsWith('W') ? 'A' : null
        };
        onLogin(mockUser);
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Restaurant Seating System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage tables and seating
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Clock Number (H001 for host, W001 for waiter)"
                value={clockNumber}
                onChange={(e) => setClockNumber(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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

// WAITLIST COMPONENT
const WaitlistPanel = ({ waitlist, onWaitlistAction, userRole }) => {
  const [newParty, setNewParty] = useState({ name: '', size: '', phone: '' });

  const handleAddParty = (e) => {
    e.preventDefault();
    if (newParty.name && newParty.size) {
      onWaitlistAction('add', {
        partyName: newParty.name,
        partySize: parseInt(newParty.size),
        phoneNumber: newParty.phone
      });
      setNewParty({ name: '', size: '', phone: '' });
    }
  };

  const formatWaitTime = (addedAt) => {
    const minutes = Math.floor((new Date() - new Date(addedAt)) / 60000);
    return `${minutes} min`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Waitlist ({waitlist.length})</h3>
      
      {userRole === 'host' && (
        <form onSubmit={handleAddParty} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Add New Party</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Party Name"
              value={newParty.name}
              onChange={(e) => setNewParty({...newParty, name: e.target.value})}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Party Size"
              min="1"
              max="10"
              value={newParty.size}
              onChange={(e) => setNewParty({...newParty, size: e.target.value})}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={newParty.phone}
              onChange={(e) => setNewParty({...newParty, phone: e.target.value})}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add to Waitlist
          </button>
        </form>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {waitlist.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8">No parties waiting</p>
        ) : (
          waitlist.map((party, index) => (
            <div key={party.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{party.partyName}</div>
                  <div className="text-sm text-gray-500">
                    Party of {party.partySize} • Waiting {formatWaitTime(party.addedAt)}
                  </div>
                  {party.phoneNumber && (
                    <div className="text-xs text-gray-400">{party.phoneNumber}</div>
                  )}
                </div>
              </div>
              
              {userRole === 'host' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onWaitlistAction('seat', party)}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Seat Now
                  </button>
                  <button
                    onClick={() => onWaitlistAction('remove', party)}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ACTIVITY FEED COMPONENT
const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (eventType) => {
    switch (eventType) {
      case 'STATE_TRANSITION': return '🔄';
      case 'ASSIGNMENT': return '👤';
      case 'WAITLIST': return '📝';
      default: return '📊';
    }
  };

  const getActivityDescription = (activity) => {
    switch (activity.eventType) {
      case 'STATE_TRANSITION':
        return `Table ${activity.tableNumber} changed from ${activity.fromState} to ${activity.toState}`;
      case 'ASSIGNMENT':
        return `Table ${activity.tableNumber} assigned to ${activity.waiter} (party of ${activity.partySize})`;
      default:
        return 'Activity occurred';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 text-lg">
                {getActivityIcon(activity.eventType)}
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  {getActivityDescription(activity)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  by {activity.user.name} at {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// MAIN APP COMPONENT
const RestaurantApp = () => {
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState(MOCK_TABLES);
  const [waitlist, setWaitlist] = useState(MOCK_WAITLIST);
  const [activities, setActivities] = useState(MOCK_ACTIVITY);
  const [connectionStatus, setConnectionStatus] = useState('connected'); // connected, disconnected, connecting

  // MOCK REAL-TIME UPDATES
  useEffect(() => {
    if (!user) return;

    // Simulate real-time updates every 5 seconds
    const interval = setInterval(() => {
      // Random table state changes
      if (Math.random() < 0.3) {
        const tableIds = Object.keys(tables);
        const randomTableId = tableIds[Math.floor(Math.random() * tableIds.length)];
        const table = tables[randomTableId];
        
        if (table && table.state === 'occupied' && Math.random() < 0.5) {
          handleTableAction(parseInt(randomTableId), 'clear');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, tables]);

  const handleLogin = (userData) => {
    setUser(userData);
    console.log('User logged in:', userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // MOCK TABLE ACTIONS - YOU WILL REPLACE WITH REAL API CALLS
  const handleTableAction = (tableId, action, extraData = {}) => {
    setTables(prev => {
      const newTables = { ...prev };
      const table = newTables[tableId];
      
      if (!table) return prev;
      
      const newActivity = {
        id: Date.now(),
        timestamp: new Date(),
        user: { name: user.name },
        tableNumber: table.tableNumber
      };

      switch (action) {
        case 'assign':
          newTables[tableId] = {
            ...table,
            state: 'assigned',
            assignedWaiter: { name: extraData.waiterName, clockNumber: extraData.waiterId },
            partySize: extraData.partySize,
            assignedAt: new Date()
          };
          newActivity.eventType = 'ASSIGNMENT';
          newActivity.waiter = extraData.waiterName;
          newActivity.partySize = extraData.partySize;
          break;
          
        case 'seat':
          newTables[tableId] = { ...table, state: 'occupied' };
          newActivity.eventType = 'STATE_TRANSITION';
          newActivity.fromState = 'assigned';
          newActivity.toState = 'occupied';
          break;
          
        case 'clear':
          newTables[tableId] = {
            ...table,
            state: 'available',
            assignedWaiter: null,
            partySize: null,
            assignedAt: null
          };
          newActivity.eventType = 'STATE_TRANSITION';
          newActivity.fromState = 'occupied';
          newActivity.toState = 'available';
          break;
          
        case 'cancel':
          newTables[tableId] = {
            ...table,
            state: 'available',
            assignedWaiter: null,
            partySize: null,
            assignedAt: null
          };
          newActivity.eventType = 'STATE_TRANSITION';
          newActivity.fromState = 'assigned';
          newActivity.toState = 'available';
          break;
      }
      
      // Add to activity feed
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
      
      return newTables;
    });
  };

  // MOCK WAITLIST ACTIONS - YOU WILL REPLACE WITH REAL API CALLS
  const handleWaitlistAction = (action, data) => {
    switch (action) {
      case 'add':
        const newEntry = {
          id: Date.now(),
          ...data,
          estimatedWait: Math.floor(Math.random() * 30) + 10,
          addedAt: new Date()
        };
        setWaitlist(prev => [...prev, newEntry]);
        break;
        
      case 'remove':
        setWaitlist(prev => prev.filter(p => p.id !== data.id));
        break;
        
      case 'seat':
        setWaitlist(prev => prev.filter(p => p.id !== data.id));
        // Could also automatically assign to available table
        break;
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Seating</h1>
              <div className={`ml-4 px-2 py-1 rounded-full text-xs ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 
                connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {connectionStatus}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {user.name} ({user.role})
                {user.section && ` - Section ${user.section}`}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Table Grid - Takes up 3 columns */}
            <div className="xl:col-span-3">
              <TableGrid 
                tables={tables}
                onTableAction={handleTableAction}
                userRole={user.role}
              />
            </div>
            
            {/* Sidebar - Takes up 1 column */}
            <div className="space-y-6">
              <WaitlistPanel 
                waitlist={waitlist}
                onWaitlistAction={handleWaitlistAction}
                userRole={user.role}
              />
              
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantApp;