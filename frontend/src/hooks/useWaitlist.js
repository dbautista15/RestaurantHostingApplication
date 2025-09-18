import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

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
      // Fallback to mock data for development
      setWaitlist([
        { _id: '1', partyName: 'Smith', partySize: 4, phoneNumber: '555-0123', priority: 'normal', createdAt: new Date(Date.now() - 15*60000) },
        { _id: '2', partyName: 'Johnson', partySize: 2, phoneNumber: '555-0456', priority: 'coworker', createdAt: new Date(Date.now() - 8*60000) },
        { _id: '3', partyName: 'Williams', partySize: 8, phoneNumber: '555-0789', priority: 'large_party', createdAt: new Date(Date.now() - 22*60000) }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addParty = async (partyData) => {
    try {
      await apiService.addToWaitlist(partyData);
      loadWaitlist();
    } catch (error) {
      console.error('Failed to add party:', error);
      const newEntry = {
        _id: Date.now().toString(),
        ...partyData,
        createdAt: new Date()
      };
      setWaitlist(prev => [...prev, newEntry]);
    }
  };

  const updatePartyStatus = async (entryId, status) => {
    try {
      await apiService.updateWaitlistStatus(entryId, status);
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    } catch (error) {
      console.error('Failed to update status:', error);
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    }
  };

  const removeParty = async (entryId) => {
    try {
      await apiService.removeFromWaitlist(entryId);
      setWaitlist(prev => prev.filter(entry => entry._id !== entryId));
    } catch (error) {
      console.error('Failed to remove party:', error);
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
    updatePartyStatus,
    removeParty,
    loadWaitlist
  };
};