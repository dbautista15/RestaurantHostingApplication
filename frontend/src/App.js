import React, { useState, useEffect } from 'react';

// Fixed API base URL to match your backend
const API_BASE = 'http://localhost:3000/api';

// Auth service - unchanged but fixed
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

// Complete API service with all required methods
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

  // Table operations
  async getTables() { 
    return this.request('/tables'); 
  },

  async updateTableState(tableId, newState, options = {}) {
    return this.request(`/tables/${tableId}/state`, {
      method: 'PUT',
      body: JSON.stringify({ newState, ...options })
    });
  },

  // Waitlist operations
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
  },

  // Shift management operations
  async getShiftConfigurations() {
    return this.request('/shifts/configurations');
  },

  async activateShiftConfiguration(configurationId) {
    return this.request('/shifts/activate', {
      method: 'POST',
      body: JSON.stringify({ configurationId })
    });
  },

  async quickShiftSetup(serverCount, options = {}) {
    return this.request('/shifts/quick-setup', {
      method: 'POST',
      body: JSON.stringify({ serverCount, ...options })
    });
  }
};

// Login Component - unchanged
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
              required
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
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !clockInNumber || !password}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Complete Shift Management Component
const ShiftSetup = ({ onConfigurationChange }) => {
  const [configurations, setConfigurations] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quickSetupOpen, setQuickSetupOpen] = useState(false);
  
  const [quickSetup, setQuickSetup] = useState({
    serverCount: 2,
    includePatioArea: false,
    includeBarArea: true
  });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getShiftConfigurations();
      setConfigurations(response.configurations);
      setActiveConfig(response.activeConfiguration);
    } catch (error) {
      console.error('Failed to load configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateConfiguration = async (configId) => {
    try {
      setLoading(true);
      const response = await apiService.activateShiftConfiguration(configId);
      
      setActiveConfig(response.activeConfiguration);
      
      if (onConfigurationChange) {
        onConfigurationChange(response.tables);
      }
      
      alert(`Activated ${response.activeConfiguration.shiftName} configuration`);
      
    } catch (error) {
      console.error('Failed to activate configuration:', error);
      alert('Failed to activate configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSetup = async () => {
    try {
      setLoading(true);
      const response = await apiService.quickShiftSetup(quickSetup.serverCount, {
        includePatioArea: quickSetup.includePatioArea,
        includeBarArea: quickSetup.includeBarArea
      });
      
      alert(response.message);
      await loadConfigurations();
      setQuickSetupOpen(false);
      
      if (onConfigurationChange) {
        const tablesResponse = await apiService.getTables();
        onConfigurationChange(tablesResponse.tables);
      }
      
    } catch (error) {
      console.error('Quick setup failed:', error);
      alert('Quick setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && configurations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading shift configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Shift Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Current Shift Configuration</h3>
        {activeConfig ? (
          <div className="space-y-2">
            <p className="text-blue-800">
              <strong>{activeConfig.shiftName}</strong> - {activeConfig.serverCount} server(s)
            </p>
            <p className="text-blue-700 text-sm">
              {activeConfig.activeSections.length} sections active
            </p>
            {activeConfig.notes && (
              <p className="text-blue-600 text-sm italic">{activeConfig.notes}</p>
            )}
          </div>
        ) : (
          <p className="text-blue-700">No shift configuration is currently active</p>
        )}
      </div>

      {/* Quick Setup */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Quick Setup</h3>
          <button
            onClick={() => setQuickSetupOpen(!quickSetupOpen)}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            {quickSetupOpen ? 'Cancel' : 'Quick Setup'}
          </button>
        </div>

        {quickSetupOpen && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many servers are working?
              </label>
              <select
                value={quickSetup.serverCount}
                onChange={(e) => setQuickSetup({...quickSetup, serverCount: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              >
                {[1,2,3,4,5,6,7,8].map(count => (
                  <option key={count} value={count}>{count} server{count !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={quickSetup.includePatioArea}
                  onChange={(e) => setQuickSetup({...quickSetup, includePatioArea: e.target.checked})}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Include Patio Area</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={quickSetup.includeBarArea}
                  onChange={(e) => setQuickSetup({...quickSetup, includeBarArea: e.target.checked})}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Include Bar Area</span>
              </label>
            </div>

            <button
              onClick={handleQuickSetup}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Setting up...' : 'Apply Quick Setup'}
            </button>
          </div>
        )}
      </div>

      {/* Available Configurations */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Available Shift Configurations</h3>
        
        {configurations.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No shift configurations available. Run the seeder script to create them.
          </p>
        ) : (
          <div className="space-y-3">
            {configurations.map(config => (
              <div
                key={config._id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  config.isActive 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {config.shiftName.replace('-', ' ')}
                      {config.isActive && (
                        <span className="ml-2 inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Active
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {config.serverCount} server{config.serverCount !== 1 ? 's' : ''} • {config.activeSections.length} sections
                    </p>
                  </div>
                  
                  {!config.isActive && (
                    <button
                      onClick={() => handleActivateConfiguration(config._id)}
                      disabled={loading}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  {config.activeSections.map(section => (
                    <div key={section.sectionNumber}>
                      Section {section.sectionNumber}: {section.assignedTables.length} tables
                    </div>
                  ))}
                </div>

                {config.notes && (
                  <p className="text-sm text-gray-500 mt-2 italic">{config.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Table Card Component - unchanged
const TableCard = ({ table, onStatusChange }) => {
  const getStatusColor = (state) => {
    switch (state) {
      case 'available': return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
      case 'assigned': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getNextStatus = (currentState) => {
    switch (currentState) {
      case 'available': return 'occupied';
      case 'occupied': return 'available';
      case 'assigned': return 'occupied';
      default: return 'available';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor(table.state)}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">{table.tableNumber}</h3>
          <p className="text-sm opacity-75">
            {table.section ? `Section ${table.section}` : 'No Section'}
          </p>
        </div>
        <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
          Seats {table.capacity}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium capitalize">{table.state}</span>
        <button
          onClick={() => onStatusChange(table.id, getNextStatus(table.state))}
          className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded text-sm font-medium transition-colors"
        >
          Change Status
        </button>
      </div>
    </div>
  );
};

// Waitlist Entry Component - unchanged
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
    <div className="bg-white p-4 rounded-lg border space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900">{entry.partyName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
              {entry.priority === 'large_party' ? 'Large' : entry.priority === 'coworker' ? 'Staff' : 'Normal'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Party of {entry.partySize} • {getWaitTime(entry.createdAt)} min
          </p>
          {entry.phoneNumber && (
            <p className="text-sm text-gray-500 mt-1">{entry.phoneNumber}</p>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onStatusChange(entry._id, 'seated')}
          className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Seat Party
        </button>
        <button
          onClick={() => onRemove(entry._id)}
          className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Add Party Modal - fixed validation issue
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
      // Fixed: Only send required fields, let backend handle defaults
      await onAdd({
        partyName: formData.partyName,
        partySize: parseInt(formData.partySize),
        phoneNumber: formData.phoneNumber || undefined, // Optional
        priority: formData.priority
        // Removed: estimatedWait and partyStatus - backend handles these
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
              Party Name *
            </label>
            <input
              type="text"
              value={formData.partyName}
              onChange={(e) => setFormData({...formData, partyName: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter party name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Size *
            </label>
            <input
              type="number"
              value={formData.partySize}
              onChange={(e) => setFormData({...formData, partySize: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Number of guests"
              min="1"
              max="20"
              required
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

// Complete Dashboard Component with shift management integration
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
      setWaitlist([]); // Don't fall back to mock data
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurationChange = (newTables) => {
    if (newTables) {
      setTables(newTables);
    } else {
      loadTables();
    }
  };

  const handleTableStatusChange = async (tableId, newState) => {
    try {
      // Optimistic update
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === tableId ? { ...table, state: newState } : table
        )
      );

      // Real API call
      await apiService.updateTableState(tableId, newState);
    } catch (error) {
      console.error('Failed to update table:', error);
      // Revert optimistic update
      loadTables();
    }
  };

  const handleAddToWaitlist = async (partyData) => {
    try {
      await apiService.addToWaitlist(partyData);
      loadWaitlist();
    } catch (error) {
      console.error('Failed to add party:', error);
      setError('Failed to add party to waitlist');
    }
  };

  const handleWaitlistStatusChange = async (entryId, status) => {
    try {
      await apiService.updateWaitlistStatus(entryId, status);
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    } catch (error) {
      console.error('Failed to update status:', error);
      setError('Failed to update waitlist status');
    }
  };

  const handleRemoveFromWaitlist = async (entryId) => {
    try {
      await apiService.removeFromWaitlist(entryId);
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    } catch (error) {
      console.error('Failed to remove party:', error);
      setError('Failed to remove party from waitlist');
    }
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  if (loading && (currentView === 'tables' ? tables.length === 0 : currentView === 'waitlist' ? waitlist.length === 0 : false)) {
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
              onClick={() => setCurrentView('shift')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                currentView === 'shift'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Shift Setup
            </button>
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

        {/* Content Rendering */}
        {currentView === 'shift' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Shift Management</h2>
              <p className="text-gray-600">Configure table sections based on staffing levels</p>
            </div>
            <ShiftSetup onConfigurationChange={handleConfigurationChange} />
          </div>
        )}

        {currentView === 'tables' && (
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
                  {tables.filter(t => t.state === 'assigned').length}
                </div>
                <div className="text-sm text-gray-600">Assigned Tables</div>
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
                  key={table.id}
                  table={table}
                  onStatusChange={handleTableStatusChange}
                />
              ))}
            </div>
          </>
        )}

        {currentView === 'waitlist' && (
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