/**
 * AuraTrack — Robust API Service with Seamless Local Storage Fallback
 * Works both with a live PostgreSQL backend server AND in 100% standalone
 * browser mode (no local database required).
 * Prevents HTML/doctype parse errors when the backend is offline.
 */

import {
  COFFEE_BEANS_PHOTO,
  GLASS_BOTTLES_PHOTO,
  HONEY_JAR_PHOTO,
  COFFEE_BOX_PHOTO,
  DEFAULT_PRODUCT_PHOTO,
  getRealisticProductPhoto,
} from './realPhotos.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const STORAGE_KEYS = {
  PRODUCTS: 'auratrack_products',
  TRANSACTIONS: 'auratrack_transactions',
  USERS: 'auratrack_users',
  TOKEN: 'token',
  USER: 'auratrack_user',
};

/**
 * Initial demo products with embedded real photography (100% offline, guaranteed visible)
 */
const INITIAL_DEMO_PRODUCTS = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Espresso Roasted Beans (Specialty Batch)',
    unit: 'kg',
    quantity: 45.0,
    remaining_qty: 12.5,
    weight: 45.0,
    description: 'High-elevation roasted Arabica coffee beans. Packaged in nitrogen-sealed valved foil.',
    image: COFFEE_BEANS_PHOTO,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    risk_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: 'expired',
    creator_name: 'Super Admin',
    creator_email: 'bedoushop@gmail.com',
    days_remaining: -1,
    alert_level: 'critical',
  },
  {
    id: '8a9c13b2-6d2e-4b91-9871-2b63718910ac',
    name: 'Cold-Pressed Glass Bottles (750ml)',
    unit: 'piece',
    quantity: 50.0,
    remaining_qty: 50.0,
    piece_weight: 0.75,
    weight: 37.5,
    description: 'Dark amber glass packaging bottles designed for oxidation-sensitive organic oils.',
    image: GLASS_BOTTLES_PHOTO,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    risk_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: 'active',
    creator_name: 'Mohammed B.',
    creator_email: 'mohammed@example.com',
    days_remaining: 3,
    alert_level: 'warning',
  },
  {
    id: '3c12d45a-8b9e-4c77-b912-98ab23cd45ef',
    name: 'Wildflower Alpine Honey (Raw Extract)',
    unit: 'kg',
    quantity: 60.0,
    remaining_qty: 48.0,
    weight: 60.0,
    description: 'Freshly harvested unpasteurized honey from high-altitude wild blossoms.',
    image: HONEY_JAR_PHOTO,
    created_at: new Date().toISOString(),
    risk_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'active',
    creator_name: 'Karim Seller',
    creator_email: 'karim@example.com',
    days_remaining: 10,
    alert_level: 'normal',
  },
];

/**
 * Initial demo users when running without database
 */
const INITIAL_DEMO_USERS = [
  {
    id: 'admin-001',
    name: 'Super Admin',
    email: 'bedoushop@gmail.com',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'usr-002',
    name: 'Nadia Retailer',
    email: 'nadia@store.com',
    role: 'user',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'usr-003',
    name: 'Omar Market',
    email: 'omar@market.com',
    role: 'user',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'usr-004',
    name: 'Karim Seller',
    email: 'karim@example.com',
    role: 'user',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

/**
 * Initial demo transactions when running without database
 */
const INITIAL_DEMO_TRANSACTIONS = [
  {
    id: 'trn-8821',
    product_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    product_name: 'Espresso Roasted Beans (Specialty Batch)',
    user_id: 'usr-002',
    user_name: 'Nadia Retailer',
    user_email: 'nadia@store.com',
    quantity_taken: 32.5,
    unit: 'kg',
    product_weight: 45.0,
    taken_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    product_status: 'expired',
  },
  {
    id: 'trn-9104',
    product_id: '3c12d45a-8b9e-4c77-b912-98ab23cd45ef',
    product_name: 'Wildflower Alpine Honey (Raw Extract)',
    user_id: 'usr-003',
    user_name: 'Omar Market',
    user_email: 'omar@market.com',
    quantity_taken: 12.0,
    unit: 'kg',
    product_weight: 60.0,
    taken_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    product_status: 'active',
  },
];

function getStorage(key, defaultVal) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('Storage set failed', err);
  }
}

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
 * Safe fetch JSON handler that guards against HTML (<!doctype html>) responses
 * and network errors, preventing SyntaxError: Unexpected token '<'.
 */
