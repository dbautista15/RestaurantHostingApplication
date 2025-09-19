// src/context/ShiftContext.js
import React, { createContext, useContext, useState } from 'react';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  const [shiftData, setShiftData] = useState({
    serverCount: null,
    serverOrder: [],
    isShiftSetup: false
  });

  const updateShiftData = (data) => {
    setShiftData(prev => ({
      ...prev,
      ...data,
      isShiftSetup: true
    }));
  };

  const resetShift = () => {
    setShiftData({
      serverCount: null,
      serverOrder: [],
      isShiftSetup: false
    });
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

    setShiftData(prev => ({
      ...prev,
      serverCount: remainingServers.length,
      serverOrder: remainingServers,
      lastChange: {
        type: 'server_removed',
        removedServer,
        timestamp: new Date(),
        message: redistributionLog
      }
    }));

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

    setShiftData(prev => ({
      ...prev,
      serverCount: updatedServerOrder.length,
      serverOrder: updatedServerOrder,
      lastChange: {
        type: 'server_added',
        addedServer: newServer,
        timestamp: new Date(),
        message: `${serverName} added to Section ${newSectionNumber}`
      }
    }));

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