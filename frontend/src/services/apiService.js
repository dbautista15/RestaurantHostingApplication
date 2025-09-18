import { API_BASE } from '../config/constants';
import { authService } from './authService';

export const apiService = {
  async request(endpoint, options = {}) {
    const token = authService.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  },

  async getWaitlist() {
    return this.request('/waitlist');
  },

  async addToWaitlist(partyData) {
    return this.request('/waitlist', {
      method: 'POST',
      body: JSON.stringify(partyData)
    });
  },

  async updateWaitlistStatus(id, partyStatus) {
    return this.request(`/waitlist/${id}/partyStatus`, {
      method: 'PUT',
      body: JSON.stringify({ partyStatus })
    });
  },

  async removeFromWaitlist(id) {
    return this.request(`/waitlist/${id}`, {
      method: 'DELETE'
    });
  }
};