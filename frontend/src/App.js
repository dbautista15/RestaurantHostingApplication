import React from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { LoginScreen } from './components/auth/LoginScreen';
import { useAuth } from './hooks/useAuth';
import { ShiftProvider, useShift } from './context/ShiftContext';
import ShiftSetup from './components/ShiftSetup';

// Inner component that can safely use hooks
const AppContent = () => {
  const { user, isAuthenticated, login, logout, loading } = useAuth();
  const { shiftData } = useShift(); // Now always called, not conditionally

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

  // Authenticated - check if shift setup is needed
  if (user?.role === 'host' && !shiftData.isShiftSetup) {
    return <ShiftSetup />;
  }

  return <Dashboard user={user} onLogout={logout} />;
};

// Main App component with providers
const App = () => {
  return (
    <ShiftProvider>
      <AppContent />
    </ShiftProvider>
  );
};

export default App;