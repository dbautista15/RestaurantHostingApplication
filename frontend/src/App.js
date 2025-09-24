// src/App.js - NO MORE SHIFT CONTEXT
import React, { useState } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { LoginScreen } from './components/auth/LoginScreen';
import { useAuth } from './hooks/useAuth';
import ShiftSetup from './components/ShiftSetup';

const App = () => {
  const { user, isAuthenticated, login, logout, loading } = useAuth();
  const [needsShiftSetup, setNeedsShiftSetup] = useState(false);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login screen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  // Show shift setup if needed
  if (needsShiftSetup) {
    return (
      <ShiftSetup 
        onComplete={() => {
          setNeedsShiftSetup(false);
          // Dashboard will refresh and get new shift data
        }} 
      />
    );
  }

  // Main dashboard - it will check if shift is configured
  return (
    <Dashboard 
      user={user} 
      onLogout={logout}
      onNeedShiftSetup={() => setNeedsShiftSetup(true)}
    />
  );
};

export default App;