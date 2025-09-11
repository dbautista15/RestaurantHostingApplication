import React, { useState, useEffect } from 'react';

// MOCK DATA (Keep existing mock data for table functionality)
const MOCK_TABLES = {
  1: { id: 1, tableNumber: 1, section: 'A', capacity: 4, state: 'available', assignedWaiter: null, partySize: null },
  2: { id: 2, tableNumber: 2, section: 'A', capacity: 6, state: 'assigned', assignedWaiter: { userName: 'Alice', clockInNumber: 'W001' }, partySize: 4 },
  3: { id: 3, tableNumber: 3, section: 'A', capacity: 2, state: 'occupied', assignedWaiter: { userName: 'Bob', clockInNumber: 'W002' }, partySize: 2 },
  4: { id: 4, tableNumber: 4, section: 'A', capacity: 8, state: 'available', assignedWaiter: null, partySize: null },
  5: { id: 5, tableNumber: 5, section: 'B', capacity: 4, state: 'available', assignedWaiter: null, partySize: null },
  6: { id: 6, tableNumber: 6, section: 'B', capacity: 6, state: 'assigned', assignedWaiter: { userName: 'Carol', clockInNumber: 'W003' }, partySize: 3 },
  7: { id: 7, tableNumber: 7, section: 'B', capacity: 4, state: 'occupied', assignedWaiter: { userName: 'Dave', clockInNumber: 'W004' }, partySize: 5 },
  8: { id: 8, tableNumber: 8, section: 'B', capacity: 2, state: 'available', assignedWaiter: null, partySize: null },
  9: { id: 9, tableNumber: 9, section: 'C', capacity: 6, state: 'available', assignedWaiter: null, partySize: null },
  10: { id: 10, tableNumber: 10, section: 'C', capacity: 4, state: 'assigned', assignedWaiter: { userName: 'Eve', clockInNumber: 'W005' }, partySize: 2 },
  11: { id: 11, tableNumber: 11, section: 'C', capacity: 8, state: 'occupied', assignedWaiter: { userName: 'Frank', clockInNumber: 'W006' }, partySize: 6 },
  12: { id: 12, tableNumber: 12, section: 'C', capacity: 4, state: 'available', assignedWaiter: null, partySize: null }
};

const MOCK_WAITLIST = [
  { id: 1, partyName: 'Johnson', partySize: 4, phoneNumber: '555-0123', estimatedWait: 15, addedAt: new Date(Date.now() - 10 * 60000) },
  { id: 2, partyName: 'Smith', partySize: 2, phoneNumber: '555-0456', estimatedWait: 25, addedAt: new Date(Date.now() - 5 * 60000) },
  { id: 3, partyName: 'Williams', partySize: 6, phoneNumber: '555-0789', estimatedWait: 35, addedAt: new Date() }
];

const MOCK_ACTIVITY = [
  { id: 1, eventType: 'STATE_TRANSITION', tableNumber: 3, fromState: 'assigned', toState: 'occupied', user: { userName: 'Host Alice' }, timestamp: new Date(Date.now() - 2 * 60000) },
  { id: 2, eventType: 'ASSIGNMENT', tableNumber: 6, user: { userName: 'Host Alice' }, waiter: 'Carol', partySize: 3, timestamp: new Date(Date.now() - 5 * 60000) },
  { id: 3, eventType: 'STATE_TRANSITION', tableNumber: 7, fromState: 'available', toState: 'assigned', user: { userName: 'Host Bob' }, timestamp: new Date(Date.now() - 8 * 60000) }
];

