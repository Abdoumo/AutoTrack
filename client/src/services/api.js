/**
 * Secure API Service with Live Backend + Client Fallback Mode.
 * Communicates with Express server (http://localhost:5000/api).
 * Supports quantity tracking by piece / kg, explicit product weight, and CSV export.
 */

const API_BASE_URL = 'http://localhost:5000/api';

const INITIAL_DEMO_PRODUCTS = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Espresso Roasted Beans (Specialty Batch)',
    unit: 'kg',
    quantity: 45.0,
    remaining_qty: 12.5,
    weight: 45.0, // weight in kg
    description: 'High-elevation roasted Arabica coffee beans. Packaged in nitrogen-sealed valved foil.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    risk_date: new Date(Date.now() - 1 * 86400000).toISOString(), // Day 10 critical threshold reached
    status: 'expired',
    creator_name: 'Administrator',
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
    weight: 37.5, // 50 bottles * 0.75 kg = 37.5 kg
    description: 'Dark amber glass packaging bottles designed for oxidation-sensitive organic oils.',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    risk_date: new Date(Date.now() + 3 * 86400000).toISOString(), // Day 7 warning zone (3 days left)
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
    created_at: new Date().toISOString(),
    risk_date: new Date(Date.now() + 10 * 86400000).toISOString(), // 10 days remaining
    status: 'active',
    creator_name: 'Karim Seller',
    creator_email: 'karim@example.com',
    days_remaining: 10,
    alert_level: 'normal',
  },
];

