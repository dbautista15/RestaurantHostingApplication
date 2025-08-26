
// frontend/src/services/api.js

/**
 * 🎯 YOUR ENGINEERING TASK: API Client Configuration
 * 
 * LEARNING OBJECTIVES:
 * - Centralized API configuration
 * - Request/response interceptors
 * - Error handling patterns
 * - Authentication header management
 */

// TODO: Set up axios instance with base configuration
// YOUR CODE HERE:
// 1. Create axios instance with base URL
// 2. Add request interceptors for auth headers
// 3. Add response interceptors for error handling
// 4. Export configured instance

// Example structure:
/*
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  // YOUR CODE HERE: Add Authorization header if token exists
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // YOUR CODE HERE: Handle different error types
    // - 401: Clear auth and redirect to login
    // - 500: Show user-friendly error
    // - Network errors: Show connection error
    return Promise.reject(error);
  }
);

export default api;
*/

/**
 * 📚 LEARNING RESOURCES:
 * - React Hooks Guide: https://reactjs.org/docs/hooks-intro.html
 * - Socket.io Client: https://socket.io/docs/v4/client-api/
 * - Axios Documentation: https://axios-http.com/docs/intro
 * 
 * 🧪 TESTING YOUR HOOKS:
 * 1. Test authentication flow end-to-end
 * 2. Test table updates with real backend
 * 3. Test WebSocket connection and real-time updates
 * 4. Test error handling and edge cases
 * 
 * 💭 ENGINEERING PATTERNS YOU'RE LEARNING:
 * - Custom hooks for stateful logic
 * - Separation of concerns (API vs UI logic)
 * - Error boundaries and graceful degradation
 * - Real-time state synchronization
 * - Optimistic UI updates
 */