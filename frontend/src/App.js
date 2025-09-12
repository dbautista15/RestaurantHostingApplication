import React, { useState, useEffect } from 'react';

// API base URL - adjust to match your backend
const API_BASE = 'http://localhost:3000/api';

// Auth service
const authService = {
  async login(clockInNumber, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clockInNumber, password })
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

// API service with auth
const apiService = {
  async request(endpoint, options = {}) {
    const token = authService.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  },

  // Table endpoints (placeholder for your table API)
  async getTables() {
    // Mock data since your tables route isn't fully implemented yet
    return {
      tables: [
        { _id: '1', tableNumber: 'T1', section: 1, capacity: 4, state: 'available' },
        { _id: '2', tableNumber: 'T2', section: 1, capacity: 2, state: 'occupied' },
        { _id: '3', tableNumber: 'T3', section: 2, capacity: 6, state: 'available' },
        { _id: '4', tableNumber: 'T4', section: 2, capacity: 4, state: 'occupied' },
        { _id: '5', tableNumber: 'T5', section: 3, capacity: 8, state: 'available' },
        { _id: '6', tableNumber: 'T6', section: 3, capacity: 2, state: 'cleaning' }
      ]
    };
  },

  // Waitlist endpoints
  async getWaitlist() {
    return this.request('/waitlist');
  },

  async addToWaitlist(partyData) {
    return this.request('/waitlist', {
      method: 'POST',
      body: JSON.stringify(partyData)
    });
  },

  async updateWaitlistStatus(id, partyStatus) {
    return this.request(`/waitlist/${id}/partyStatus`, {
      method: 'PUT',
      body: JSON.stringify({ partyStatus })
    });
  },

  async removeFromWaitlist(id) {
    return this.request(`/waitlist/${id}`, {
      method: 'DELETE'
    });
  }
};

