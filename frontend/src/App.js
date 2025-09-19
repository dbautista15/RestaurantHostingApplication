import React from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { LoginScreen } from './components/auth/LoginScreen';
import { useAuth } from './hooks/useAuth';
import { ShiftProvider, useShift } from './context/ShiftContext';
import ShiftSetup from './components/ShiftSetup';

// Wrap your existing App component:
const AppWithShift = () => {
  return (
    <ShiftProvider>
      <App />
    </ShiftProvider>
  );
};
const App = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { shiftData } = useShift();

  if (user?.role === 'host' && !shiftData.isShiftSetup) {
    return <ShiftSetup />;
  }
  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return <Dashboard user={user} onLogout={logout} />;
};

export default AppWithShift;
