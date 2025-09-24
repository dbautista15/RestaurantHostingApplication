class RestaurantApiClient {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      },
      ...options
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // Auth
  async login(clockInNumber, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ clockInNumber, password })
    });
  }

  // Dashboard - ONE CALL gets everything
  async getDashboardData() {
    return this.request('/dashboard');
  }

  // Seating - ALL seating operations through one endpoint
  async getSuggestions() {
    return this.request('/seating/suggestions');
  }

  async seatParty(partyId, options = {}) {
    return this.request('/seating/seat-party', {
      method: 'POST',
      body: JSON.stringify({ partyId, options })
    });
  }

  async seatManually(tableNumber, partySize) {
    return this.request(`/seating/manual/${tableNumber}`, {
      method: 'PUT',
      body: JSON.stringify({ partySize })
    });
  }

  async getFairnessMatrix() {
    return this.request('/seating/fairness-matrix');
  }

  // Waitlist
  async getWaitlist() {
    return this.request('/waitlist');
  }

  async addToWaitlist(partyData) {
    return this.request('/waitlist', {
      method: 'POST',
      body: JSON.stringify(partyData)
    });
  }

  // Tables (read-only)
  async getTables() {
    return this.request('/tables');
  }

  async getTablesBySection(section) {
    return this.request(`/tables/section/${section}`);
  }
}

export const apiClient = new RestaurantApiClient();