// Login Component
const LoginScreen = ({ onLogin }) => {
  const [clockInNumber, setClockInNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await authService.login(clockInNumber, password);
      if (result.success) {
        onLogin(result.user);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Restaurant Host
        </h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clock Number
            </label>
            <input
              type="text"
              value={clockInNumber}
              onChange={(e) => setClockInNumber(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your clock number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !clockInNumber || !password}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Table Card Component
const TableCard = ({ table, onStatusChange }) => {
  const getStatusColor = (state) => {
    switch (state) {
      case 'available': return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
      case 'cleaning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getNextStatus = (currentState) => {
    switch (currentState) {
      case 'available': return 'occupied';
      case 'occupied': return 'available';
      case 'cleaning': return 'available';
      default: return 'available';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor(table.state)}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">{table.tableNumber}</h3>
          <p className="text-sm opacity-75">Section {table.section}</p>
        </div>
        <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
          Seats {table.capacity}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium capitalize">{table.state}</span>
        <button
          onClick={() => onStatusChange(table._id, getNextStatus(table.state))}
          className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded text-sm font-medium transition-colors"
        >
          Change Status
        </button>
      </div>
    </div>
  );
};

// Waitlist Entry Component (Compact for split view)
const WaitlistEntry = ({ entry, onStatusChange, onRemove }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'coworker': return 'bg-purple-100 text-purple-800';
      case 'large_party': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getWaitTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    return diffMinutes;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 text-sm">{entry.partyName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
              {entry.priority === 'large_party' ? 'Large' : entry.priority === 'coworker' ? 'Staff' : 'Normal'}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Party of {entry.partySize} • {getWaitTime(entry.createdAt)} min
          </p>
          {entry.phoneNumber && (
            <p className="text-xs text-gray-500 mt-1">{entry.phoneNumber}</p>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onStatusChange(entry._id, 'seated')}
          className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
        >
          Seat
        </button>
        <button
          onClick={() => onRemove(entry._id)}
          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Add Party Modal
const AddPartyModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    partyName: '',
    partySize: '',
    phoneNumber: '',
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.partyName || !formData.partySize) return;
    
    setLoading(true);
    try {
      await onAdd({
        ...formData,
        partySize: parseInt(formData.partySize),
        estimatedWait: 15, // Default estimate
        partyStatus: 'waiting'
      });
      setFormData({ partyName: '', partySize: '', phoneNumber: '', priority: 'normal' });
      onClose();
    } catch (error) {
      console.error('Failed to add party:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Add Party to Waitlist</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Name
            </label>
            <input
              type="text"
              value={formData.partyName}
              onChange={(e) => setFormData({...formData, partyName: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter party name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Size
            </label>
            <input
              type="number"
              value={formData.partySize}
              onChange={(e) => setFormData({...formData, partySize: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Number of guests"
              min="1"
              max="20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (optional)
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="large_party">Large Party</option>
              <option value="coworker">Coworker</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.partyName || !formData.partySize}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Adding...' : 'Add Party'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('tables');
  const [tables, setTables] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadTables();
    if (currentView === 'waitlist') {
      loadWaitlist();
    }
  }, [currentView]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTables();
      setTables(data.tables);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWaitlist = async () => {
    try {
      setLoading(true);
      const data = await apiService.getWaitlist();
      setWaitlist(data.waitlist || []);
    } catch (err) {
      setError(err.message);
      // Mock data for development
      setWaitlist([
        { _id: '1', partyName: 'Smith', partySize: 4, phoneNumber: '555-0123', priority: 'normal', createdAt: new Date(Date.now() - 15*60000) },
        { _id: '2', partyName: 'Johnson', partySize: 2, phoneNumber: '555-0456', priority: 'coworker', createdAt: new Date(Date.now() - 8*60000) },
        { _id: '3', partyName: 'Williams', partySize: 8, phoneNumber: '555-0789', priority: 'large_party', createdAt: new Date(Date.now() - 22*60000) }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableStatusChange = async (tableId, newState) => {
    // Update optimistically
    setTables(prevTables => 
      prevTables.map(table => 
        table._id === tableId ? { ...table, state: newState } : table
      )
    );

    // Here you would make the actual API call to update table status
    // await apiService.updateTableStatus(tableId, newState);
    console.log(`Table ${tableId} changed to ${newState}`);
  };

  const handleAddToWaitlist = async (partyData) => {
    try {
      await apiService.addToWaitlist(partyData);
      loadWaitlist(); // Refresh waitlist
    } catch (error) {
      console.error('Failed to add party:', error);
      // Add optimistically for demo
      const newEntry = {
        _id: Date.now().toString(),
        ...partyData,
        createdAt: new Date()
      };
      setWaitlist(prev => [...prev, newEntry]);
    }
  };

  const handleWaitlistStatusChange = async (entryId, status) => {
    try {
      await apiService.updateWaitlistStatus(entryId, status);
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    } catch (error) {
      console.error('Failed to update status:', error);
      // Remove optimistically for demo
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    }
  };

  const handleRemoveFromWaitlist = async (entryId) => {
    try {
      await apiService.removeFromWaitlist(entryId);
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    } catch (error) {
      console.error('Failed to remove party:', error);
      // Remove optimistically for demo
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    }
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  if (loading && (currentView === 'tables' ? tables.length === 0 : waitlist.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Restaurant Management</h1>
            <p className="text-gray-600">Welcome back, {user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('tables')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'tables'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tables
            </button>
            <button
              onClick={() => setCurrentView('waitlist')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'waitlist'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Waitlist ({waitlist.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {currentView === 'tables' ? (
          <>
            {/* Table Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">
                  {tables.filter(t => t.state === 'available').length}
                </div>
                <div className="text-sm text-gray-600">Available Tables</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-red-600">
                  {tables.filter(t => t.state === 'occupied').length}
                </div>
                <div className="text-sm text-gray-600">Occupied Tables</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-yellow-600">
                  {tables.filter(t => t.state === 'cleaning').length}
                </div>
                <div className="text-sm text-gray-600">Being Cleaned</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">
                  {tables.length}
                </div>
                <div className="text-sm text-gray-600">Total Tables</div>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map(table => (
                <TableCard
                  key={table._id}
                  table={table}
                  onStatusChange={handleTableStatusChange}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Waitlist Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Current Waitlist</h2>
                <p className="text-gray-600">{waitlist.length} parties waiting</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Party
              </button>
            </div>

            {/* Waitlist Entries */}
            <div className="space-y-4">
              {waitlist.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No parties currently waiting
                </div>
              ) : (
                waitlist.map(entry => (
                  <WaitlistEntry
                    key={entry._id}
                    entry={entry}
                    onStatusChange={handleWaitlistStatusChange}
                    onRemove={handleRemoveFromWaitlist}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Party Modal */}
      <AddPartyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddToWaitlist}
      />
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    if (authService.isAuthenticated()) {
      const savedUser = authService.getUser();
      if (savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
};

export default App;