const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDatabase() {
  console.log('🔄 Checking database connection and schema...');
  try {
    const connTest = await pool.testConnection();
    if (!connTest.connected) {
      console.warn(`⚠️ Database connection pending: ${connTest.error}`);
      console.warn('👉 Please set a valid DATABASE_URL in server/.env (e.g. from Neon, Supabase, Render, Railway)');
      return false;
    }

    console.log(`✅ Connected to database: "${connTest.database}" as user: "${connTest.user}"`);

    // Ensure UUID generation works
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    } catch {
      // gen_random_uuid is standard in Postgres 13+
    }

    // 1. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        unit VARCHAR(10) DEFAULT 'kg' CHECK (unit IN ('kg', 'piece')),
        quantity DECIMAL(12, 2) NOT NULL CHECK (quantity >= 0),
        remaining_qty DECIMAL(12, 2) NOT NULL CHECK (remaining_qty >= 0),
        weight DECIMAL(12, 2) NOT NULL DEFAULT 0.0 CHECK (weight >= 0),
        description TEXT,
        risk_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'expired')),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Transactions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        quantity_taken DECIMAL(12, 2) NOT NULL CHECK (quantity_taken > 0),
        unit VARCHAR(10) DEFAULT 'kg' CHECK (unit IN ('kg', 'piece')),
        taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Create Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      CREATE INDEX IF NOT EXISTS idx_products_risk_date ON products(risk_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    `);

    // 5. Seed initial admin user if table is empty
    const adminEmail = (process.env.ADMIN_EMAIL || 'bedoushop@gmail.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Bx9#kLm2vQ7pWsR';

    const checkAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (checkAdmin.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPassword, salt);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
        ['Super Admin', adminEmail, hash]
      );
      console.log(`🛡️ Admin user provisioned in DB: ${adminEmail}`);
    }

    console.log('📦 Database schema initialized successfully.');
    return true;
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    return false;
  }
}

module.exports = initDatabase;

if (require.main === module) {
  initDatabase().then(() => process.exit(0));
}
