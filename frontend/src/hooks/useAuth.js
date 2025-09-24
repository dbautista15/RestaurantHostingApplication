// frontend/src/hooks/useAuth.js - ULTRA LEAN VERSION
import { useState, useEffect } from 'react';
import { useActions, getUser, getToken } from './useAction';

export const useAuth = () => {
  const [user, setUser] = useState(() => getUser());
  const [loading, setLoading] = useState(false);
  const { auth } = useActions();

  // Simple login wrapper
  const login = async (clockInNumber, password) => {
    setLoading(true);
    try {
      const result = await auth.login(clockInNumber, password);
      if (result.user) {
        setUser(result.user);
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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
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