// frontend/src/services/smartSeatingService.js
import { API_BASE } from '../config/constants';
import { useAuth } from '../hooks/useAuth';
export const smartSeatingService = {
  /**
   * 🎯 GET SUGGESTIONS FROM BACKEND
   * Replaces all frontend suggestion logic
   */
  async getSuggestions() {
    const response = await fetch(`${API_BASE}/smart-seating/suggestions`, {
      headers: {
        'Authorization': `Bearer ${useAuth.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get suggestions');
    }

    return response.json();
  },

  /**
   * 🎯 EXECUTE SMART ASSIGNMENT
   * Lets backend handle all assignment logic
   */
  async assignParty(partyId, manualTableId = null) {
    const response = await fetch(`${API_BASE}/smart-seating/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useAuth.getToken()}`
      },
      body: JSON.stringify({ partyId, manualTableId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Assignment failed');
    }

    return response.json();
  },

  /**
   * 🎯 GET FAIRNESS MATRIX
   * Backend provides current fairness state
   */
  async getFairnessMatrix() {
    const response = await fetch(`${API_BASE}/smart-seating/fairness-matrix`, {
      headers: {
        'Authorization': `Bearer ${useAuth.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get fairness matrix');
    }

    return response.json();
  },

  /**
   * 🎯 MANUAL TABLE SEATING
   * For floor plan direct interactions
   */
  async seatManually(tableNumber, partySize) {
    const response = await fetch(`${API_BASE}/smart-seating/table/${tableNumber}/manual-seat`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useAuth.getToken()}`
      },
      body: JSON.stringify({ partySize })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Manual seating failed');
    }

    return response.json();
  }
};