// AUTHENTICATION COMPONENT WITH LOGIN AND REGISTRATION
const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Login form state
  const [loginData, setLoginData] = useState({
    clockInNumber: '',
    password: ''
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    clockInNumber: '',
    userName: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Login successful! Welcome back.', 'success');
        // Convert response to expected format for existing app
        const userData = {
          id: data.user.id,
          userName: data.user.userName || `User ${loginData.clockInNumber}`,
          role: data.user.role,
          clockInNumber: loginData.clockInNumber,
          section: data.user.section,
          token: data.token
        };
        
        setTimeout(() => {
          onLogin(userData);
        }, 1000);
      } else {
        showMessage(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Client-side validation
    if (registerData.password !== registerData.confirmPassword) {
      showMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      showMessage('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (!registerData.clockInNumber || !registerData.userName || !registerData.role) {
      showMessage('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clockInNumber: parseInt(registerData.clockInNumber),
          userName: registerData.userName,
          role: registerData.role,
          password: registerData.password,
          // Note: Section is not included as it will be assigned during shift start
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Account created successfully! Logging you in...', 'success');
        
        // TODO: SECURITY CONSIDERATION - Auto-login after registration
        // In production, consider requiring admin approval or invitation codes
        // to prevent unauthorized account creation
        
        // Auto-login the newly registered user
        setTimeout(async () => {
          try {
            const loginResponse = await fetch('http://localhost:0/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clockInNumber: parseInt(registerData.clockInNumber),
                password: registerData.password,
              }),
            });

            const loginData = await loginResponse.json();

            if (loginResponse.ok) {
              const userData = {
                id: loginData.user.id,
                userName: registerData.userName,
                role: registerData.role,
                clockInNumber: registerData.clockInNumber,
                section: loginData.user.section,
                token: loginData.token
              };
              
              onLogin(userData);
            } else {
              showMessage('Account created but auto-login failed. Please login manually.');
              setIsLogin(true);
            }
          } catch (autoLoginError) {
            showMessage('Account created but auto-login failed. Please login manually.');
            setIsLogin(true);
          }
        }, 1500);
      } else {
        showMessage(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setMessage('');
    setLoginData({ clockInNumber: '', password: '' });
    setRegisterData({ clockInNumber: '', userName: '', role: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Restaurant Seating System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Sign in to manage tables and seating' : 'Create your staff account'}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Login Form */}
        {isLogin ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="number"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Clock Number (e.g., 001, 002, 003)"
                  value={loginData.clockInNumber}
                  onChange={(e) => setLoginData({...loginData, clockInNumber: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Use the same clock number you use to login to the POS at work
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
        ) : (
          /* Registration Form */
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <input
                  type="number"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Clock Number (e.g., 001, 002, 003)"
                  value={registerData.clockInNumber}
                  onChange={(e) => setRegisterData({...registerData, clockInNumber: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={registerData.userName}
                  onChange={(e) => setRegisterData({...registerData, userName: e.target.value})}
                />
              </div>
              <div>
                <select
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  value={registerData.role}
                  onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                >
                  <option value="">Select Role</option>
                  <option value="host">Host</option>
                  <option value="waiter">Waiter</option>
                </select>
              </div>
              {/* Show disabled section field for waiters */}
              {registerData.role === 'waiter' && (
                <div>
                  <input
                    type="text"
                    disabled
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-400 bg-gray-100 rounded-md sm:text-sm"
                    placeholder="Section will be assigned when you start your shift"
                  />
                </div>
              )}
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password (minimum 6 characters)"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Use the same clock number you use to login to the POS at work
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        {/* Toggle Button */}
        <div className="text-center">
          <button
            onClick={toggleMode}
            disabled={isLoading}
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium disabled:opacity-50"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

// TABLE GRID COMPONENT (unchanged from original)
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
    console.log('Table action:', { tableId, action, extraData });
    onTableAction(tableId, action, extraData);
  };

  return (
    <div className="space-y-6">
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
                          <div>Waiter: {table.assignedWaiter.userName}</div>
                          <div>Party: {table.partySize}</div>
                        </div>
                      )}

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

// WAITLIST COMPONENT (unchanged from original)
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

// ACTIVITY FEED COMPONENT (unchanged from original)
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
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // MOCK REAL-TIME UPDATES
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
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

  const handleLogout = async () => {
    if (user && user.token) {
      try {
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
  };

  // MOCK TABLE ACTIONS
  const handleTableAction = (tableId, action, extraData = {}) => {
    setTables(prev => {
      const newTables = { ...prev };
      const table = newTables[tableId];
      
      if (!table) return prev;
      
      const newActivity = {
        id: Date.now(),
        timestamp: new Date(),
        user: { userName: user.userName },
        tableNumber: table.tableNumber
      };

      switch (action) {
        case 'assign':
          newTables[tableId] = {
            ...table,
            state: 'assigned',
            assignedWaiter: { userName: extraData.waitername, clockInNumber: extraData.waiterId },
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
      
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
      return newTables;
    });
  };

  // MOCK WAITLIST ACTIONS
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
        break;
    }
  };

  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
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