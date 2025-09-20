// src/context/ShiftContext.js
import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  // Initialize from localStorage if available
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
    
    // Save to localStorage
    localStorage.setItem('restaurant-shift-data', JSON.stringify(newShiftData));
  };

  const resetShift = () => {
    const resetData = {
      serverCount: null,
      serverOrder: [],
      isShiftSetup: false
    };
    
    setShiftData(resetData);
    
    // Clear from localStorage
    localStorage.removeItem('restaurant-shift-data');
  };

  // Smart server removal with automatic table reassignment
  const removeServer = async (serverId) => {
    const removedServer = shiftData.serverOrder.find(s => s.id === serverId);
    if (!removedServer || shiftData.serverCount <= 1) {
      return { success: false, message: "Cannot remove the last server" };
    }

    const newServerCount = shiftData.serverCount - 1;
    
    try {
      // Call backend to automatically reconfigure sections
      // At the top of ShiftContext.js, add this import:

// Then in both removeServer and addServer functions, update the fetch calls:
const response = await fetch('http://localhost:3001/api/shifts/quick-setup', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authService.getToken()}` // ADD THIS LINE
  },
  body: JSON.stringify({ serverCount: newServerCount })
});
      
      if (!response.ok) throw new Error('Failed to reconfigure sections');
      
      // Update local state after successful backend reconfiguration
      const remainingServers = shiftData.serverOrder
        .filter(s => s.id !== serverId)
        .map((server, index) => ({
          ...server,
          section: index + 1 // Reassign section numbers sequentially
        }));
      
      const updatedShiftData = {
        ...shiftData,
        serverCount: newServerCount,
        serverOrder: remainingServers,
        lastChange: {
          type: 'server_removed',
          removedServer,
          timestamp: new Date(),
          message: `${removedServer.name} removed - switched to ${newServerCount}-server configuration`
        }
      };
      
      setShiftData(updatedShiftData);
      localStorage.setItem('restaurant-shift-data', JSON.stringify(updatedShiftData));
      
      return {
        success: true,
        message: `${removedServer.name} sent home - switched to ${newServerCount}-server configuration`,
        removedServer
      };
      
    } catch (error) {
      console.error('Failed to reconfigure sections:', error);
      return { 
        success: false, 
        message: "Failed to reconfigure sections. Please try again." 
      };
    }
  };

  // Add server mid-shift with automatic reconfiguration
  const addServer = async (serverName) => {
    const newServerCount = shiftData.serverCount + 1;
    
    try {
// At the top of ShiftContext.js, add this import:

// Then in both removeServer and addServer functions, update the fetch calls:
const response = await fetch('http://localhost:3001/api/shifts/quick-setup', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authService.getToken()}` // ADD THIS LINE
  },
  body: JSON.stringify({ serverCount: newServerCount })
});
      
      if (!response.ok) throw new Error('Failed to reconfigure sections');
      
      // Update local state after successful backend reconfiguration
      const newServerId = Math.max(...shiftData.serverOrder.map(s => s.id), 0) + 1;
      const newServer = {
        id: newServerId,
        name: serverName,
        section: newServerCount
      };

      const updatedServerOrder = [...shiftData.serverOrder, newServer];
      const updatedShiftData = {
        ...shiftData,
        serverCount: newServerCount,
        serverOrder: updatedServerOrder,
        lastChange: {
          type: 'server_added',
          addedServer: newServer,
          timestamp: new Date(),
          message: `${serverName} added - switched to ${newServerCount}-server configuration`
        }
      };

      setShiftData(updatedShiftData);
      localStorage.setItem('restaurant-shift-data', JSON.stringify(updatedShiftData));

      return {
        success: true,
        message: `${serverName} added - sections reconfigured for ${newServerCount} servers`,
        newServer
      };
      
    } catch (error) {
      console.error('Failed to add server and reconfigure:', error);
      return { 
        success: false, 
        message: "Failed to add server and reconfigure sections. Please try again." 
      };
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
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
};