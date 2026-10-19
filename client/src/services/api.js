/**
 * AuraTrack — Production API Service
 * Strictly communicates with backend REST endpoints powered by PostgreSQL.
 * ZERO mockup or simulation fallbacks.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * UUID generation helper
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Robust JSON response handler that surfaces actual backend error messages.
 */
async function handleResponse(res) {
  if (res.ok) {
    if (res.status === 204) return { success: true };
    return await res.json();
  }

  let errorMessage = `HTTP Error ${res.status}: ${res.statusText || 'Request failed'}`;
  try {
    const errorData = await res.json();
    if (errorData && (errorData.error || errorData.message)) {
      errorMessage = errorData.error || errorData.message;
    }
  } catch {
    // Non-JSON error body
  }

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('auratrack_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const error = new Error(errorMessage);
  error.status = res.status;
  throw error;
}

export const api = {
  /**
   * Current authentication bearer token from localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Construct standard HTTP request headers
   */
  getHeaders(extra = {}) {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  },

  /**
   * Health and Database Status check
   */
  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await handleResponse(res);
  },

  // ==========================================================
  // PRODUCTS CRUD & LIFECYCLE
  // ==========================================================

  /**
   * Fetch all active inventory products from PostgreSQL
   */
  async getProducts() {
    const res = await fetch(`${API_BASE_URL}/products`, {
      headers: this.getHeaders(),
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Fetch single product with history from PostgreSQL
   */
  async getProduct(productId) {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      headers: this.getHeaders(),
    });
    return await handleResponse(res);
  },

  /**
   * Capture a new product into PostgreSQL
   */
  async createProduct(data) {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  },

  /**
   * Update product properties (name, unit, quantity, weight, description, risk_date)
   */
  async updateProduct(productId, data) {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  },

  /**
   * Delete a product permanently from PostgreSQL (Admin only)
   */
  async deleteProduct(productId) {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return await handleResponse(res);
  },

  /**
   * Adjust risk threshold date directly in PostgreSQL (Admin only)
   */
  async updateRiskDate(productId, newRiskDate) {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/risk-date`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ risk_date: newRiskDate }),
    });
    return await handleResponse(res);
  },

  // ==========================================================
  // TRANSACTIONS & STOCK CLAIMS
  // ==========================================================

  /**
   * Claim stock with row-level transaction locking in PostgreSQL
   */
  async takeProduct(productId, quantity) {
    const res = await fetch(`${API_BASE_URL}/transactions/take`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        product_id: productId,
        quantity: parseFloat(quantity),
      }),
    });
    return await handleResponse(res);
  },

  /**
   * Retrieve ledger of all user claims and deductions (Admin only)
   */
  async getAdminTransactions() {
    const res = await fetch(`${API_BASE_URL}/admin/transactions`, {
      headers: this.getHeaders(),
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Stream live CSV export of all transactions from PostgreSQL
   */
  async downloadTransactionsCSV() {
    const res = await fetch(`${API_BASE_URL}/admin/export-csv`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      await handleResponse(res);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auratrack_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  /**
   * Authenticate against PostgreSQL users table
   */
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  /**
   * Register a new user into PostgreSQL
   */
  async register(name, email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  /**
   * Fetch profile for current token
   */
  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });
    return await handleResponse(res);
  },

  // ==========================================================
  // USER MANAGEMENT & BEHAVIORAL ANALYTICS (Admin)
  // ==========================================================

  /**
   * Get all registered accounts with aggregate activity metrics
   */
  async getUsers() {
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getHeaders(),
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get granular activity logs and metrics for a specific user
   */
  async getUserActivity(userId) {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/activity`, {
      headers: this.getHeaders(),
    });
    return await handleResponse(res);
  },

  /**
   * Create user account in PostgreSQL
   */
  async createUser(userData) {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    return await handleResponse(res);
  },

  /**
   * Update user details or reset password in PostgreSQL
   */
  async updateUser(userId, userData) {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    return await handleResponse(res);
  },

  /**
   * Delete user from PostgreSQL
   */
  async deleteUser(userId) {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return await handleResponse(res);
  },

  // ==========================================================
  // EMAIL ALERTS & SYSTEM TESTS
  // ==========================================================

  async sendTestEmail(targetEmail) {
    const res = await fetch(`${API_BASE_URL}/admin/send-test-email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetEmail }),
    });
    return await handleResponse(res);
  },
};
