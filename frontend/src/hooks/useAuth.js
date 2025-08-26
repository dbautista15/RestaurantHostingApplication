// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';

/**
 * 🎯 YOUR ENGINEERING TASK: Authentication Hook
 * 
 * LEARNING OBJECTIVES:
 * - Custom React hooks for API state management
 * - JWT token storage and management
 * - Error handling in authentication flows
 * - Automatic token refresh/validation
 * 
 * REQUIREMENTS:
 * - Handle login/logout API calls
 * - Store JWT token securely (not localStorage in artifacts!)
 * - Manage authentication state across app
 * - Handle token expiration gracefully
 */

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // TODO: Implement login function
  const login = async (clockNumber, password) => {
    // YOUR CODE HERE:
    // 1. Set loading state
    // 2. Make POST request to /api/auth/login
    // 3. Store JWT token (NOT in localStorage - use state only)
    // 4. Set user data from response
    // 5. Handle errors appropriately
    // 6. Return success/failure
    
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Replace this mock with real API call
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clockNumber, password })
      });
      
      // TODO: Handle response
      // ENGINEERING QUESTIONS:
      // - What status codes should you expect?
      // - How do you handle different error types?
      // - Where should you store the JWT token?
      
    } catch (error) {
      // TODO: Error handling
      // ENGINEERING DECISION: How do you differentiate network errors vs auth errors?
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Implement logout function
  const logout = () => {
    // YOUR CODE HERE:
    // 1. Clear user state
    // 2. Clear stored JWT token
    // 3. Optionally make logout API call
    // 4. Redirect or update UI state
  };

  // TODO: Implement token validation
  const validateToken = async () => {
    // YOUR CODE HERE:
    // 1. Check if token exists
    // 2. Verify token hasn't expired
    // 3. Optionally make API call to validate
    // 4. Clear auth state if invalid
  };

  // TODO: Check authentication on app load
  useEffect(() => {
    // YOUR CODE HERE:
    // Should you auto-login if token exists?
    // How do you handle page refreshes?
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };
};

