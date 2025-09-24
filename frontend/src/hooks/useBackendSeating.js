// frontend/src/hooks/useBackendSeating.js
import { useState, useEffect } from 'react';
import { smartSeatingService } from '../services/smartSeatingService';

export const useBackendSeating = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [fairnessScore, setFairnessScore] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load suggestions from backend
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data = await smartSeatingService.getSuggestions();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setError(err.message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load fairness matrix from backend
  const loadFairnessMatrix = async () => {
    try {
      const data = await smartSeatingService.getFairnessMatrix();
      setMatrix(data.matrix || []);
      setWaiters(data.waiters || []);
      setFairnessScore(data.fairnessScore || 100);
    } catch (err) {
      console.error('Failed to load fairness matrix:', err);
      setError(err.message);
    }
  };

  // Assign party using backend logic
  const assignParty = async (partyId, manualTableId = null) => {
    try {
      setLoading(true);
      const result = await smartSeatingService.assignParty(partyId, manualTableId);
      
      // Refresh data after assignment
      await loadSuggestions();
      await loadFairnessMatrix();
      
      return result;
    } catch (err) {
      console.error('Failed to assign party:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Manual floor plan seating
  const seatManually = async (tableNumber, partySize) => {
    try {
      const result = await smartSeatingService.seatManually(tableNumber, partySize);
      
      // Refresh fairness matrix after manual seating
      await loadFairnessMatrix();
      
      return result;
    } catch (err) {
      console.error('Failed to seat manually:', err);
      setError(err.message);
      throw err;
    }
  };

  // Load initial data
  useEffect(() => {
    loadSuggestions();
    loadFairnessMatrix();
  }, []);

  return {
    // Data
    suggestions,
    matrix,
    waiters,
    fairnessScore,
    loading,
    error,
    
    // Actions
    assignParty,
    seatManually,
    refreshSuggestions: loadSuggestions,
    refreshMatrix: loadFairnessMatrix
  };
};