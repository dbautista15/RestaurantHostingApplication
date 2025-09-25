// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useActions, getUser, getToken } from './useAction';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { auth } = useActions();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = () => {
      const token = getToken();
      const storedUser = getUser();
      
      if (token && storedUser) {
        setUser(storedUser);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Simple login wrapper
  const login = async (clockInNumber, password) => {
    setLoading(true);
    try {
      const result = await auth.login(clockInNumber, password);
      if (result.user) {
        setUser(result.user);
        // Force a small delay to ensure localStorage is updated
        setTimeout(() => {
          window.location.reload(); // Force reload after successful login
        }, 100);
      }
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Simple logout wrapper
  const logout = async () => {
    setLoading(true);
    try {
      await auth.logout();
      setUser(null);
      // Force reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };
};