// frontend/src/context/ShiftContext.js - ULTRA LEAN VERSION
import React, { createContext, useContext, useState } from 'react';
import { useActions } from '../hooks/useAction';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  const { shifts } = useActions();
  
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

  // Just delegate to backend
  const removeServer = async (serverId) => {
    const result = await shifts.removeServer(serverId);
    if (result.success && result.newConfiguration) {
      setShiftData(result.newConfiguration);
      localStorage.setItem('restaurant-shift-data', JSON.stringify(result.newConfiguration));
    }
    return result;
  };

  const addServer = async (serverName) => {
    const result = await shifts.addServer(serverName);
    if (result.success && result.newConfiguration) {
      setShiftData(result.newConfiguration);
      localStorage.setItem('restaurant-shift-data', JSON.stringify(result.newConfiguration));
    }
    return result;
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