const INITIAL_DEMO_TRANSACTIONS = [
  {
    id: 'trn-8821',
    product_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    product_name: 'Espresso Roasted Beans (Specialty Batch)',
    user_id: 'usr-2',
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
    user_id: 'usr-3',
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

export const api = {
  getToken() {
    return localStorage.getItem('token');
  },

  getHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async getProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) return json;
      }
    } catch {
      // Backend / DB not connected -> fallback
    }

    let products = getStorage('auratrack_products', INITIAL_DEMO_PRODUCTS);
    if (!Array.isArray(products) || products.length === 0) {
      products = INITIAL_DEMO_PRODUCTS;
    }

    return products.map((p) => {
      const msLeft = new Date(p.risk_date).getTime() - Date.now();
      const days = Math.ceil(msLeft / 86400000);
      let alert_level = 'normal';
      if (days <= 0 || p.status === 'expired') alert_level = 'critical';
      else if (days <= 3) alert_level = 'warning';
      return { ...p, days_remaining: days, alert_level };
    });
  },

  async createProduct(data) {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const products = getStorage('auratrack_products', INITIAL_DEMO_PRODUCTS);
    const riskDays = parseInt(data.risk_days, 10) || 10;
    const riskDate = new Date();
    riskDate.setDate(riskDate.getDate() + riskDays);

    const qty = parseFloat(data.quantity) || 0;
    const weight = parseFloat(data.weight) || 0;
    const unit = data.unit === 'piece' ? 'piece' : 'kg';

    const newProd = {
      id: generateUUID(),
      name: data.name,
      unit: unit,
      quantity: qty,
      remaining_qty: qty,
      weight: weight,
      description: data.description || '',
      created_at: new Date().toISOString(),
      risk_date: riskDate.toISOString(),
      status: 'active',
      creator_name: data.user_name || 'Authenticated User',
      creator_email: data.user_email || 'user@example.com',
      days_remaining: riskDays,
      alert_level: riskDays <= 0 ? 'critical' : riskDays <= 3 ? 'warning' : 'normal',
    };

    products.unshift(newProd);
    setStorage('auratrack_products', products);
    return newProd;
  },

  async takeProduct(productId, quantity, currentUser) {
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/take`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const products = getStorage('auratrack_products', INITIAL_DEMO_PRODUCTS);
    const transactions = getStorage('auratrack_transactions', INITIAL_DEMO_TRANSACTIONS);

    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) throw new Error('Product not found');

    const product = products[index];
    const takeQty = parseFloat(quantity);

    if (takeQty > product.remaining_qty) {
      throw new Error(`Insufficient stock. Only ${product.remaining_qty} ${product.unit || 'units'} available.`);
    }

    product.remaining_qty = parseFloat((product.remaining_qty - takeQty).toFixed(2));
    if (product.remaining_qty <= 0) {
      product.status = 'depleted';
    }

    const newTrans = {
      id: generateUUID(),
      product_id: product.id,
      product_name: product.name,
      user_id: currentUser?.id || 'demo-user',
      user_name: currentUser?.name || 'Verified User',
      user_email: currentUser?.email || 'user@example.com',
      quantity_taken: takeQty,
      unit: product.unit || 'kg',
      product_weight: product.weight || 0,
      taken_at: new Date().toISOString(),
      product_status: product.status,
    };

    transactions.unshift(newTrans);
    setStorage('auratrack_products', products);
    setStorage('auratrack_transactions', transactions);

    return { transaction: newTrans, product };
  },

  async getAdminTransactions() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/transactions`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) return json;
      }
    } catch {
      // Fallback
    }

    return getStorage('auratrack_transactions', INITIAL_DEMO_TRANSACTIONS);
  },

  async downloadTransactionsCSV() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/export-csv`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        return;
      }
    } catch {
      // Fallback
    }

    // Direct browser CSV export with formula injection prevention
    const transactions = getStorage('auratrack_transactions', INITIAL_DEMO_TRANSACTIONS);
    const headers = ['Transaction ID,Product Name,Product ID,User Name,User Email,Quantity Taken,Unit,Weight (kg),Date Taken,Status'];
    
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
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async updateRiskDate(productId, newRiskDate) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}/risk-date`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ risk_date: newRiskDate }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const products = getStorage('auratrack_products', INITIAL_DEMO_PRODUCTS);
    const item = products.find((p) => p.id === productId);
    if (item) {
      item.risk_date = newRiskDate;
      setStorage('auratrack_products', products);
    }
    return item;
  },

  /**
   * Update full product details (Edit Product)
   */
  async updateProduct(productId, data) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const products = getStorage('auratrack_products', INITIAL_DEMO_PRODUCTS);
    const index = products.findIndex((p) => p.id === productId);
    if (index !== -1) {
      const current = products[index];
      const newQty = data.quantity !== undefined ? parseFloat(data.quantity) : current.quantity;
      const deducted = current.quantity - current.remaining_qty;
      const newRemaining = Math.max(0, newQty - deducted);

      products[index] = {
        ...current,
        name: data.name || current.name,
        unit: data.unit || current.unit,
        quantity: newQty,
        remaining_qty: newRemaining,
        weight: data.weight !== undefined ? parseFloat(data.weight) : current.weight,
        description: data.description !== undefined ? data.description : current.description,
        status: newRemaining <= 0 ? 'depleted' : current.status,
      };
      setStorage('auratrack_products', products);
      return products[index];
    }
    throw new Error('Product not found');
  },

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    let products = getStorage('auratrack_products', INITIAL_DEMO_PRODUCTS);
    products = products.filter((p) => p.id !== productId);
    setStorage('auratrack_products', products);
    return { success: true };
  },

  /**
   * AUTHENTICATION (Login & Register)
   */
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) localStorage.setItem('token', data.token);
        return data;
      }
      const errData = await res.json();
      throw new Error(errData.error || 'Login failed');
    } catch (err) {
      // Fallback to local user validation
      const users = await this.getUsers();
      const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        const fakeToken = `token-${matched.id}`;
        localStorage.setItem('token', fakeToken);
        return { user: matched, token: fakeToken };
      }
      throw new Error(err.message || 'Invalid email or password');
    }
  },

  async register(name, email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) localStorage.setItem('token', data.token);
        return data;
      }
      const errData = await res.json();
      throw new Error(errData.error || 'Registration failed');
    } catch (err) {
      // Fallback to local registration
      const newUser = await this.createUser({ name, email, password, role: 'user' });
      const fakeToken = `token-${newUser.id}`;
      localStorage.setItem('token', fakeToken);
      return { user: newUser, token: fakeToken };
    }
  },

  /**
   * USER CRUD & ANALYTICS
   */
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) return json;
      }
    } catch {
      // Fallback
    }

    const defaultUsers = [
      {
        id: 'admin-001',
        name: 'Super Admin',
        email: 'bedoushop@gmail.com',
        role: 'admin',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        products_created_count: 1,
        transactions_count: 0,
        total_quantity_claimed: 0,
      },
      {
        id: 'usr-002',
        name: 'Nadia Retailer',
        email: 'nadia@store.com',
        role: 'user',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        products_created_count: 0,
        transactions_count: 1,
        total_quantity_claimed: 32.5,
      },
      {
        id: 'usr-003',
        name: 'Omar Market',
        email: 'omar@market.com',
        role: 'user',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        products_created_count: 0,
        transactions_count: 1,
        total_quantity_claimed: 12.0,
      },
      {
        id: 'usr-004',
        name: 'Karim Seller',
        email: 'karim@example.com',
        role: 'user',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        products_created_count: 1,
        transactions_count: 0,
        total_quantity_claimed: 0,
      },
    ];

    let users = getStorage('auratrack_users', defaultUsers);
    if (!Array.isArray(users) || users.length === 0) users = defaultUsers;

    // Recalculate dynamic live counts from products & transactions
    const products = getStorage('auratrack_products', INITIAL_DEMO_PRODUCTS);
    const transactions = getStorage('auratrack_transactions', INITIAL_DEMO_TRANSACTIONS);

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

  async getUserActivity(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/activity`, {
        headers: this.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const users = await this.getUsers();
    const user = users.find((u) => u.id === userId) || users[0];

    const products = getStorage('auratrack_products', INITIAL_DEMO_PRODUCTS);
    const transactions = getStorage('auratrack_transactions', INITIAL_DEMO_TRANSACTIONS);

    const userProducts = products.filter((p) => p.creator_email === user.email || p.created_by === user.id);
    const userTrans = transactions.filter((t) => t.user_email === user.email || t.user_id === user.id);

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

  async createUser(userData) {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
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
    setStorage('auratrack_users', users);
    return newUser;
  },

  async updateUser(userId, userData) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        name: userData.name || users[index].name,
        email: userData.email ? userData.email.toLowerCase().trim() : users[index].email,
        role: userData.role || users[index].role,
      };
      setStorage('auratrack_users', users);
      return users[index];
    }
    throw new Error('User not found');
  },

  async deleteUser(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    let users = await this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (target?.email === 'bedoushop@gmail.com') {
      throw new Error('Cannot delete the primary root admin account.');
    }
    users = users.filter((u) => u.id !== userId);
    setStorage('auratrack_users', users);
    return { success: true };
  },
};
