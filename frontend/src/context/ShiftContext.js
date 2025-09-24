// frontend/src/context/ShiftContext.js - FIXED VERSION
import React, { createContext, useContext, useState } from 'react';
import { getToken } from '../hooks/useAction';

const API_BASE = 'http://localhost:3001/api';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  const [shiftData, setShiftData] = useState(() => {
    const saved = localStorage.getItem('restaurant-shift-data');
    return saved ? JSON.parse(saved) : {
      serverCount: null,
      serverOrder: [],
      isShiftSetup: false
    };
  });

  const updateShiftData = (data) => {
    const newShiftData = { ...shiftData, ...data, isShiftSetup: true };
    setShiftData(newShiftData);
    localStorage.setItem('restaurant-shift-data', JSON.stringify(newShiftData));
  };

  const resetShift = () => {
    const resetData = { serverCount: null, serverOrder: [], isShiftSetup: false };
    setShiftData(resetData);
    localStorage.removeItem('restaurant-shift-data');
  };

  // Direct API calls without hooks
  const removeServer = async (serverId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/shifts/remove-server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ serverId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove server');
      }

      const result = await response.json();
      if (result.success && result.newConfiguration) {
        setShiftData(result.newConfiguration);
        localStorage.setItem('restaurant-shift-data', JSON.stringify(result.newConfiguration));
      }
      return result;
    } catch (error) {
      console.error('Remove server failed:', error);
      return { success: false, message: error.message };
    }
  };

  const addServer = async (serverName) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/shifts/add-server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ serverName })
      });

      if (!response.ok) {
        throw new Error('Failed to add server');
      }

      const result = await response.json();
      if (result.success && result.newConfiguration) {
        setShiftData(result.newConfiguration);
        localStorage.setItem('restaurant-shift-data', JSON.stringify(result.newConfiguration));
      }
      return result;
    } catch (error) {
      console.error('Add server failed:', error);
      return { success: false, message: error.message };
    }
  };

  return (
    <ShiftContext.Provider value={{
      shiftData,
      updateShiftData,
      resetShift,
      removeServer,
      addServer
    }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) throw new Error('useShift must be used within a ShiftProvider');
  return context;
};