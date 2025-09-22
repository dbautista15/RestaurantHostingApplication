// frontend/src/hooks/useWaitlist.js
import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { MOCK_WAITLIST, DEV_CONFIG } from '../config/constants';

export const useWaitlist = () => {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // ✅ NEW: Update party function
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

  const updatePartyStatus = async (entryId, status) => {
    try {
      await apiService.updateWaitlistStatus(entryId, status);
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    } catch (error) {
      console.error('Failed to update status:', error);
      // Still remove from local state for better UX
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    }
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
    waitlist,
    loading,
    error,
    addParty,
    updateParty, // ✅ NEW: Export update function
    updatePartyStatus,
    removeParty,
    loadWaitlist
  };
};