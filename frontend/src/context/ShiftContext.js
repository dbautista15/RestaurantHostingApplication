// src/context/ShiftContext.js
import React, { createContext, useContext, useState } from 'react';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  // NEW: Initialize from localStorage if available
  const getInitialShiftData = () => {
    try {
      const saved = localStorage.getItem('restaurant-shift-data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading shift data:', error);
    }
    
    // Default state if no saved data
    return {
      serverCount: null,
      serverOrder: [],
      isShiftSetup: false
    };
  };

  const [shiftData, setShiftData] = useState(getInitialShiftData());

  const updateShiftData = (data) => {
    const newShiftData = {
      ...shiftData,
      ...data,
      isShiftSetup: true
    };
    
    setShiftData(newShiftData);
    
    // NEW: Save to localStorage
    localStorage.setItem('restaurant-shift-data', JSON.stringify(newShiftData));
  };

  const resetShift = () => {
    const resetData = {
      serverCount: null,
      serverOrder: [],
      isShiftSetup: false
    };
    
    setShiftData(resetData);
    
    // NEW: Clear from localStorage
    localStorage.removeItem('restaurant-shift-data');
  };

  // Smart server removal with automatic table reassignment
  const removeServer = (serverId) => {
    const removedServer = shiftData.serverOrder.find(s => s.id === serverId);
    if (!removedServer || shiftData.serverCount <= 1) {
      return { success: false, message: "Cannot remove the last server" };
    }

    const remainingServers = shiftData.serverOrder.filter(s => s.id !== serverId);
    
    // Automatically redistribute tables among remaining servers
    const redistributionLog = `${removedServer.name}'s tables redistributed among remaining ${remainingServers.length} servers`;

    const updatedShiftData = {
      ...shiftData,
      serverCount: remainingServers.length,
      serverOrder: remainingServers,
      lastChange: {
        type: 'server_removed',
        removedServer,
        timestamp: new Date(),
        message: redistributionLog
      }
    };

    setShiftData(updatedShiftData);
    
    // NEW: Save to localStorage
    localStorage.setItem('restaurant-shift-data', JSON.stringify(updatedShiftData));

    return {
      success: true,
      message: redistributionLog,
      removedServer
    };
  };

  // Add server mid-shift
  const addServer = (serverName) => {
    const newServerId = Math.max(...shiftData.serverOrder.map(s => s.id), 0) + 1;
    const newSectionNumber = shiftData.serverCount + 1;
    
    const newServer = {
      id: newServerId,
      name: serverName,
      section: newSectionNumber
    };

    const updatedServerOrder = [...shiftData.serverOrder, newServer];

    const updatedShiftData = {
      ...shiftData,
      serverCount: updatedServerOrder.length,
      serverOrder: updatedServerOrder,
      lastChange: {
        type: 'server_added',
        addedServer: newServer,
        timestamp: new Date(),
        message: `${serverName} added to Section ${newSectionNumber}`
      }
    };

    setShiftData(updatedShiftData);
    
    // NEW: Save to localStorage
    localStorage.setItem('restaurant-shift-data', JSON.stringify(updatedShiftData));

    return {
      success: true,
      message: `${serverName} added to Section ${newSectionNumber}`,
      newServer
    };
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
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
};