async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If response is HTML (such as Vite SPA fallback <!doctype html> or server error page)
    if (contentType.includes('text/html') || !contentType.includes('application/json')) {
      return { ok: false, isHtml: true, status: res.status };
    }

    if (res.status === 204) {
      return { ok: true, status: 204, data: { success: true } };
    }

    let data;
    try {
      data = await res.json();
    } catch {
      return { ok: false, parseError: true, status: res.status };
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Network error (backend server not reachable / ECONNREFUSED)
    return { ok: false, isNetworkError: true, error: err };
  }
}

export const api = {
  /**
   * Current authentication bearer token from localStorage
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
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
    const netRes = await safeFetchJson(`${API_BASE_URL}/health`);
    if (netRes.ok && netRes.data) {
      return netRes.data;
    }
    return {
      status: 'healthy',
      database: {
        connected: false,
        mode: 'standalone_local_storage',
      },
      timestamp: new Date().toISOString(),
      service: 'AuraTrack Inventory (Local Storage Mode)',
    };
  },

  // ==========================================================
  // PRODUCTS CRUD & LIFECYCLE
  // ==========================================================

  /**
   * Fetch all active inventory products
   */
  async getProducts() {
    const netRes = await safeFetchJson(`${API_BASE_URL}/products`, {
      headers: this.getHeaders(),
    });

    if (netRes.ok && Array.isArray(netRes.data)) {
      return netRes.data;
    }

    // Offline / LocalStorage fallback
    let products = getStorage(STORAGE_KEYS.PRODUCTS, null);
    if (!Array.isArray(products) || products.length === 0) {
      products = INITIAL_DEMO_PRODUCTS;
      setStorage(STORAGE_KEYS.PRODUCTS, products);
    } else {
      // Ensure all stored products have real photography
      let updated = false;
      products = products.map((p) => {
        const cur = p.image || p.image_url;
        if (!cur || typeof cur !== 'string' || cur.trim() === '' || cur.startsWith('data:image/svg+xml')) {
          const realPhoto = getRealisticProductPhoto(p);
          updated = true;
          return { ...p, image: realPhoto };
        }
        return p;
      });
      if (updated) {
        setStorage(STORAGE_KEYS.PRODUCTS, products);
      }
    }

    return products.map((p) => {
      const riskTime = new Date(p.risk_date || Date.now() + 10 * 86400000).getTime();
      const msLeft = riskTime - Date.now();
      const days = Math.ceil(msLeft / 86400000);
      let alert_level = 'normal';
      if (days <= 0 || p.status === 'expired') alert_level = 'critical';
      else if (days <= 3) alert_level = 'warning';
      return {
        ...p,
        days_remaining: days,
        alert_level,
      };
    });
  },

  /**
   * Fetch single product with transaction history
   */
  async getProduct(productId) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/products/${productId}`, {
      headers: this.getHeaders(),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    const products = await this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Produit non trouvé');

    const transactions = await this.getAdminTransactions();
    const history = transactions.filter((t) => t.product_id === productId);

    return { product, history };
  },

  /**
   * Capture a new product into inventory
   */
  async createProduct(data) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    // Offline / LocalStorage fallback
    let products = getStorage(STORAGE_KEYS.PRODUCTS, INITIAL_DEMO_PRODUCTS);
    const riskDays = parseInt(data.risk_days, 10) || 10;
    const riskDate = new Date();
    riskDate.setDate(riskDate.getDate() + riskDays);

    const qty = parseFloat(data.quantity) || 0;
    const weight = parseFloat(data.weight) || 0;
    const pieceWeight = data.piece_weight !== undefined && data.piece_weight !== null
      ? parseFloat(data.piece_weight)
      : (data.unit === 'piece' && qty > 0 ? parseFloat((weight / qty).toFixed(3)) : 1);
    const unit = data.unit === 'piece' ? 'piece' : 'kg';

    const newProd = {
      id: data.id || generateUUID(),
      name: data.name,
      unit: unit,
      quantity: qty,
      remaining_qty: qty,
      piece_weight: pieceWeight,
      weight: weight,
      description: data.description || '',
      image: data.image || getProductImage(data),
      created_at: new Date().toISOString(),
      risk_date: riskDate.toISOString(),
      status: 'active',
      creator_name: data.user_name || 'Admin',
      creator_email: data.user_email || 'bedoushop@gmail.com',
      days_remaining: riskDays,
      alert_level: riskDays <= 0 ? 'critical' : riskDays <= 3 ? 'warning' : 'normal',
    };

    products.unshift(newProd);
    setStorage(STORAGE_KEYS.PRODUCTS, products);
    return newProd;
  },

  /**
   * Update product properties
   */
  async updateProduct(productId, data) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    // Offline / LocalStorage fallback
    let products = getStorage(STORAGE_KEYS.PRODUCTS, INITIAL_DEMO_PRODUCTS);
    const index = products.findIndex((p) => p.id === productId);
    if (index !== -1) {
      const current = products[index];
      const newQty = data.quantity !== undefined ? parseFloat(data.quantity) : current.quantity;
      const deducted = Math.max(0, current.quantity - current.remaining_qty);
      const newRemaining = Math.max(0, newQty - deducted);
      const newWeight = data.weight !== undefined ? parseFloat(data.weight) : current.weight;
      const newPieceWeight = data.piece_weight !== undefined && data.piece_weight !== null
        ? parseFloat(data.piece_weight)
        : (data.unit === 'piece' && newQty > 0 ? parseFloat((newWeight / newQty).toFixed(3)) : current.piece_weight);

      products[index] = {
        ...current,
        name: data.name || current.name,
        unit: data.unit || current.unit,
        quantity: newQty,
        remaining_qty: newRemaining,
        piece_weight: newPieceWeight,
        weight: newWeight,
        description: data.description !== undefined ? data.description : current.description,
        image: data.image !== undefined ? data.image : current.image,
        status: newRemaining <= 0 ? 'depleted' : current.status,
      };
      setStorage(STORAGE_KEYS.PRODUCTS, products);
      return products[index];
    }
    throw new Error('Produit non trouvé');
  },

  /**
   * Delete a product permanently
   */
  async deleteProduct(productId) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (netRes.ok) {
      return netRes.data || { success: true };
    }

    // Offline / LocalStorage fallback
    let products = getStorage(STORAGE_KEYS.PRODUCTS, INITIAL_DEMO_PRODUCTS);
    products = products.filter((p) => p.id !== productId);
    setStorage(STORAGE_KEYS.PRODUCTS, products);
    return { success: true };
  },

  /**
   * Adjust risk threshold date directly
   */
  async updateRiskDate(productId, newRiskDate) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/products/${productId}/risk-date`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ risk_date: newRiskDate }),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    // Offline / LocalStorage fallback
    let products = getStorage(STORAGE_KEYS.PRODUCTS, INITIAL_DEMO_PRODUCTS);
    const item = products.find((p) => p.id === productId);
    if (item) {
      item.risk_date = newRiskDate;
      const msLeft = new Date(newRiskDate).getTime() - Date.now();
      item.days_remaining = Math.ceil(msLeft / 86400000);
      item.alert_level = item.days_remaining <= 0 ? 'critical' : item.days_remaining <= 3 ? 'warning' : 'normal';
      setStorage(STORAGE_KEYS.PRODUCTS, products);
      return item;
    }
    throw new Error('Produit non trouvé');
  },

  // ==========================================================
  // TRANSACTIONS & STOCK CLAIMS
  // ==========================================================

  /**
   * Claim stock with deduction & transaction logging
   */
  async takeProduct(productId, quantity, currentUser) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/transactions/take`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        product_id: productId,
        quantity: parseFloat(quantity),
      }),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    // Offline / LocalStorage fallback
    let products = getStorage(STORAGE_KEYS.PRODUCTS, INITIAL_DEMO_PRODUCTS);
    let transactions = getStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_DEMO_TRANSACTIONS);

    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) throw new Error('Produit non trouvé');

    const product = products[index];
    const takeQty = parseFloat(quantity);

    if (takeQty > product.remaining_qty) {
      throw new Error(`Stock insuffisant. Seulement ${product.remaining_qty} ${product.unit || 'unités'} disponibles.`);
    }

    product.remaining_qty = parseFloat((product.remaining_qty - takeQty).toFixed(2));
    if (product.remaining_qty <= 0) {
      product.status = 'depleted';
    }

    const newTrans = {
      id: generateUUID(),
      product_id: product.id,
      product_name: product.name,
      user_id: currentUser?.id || 'usr-demo',
      user_name: currentUser?.name || 'Utilisateur Démo',
      user_email: currentUser?.email || 'user@example.com',
      quantity_taken: takeQty,
      unit: product.unit || 'kg',
      product_weight: product.weight || 0,
      taken_at: new Date().toISOString(),
      product_status: product.status,
    };

    transactions.unshift(newTrans);
    setStorage(STORAGE_KEYS.PRODUCTS, products);
    setStorage(STORAGE_KEYS.TRANSACTIONS, transactions);

    return { transaction: newTrans, product };
  },

  /**
   * Retrieve ledger of all user claims and deductions
   */
  async getAdminTransactions() {
    const netRes = await safeFetchJson(`${API_BASE_URL}/admin/transactions`, {
      headers: this.getHeaders(),
    });

    if (netRes.ok && Array.isArray(netRes.data)) {
      return netRes.data;
    }

    return getStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_DEMO_TRANSACTIONS);
  },

  /**
   * Download CSV export of all transactions safely
   */
  async downloadTransactionsCSV() {
    try {
      const netRes = await fetch(`${API_BASE_URL}/admin/export-csv`, {
        headers: this.getHeaders(),
      });
      if (netRes.ok && netRes.headers.get('content-type')?.includes('csv')) {
        const blob = await netRes.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `auratrack_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback to client generation
    }

    const transactions = getStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_DEMO_TRANSACTIONS);
    const headers = ['Transaction ID,Product Name,Product Image Link,Product ID,User Name,User Email,Quantity Taken,Unit,Weight (kg),Date Taken,Status'];

    const sanitize = (val) => {
      let str = String(val || '').trim();
      if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = transactions.map((t) => [
      sanitize(t.id),
      sanitize(t.product_name),
      sanitize(t.product_id ? `http://localhost:5000/api/products/${t.product_id}/image` : 'N/A'),
      sanitize(t.product_id),
      sanitize(t.user_name),
      sanitize(t.user_email),
      sanitize(t.quantity_taken),
      sanitize(t.unit || 'kg'),
      sanitize(t.product_weight || 'N/A'),
      sanitize(t.taken_at),
      sanitize(t.product_status || 'active'),
    ].join(','));

    const csvContent = headers.concat(rows).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auratrack_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  /**
   * Authenticate user — Works with backend or in local offline mode
   */
  async login(email, password) {
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) throw new Error('Veuillez saisir votre email.');

    // 1. Attempt backend login first if running
    const netRes = await safeFetchJson(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (netRes.ok && netRes.data && netRes.data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, netRes.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(netRes.data.user));
      return netRes.data;
    }

    // If backend explicitly rejected credentials with JSON (not HTML fallback)
    if (!netRes.ok && !netRes.isHtml && !netRes.isNetworkError && netRes.status === 401 && netRes.data?.error) {
      throw new Error(netRes.data.error);
    }

    // 2. Offline / LocalStorage Mode Fallback
    const users = await this.getUsers();
    let matched = users.find((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());

    if (!matched) {
      // Auto-create local account so user can immediately sign in without friction
      const isAdminAccount = cleanEmail.toLowerCase() === 'bedoushop@gmail.com' || cleanEmail.toLowerCase().startsWith('admin');
      matched = {
        id: generateUUID(),
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: isAdminAccount ? 'admin' : 'user',
        created_at: new Date().toISOString(),
      };
      users.unshift(matched);
      setStorage(STORAGE_KEYS.USERS, users);
    }

    const token = `local-token-${matched.id}-${Date.now()}`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(matched));
    return { user: matched, token };
  },

  /**
   * Register a new user
   */
  async register(name, email, password) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) throw new Error('Veuillez saisir une adresse email.');

    // 1. Attempt backend registration first if running
    const netRes = await safeFetchJson(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
    });

    if (netRes.ok && netRes.data && netRes.data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, netRes.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(netRes.data.user));
      return netRes.data;
    }

    if (!netRes.ok && !netRes.isHtml && !netRes.isNetworkError && netRes.data?.error) {
      throw new Error(netRes.data.error);
    }

    // 2. Offline / LocalStorage Mode Fallback
    const users = await this.getUsers();
    let existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());
    const isAdminAccount = cleanEmail.toLowerCase() === 'bedoushop@gmail.com' || cleanEmail.toLowerCase().startsWith('admin');

    let userObj;
    if (existingIndex !== -1) {
      users[existingIndex].name = cleanName || users[existingIndex].name;
      userObj = users[existingIndex];
    } else {
      userObj = {
        id: generateUUID(),
        name: cleanName || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: isAdminAccount ? 'admin' : 'user',
        created_at: new Date().toISOString(),
      };
      users.unshift(userObj);
    }

    setStorage(STORAGE_KEYS.USERS, users);
    const token = `local-token-${userObj.id}-${Date.now()}`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
    return { user: userObj, token };
  },

  /**
   * Fetch current session profile
   */
  async getMe() {
    const netRes = await safeFetchJson(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // ignore
      }
    }
    return null;
  },

  // ==========================================================
  // USER MANAGEMENT & BEHAVIORAL ANALYTICS
  // ==========================================================

  /**
   * Get all registered accounts with aggregate activity metrics
   */
  async getUsers() {
    const netRes = await safeFetchJson(`${API_BASE_URL}/users`, {
      headers: this.getHeaders(),
    });

    if (netRes.ok && Array.isArray(netRes.data)) {
      return netRes.data;
    }

    let users = getStorage(STORAGE_KEYS.USERS, null);
    if (!Array.isArray(users) || users.length === 0) {
      users = INITIAL_DEMO_USERS;
      setStorage(STORAGE_KEYS.USERS, users);
    }

    const products = getStorage(STORAGE_KEYS.PRODUCTS, INITIAL_DEMO_PRODUCTS);
    const transactions = getStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_DEMO_TRANSACTIONS);

    return users.map((u) => {
      const userProducts = products.filter((p) => p.creator_email === u.email || p.created_by === u.id);
      const userTrans = transactions.filter((t) => t.user_email === u.email || t.user_id === u.id);
      const totalQty = userTrans.reduce((acc, cur) => acc + parseFloat(cur.quantity_taken || 0), 0);

      return {
        ...u,
        products_created_count: userProducts.length,
        transactions_count: userTrans.length,
        total_quantity_claimed: totalQty,
      };
    });
  },

  /**
   * Get granular activity logs and metrics for a specific user
   */
  async getUserActivity(userId) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/users/${userId}/activity`, {
      headers: this.getHeaders(),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    const users = await this.getUsers();
    const user = users.find((u) => u.id === userId) || users[0];

    const products = getStorage(STORAGE_KEYS.PRODUCTS, INITIAL_DEMO_PRODUCTS);
    const transactions = getStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_DEMO_TRANSACTIONS);

    const userProducts = products.filter((p) => p.creator_email === user?.email || p.created_by === user?.id);
    const userTrans = transactions.filter((t) => t.user_email === user?.email || t.user_id === user?.id);

    return {
      user,
      products_created: userProducts,
      transactions: userTrans,
      summary: {
        total_products_created: userProducts.length,
        total_claims_made: userTrans.length,
        total_quantity_claimed: userTrans.reduce((acc, cur) => acc + parseFloat(cur.quantity_taken || 0), 0),
      },
    };
  },

  /**
   * Create user account
   */
  async createUser(userData) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    const users = await this.getUsers();
    const newUser = {
      id: generateUUID(),
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      products_created_count: 0,
      transactions_count: 0,
      total_quantity_claimed: 0,
    };
    users.unshift(newUser);
    setStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  /**
   * Update user details
   */
  async updateUser(userId, userData) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    let users = await this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        name: userData.name || users[index].name,
        email: userData.email ? userData.email.toLowerCase().trim() : users[index].email,
        role: userData.role || users[index].role,
      };
      setStorage(STORAGE_KEYS.USERS, users);
      return users[index];
    }
    throw new Error('Utilisateur non trouvé');
  },

  /**
   * Delete user
   */
  async deleteUser(userId) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (netRes.ok) {
      return netRes.data || { success: true };
    }

    let users = await this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (target?.email === 'bedoushop@gmail.com') {
      throw new Error('Impossible de supprimer le compte Super Administrateur.');
    }
    users = users.filter((u) => u.id !== userId);
    setStorage(STORAGE_KEYS.USERS, users);
    return { success: true };
  },

  // ==========================================================
  // EMAIL ALERTS & SYSTEM TESTS
  // ==========================================================

  async sendTestEmail(targetEmail) {
    const netRes = await safeFetchJson(`${API_BASE_URL}/admin/send-test-email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetEmail }),
    });

    if (netRes.ok && netRes.data) {
      return netRes.data;
    }

    return {
      success: true,
      message: `[Mode Local] Notification email simulée avec succès pour ${targetEmail}`,
    };
  },
};
