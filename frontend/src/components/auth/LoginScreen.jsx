import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const LoginScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [clockInNumber, setClockInNumber] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('host');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(clockInNumber, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      // Success is handled by useAuth - no need to do anything here
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clockInNumber,
          userName,
          role,
          section: role === 'waiter' ? parseInt(section) : null,
          password
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccessMessage('Registration successful! Please login.');
        setIsRegistering(false);
        // Clear form except clockInNumber for convenience
        setPassword('');
        setUserName('');
        setRole('host');
        setSection('');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClockInNumber('');
    setPassword('');
    setUserName('');
    setRole('host');
    setSection('');
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Restaurant Host
        </h1>
        
        <h2 className="text-xl font-semibold text-center mb-6 text-gray-700">
          {isRegistering ? 'Create Account' : 'Sign In'}
        </h2>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clock-In Number
            </label>
            <input
              type="text"
              value={clockInNumber}
              onChange={(e) => setClockInNumber(e.target.value.toUpperCase())}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., H001, W042, 003"
              required
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setSection(''); // Reset section when role changes
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="host">Host</option>
                <option value="waiter">Waiter</option>
              </select>
            </div>
          )}

          {isRegistering && role === 'waiter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a section</option>
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <option key={num} value={num}>Section {num}</option>
                ))}
              </select>
            </div>
          )}
          
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
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              resetForm();
            }}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {isRegistering 
              ? 'Already have an account? Sign in' 
              : 'Need to register? Create account'}
          </button>
        </div>
      </div>
    </div>
  );
};