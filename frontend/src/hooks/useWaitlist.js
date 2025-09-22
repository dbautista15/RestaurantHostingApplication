// frontend/src/hooks/useWaitlist.js
import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { MOCK_WAITLIST, DEV_CONFIG } from '../config/constants';

export const useWaitlist = () => {
  const [waitlist, setWaitlist] = useState([]);
  const [recentlySeated, setRecentlySeated] = useState([]); // ✅ NEW: Recently seated parties
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ NEW: Load recently seated from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('restaurant-recently-seated');
      if (saved) {
        const parsedSeated = JSON.parse(saved);
        // Filter out expired entries (older than 30 minutes)
        const cutoffTime = Date.now() - (30 * 60 * 1000);
        const validSeated = parsedSeated.filter(party => 
          new Date(party.seatedAt).getTime() > cutoffTime
        );
        
        if (validSeated.length !== parsedSeated.length) {
          // Some entries expired, save the cleaned list
          localStorage.setItem('restaurant-recently-seated', JSON.stringify(validSeated));
        }
        
        setRecentlySeated(validSeated);
      }
    } catch (error) {
      console.error('Error loading recently seated from localStorage:', error);
      setRecentlySeated([]);
    }
  }, []);

  // ✅ NEW: Save recently seated to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('restaurant-recently-seated', JSON.stringify(recentlySeated));
    } catch (error) {
      console.error('Error saving recently seated to localStorage:', error);
    }
  }, [recentlySeated]);

  // ✅ NEW: Cleanup expired recently seated entries every 5 minutes
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const cutoffTime = Date.now() - (30 * 60 * 1000);
      setRecentlySeated(prev => 
        prev.filter(party => new Date(party.seatedAt).getTime() > cutoffTime)
      );
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  const loadWaitlist = async () => {
    try {
      setLoading(true);
      const data = await apiService.getWaitlist();
      setWaitlist(data.waitlist || []);
    } catch (err) {
      setError(err.message);
      
      // ✅ CONSOLIDATED: Use centralized mock data instead of hardcoded
      if (DEV_CONFIG.ENABLE_MOCK_DATA) {
        console.warn('Using mock waitlist data for development');
        setWaitlist(MOCK_WAITLIST);
      } else {
        // Production fallback to empty array
        setWaitlist([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const addParty = async (partyData) => {
    try {
      const response = await apiService.addToWaitlist(partyData);
      // ✅ IMPROVED: Add the actual returned entry to state
      if (response.success && response.waitlist) {
        setWaitlist(prev => [...prev, response.waitlist]);
      } else {
        // Fallback: reload entire waitlist
        loadWaitlist();
      }
    } catch (error) {
      console.error('Failed to add party:', error);
      
      // ✅ IMPROVED: Better fallback with consistent ID generation
      const newEntry = {
        _id: `mock_${Date.now()}`,
        ...partyData,
        createdAt: new Date()
      };
      setWaitlist(prev => [...prev, newEntry]);
    }
  };

  const updateParty = async (entryId, updateData) => {
    try {
      const response = await apiService.updateWaitlistEntry(entryId, updateData);
      
      if (response.success && response.waitlist) {
        // Update the specific entry in state
        setWaitlist(prev => prev.map(entry => 
          entry._id === entryId ? response.waitlist : entry
        ));
      } else {
        // Fallback: reload entire waitlist
        loadWaitlist();
      }
    } catch (error) {
      console.error('Failed to update party:', error);
      
      // Optimistic update for better UX
      setWaitlist(prev => prev.map(entry => 
        entry._id === entryId ? { ...entry, ...updateData } : entry
      ));
      
      throw error; // Re-throw so UI can handle the error
    }
  };

  // ✅ MODIFIED: Move parties to recently seated instead of deleting
  const updatePartyStatus = async (entryId, status, partyInfo = null) => {
    const party = waitlist.find(entry => entry._id === entryId);
    if (!party) {
      console.warn('Party not found for status update:', entryId);
      return { success: false, party: null };
    }

    try {
      await apiService.updateWaitlistStatus(entryId, status);
      
      // Remove from waitlist
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
      
      // ✅ NEW: If seated, add to recently seated
      if (status === 'seated') {
        const seatedParty = {
          ...party,
          seatedAt: new Date().toISOString(),
          originalPosition: waitlist.findIndex(entry => entry._id === entryId), // Track original position for restoration
          // ✅ NEW: Store additional seating info for floor plan integration
          seatingInfo: partyInfo
        };
        
        setRecentlySeated(prev => {
          // Add to beginning and keep only last 20 entries
          const updated = [seatedParty, ...prev].slice(0, 20);
          return updated;
        });
      }
      
      // ✅ NEW: Return party data for Dashboard to handle floor plan updates
      return { success: true, party };
    } catch (error) {
      console.error('Failed to update status:', error);
      
      // Still remove from waitlist for better UX, but also add to recently seated
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
      
      if (status === 'seated') {
        const seatedParty = {
          ...party,
          seatedAt: new Date().toISOString(),
          originalPosition: waitlist.findIndex(entry => entry._id === entryId),
          seatingInfo: partyInfo
        };
        
        setRecentlySeated(prev => [seatedParty, ...prev].slice(0, 20));
      }
      
      // ✅ NEW: Still return party data even on error for optimistic updates
      return { success: false, party };
    }
  };

  // ✅ NEW: Restore party from recently seated back to waitlist
  const restoreParty = async (seatedPartyId) => {
    const seatedParty = recentlySeated.find(party => party._id === seatedPartyId);
    if (!seatedParty) {
      console.warn('Seated party not found for restoration:', seatedPartyId);
      return;
    }

    try {
      // Create restored party data (remove seating metadata)
      const { seatedAt, originalPosition, ...partyData } = seatedParty;
      
      // Try to add back to waitlist via API
      const response = await apiService.addToWaitlist({
        ...partyData,
        // Override with original ID to maintain consistency
        _id: seatedParty._id,
        // Reset to waiting status
        partyStatus: 'waiting'
      });

      // Remove from recently seated
      setRecentlySeated(prev => prev.filter(party => party._id !== seatedPartyId));

      // Add back to waitlist at appropriate position
      if (response.success && response.waitlist) {
        setWaitlist(prev => {
          // Try to restore at original position, or add to end if position is invalid
          const newWaitlist = [...prev];
          const insertPosition = Math.min(originalPosition || newWaitlist.length, newWaitlist.length);
          newWaitlist.splice(insertPosition, 0, response.waitlist);
          return newWaitlist;
        });
      } else {
        // Fallback: reload entire waitlist
        loadWaitlist();
      }

      return { success: true, message: `${seatedParty.partyName} restored to waitlist` };
    } catch (error) {
      console.error('Failed to restore party:', error);
      
      // Optimistic restoration for better UX
      const { seatedAt, originalPosition, ...partyData } = seatedParty;
      
      setRecentlySeated(prev => prev.filter(party => party._id !== seatedPartyId));
      setWaitlist(prev => {
        const newWaitlist = [...prev];
        const insertPosition = Math.min(originalPosition || newWaitlist.length, newWaitlist.length);
        newWaitlist.splice(insertPosition, 0, {
          ...partyData,
          partyStatus: 'waiting'
        });
        return newWaitlist;
      });

      return { success: false, message: 'Restored locally, but may not sync to server' };
    }
  };

  // ✅ NEW: Clear recently seated (for testing or manual cleanup)
  const clearRecentlySeated = () => {
    setRecentlySeated([]);
    localStorage.removeItem('restaurant-recently-seated');
  };

  const removeParty = async (entryId) => {
    try {
      await apiService.removeFromWaitlist(entryId);
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    } catch (error) {
      console.error('Failed to remove party:', error);
      // Still remove from local state for better UX
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    }
  };

  useEffect(() => {
    loadWaitlist();
  }, []);

  return {
    // Original exports
    waitlist,
    loading,
    error,
    addParty,
    updateParty,
    updatePartyStatus,
    removeParty,
    loadWaitlist,
    
    // ✅ NEW: Recently seated functionality
    recentlySeated,
    restoreParty,
    clearRecentlySeated
  };
};