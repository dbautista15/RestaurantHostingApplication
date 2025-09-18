import React from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { LoginScreen } from './components/auth/LoginScreen';
import { useAuth } from './hooks/useAuth';

const App = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return <Dashboard user={user} onLogout={logout} />;
};

export default App;