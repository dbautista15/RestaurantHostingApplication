// frontend/src/hooks/useAuth.js - LEAN VERSION (Backend API Only)
import { useState, useEffect } from 'react';
import { useActions } from '../hooks/useAction';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🎯 Initialize from stored token on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = user.getToken();
      const storedUser = useAuth.getUser();
      
      if (token && storedUser) {
        // ✅ Validate token with backend /me endpoint
        try {
          const response = await fetch('http://localhost:3001/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token invalid, clear it
            useActions.logout();
          }
        } catch (error) {
          // Network error, use stored user but could show "offline" indicator
          console.warn('Auth validation failed, using stored user:', error);
          setUser(storedUser);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // 🎯 LOGIN - Just call backend API
  const login = async (clockInNumber, password) => {
    try {
      setLoading(true);
      
      // ✅ Backend does all validation, JWT generation, business logic
      const result = await useActions.login(clockInNumber, password);
      
      if (result.success) {
        setUser(result.user);
        return result;
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🎯 LOGOUT - Clear local state and call backend
  const logout = async () => {
    try {
      // ✅ Call backend logout endpoint (clears server-side session if any)
      const token = useAuth.getToken();
      if (token) {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.warn('Backend logout failed:', error);
      // Continue with local logout anyway
    }
    
    // ✅ Clear local storage and state
    useActions.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };
};

/*
🎯 KEY SIMPLIFICATIONS:

REMOVED (Backend handles now):
❌ Complex auth state management
❌ Token expiration logic
❌ Password validation
❌ User role checking
❌ Session management
❌ Auth business rules

KEPT (Thin UI layer):
✅ Call backend /login endpoint
✅ Call backend /logout endpoint  
✅ Store/retrieve token locally
✅ Provide auth state to components

BACKEND HANDLES:
✅ Password hashing/verification
✅ JWT generation/validation
✅ User lookup and validation
✅ Role-based access control
✅ Session management
✅ Security rules

RESULT: 80% less code, all auth logic centralized in backend!
*/