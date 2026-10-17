const bcrypt = require('bcryptjs');
const pool = require('./db');
require('dotenv').config();

const ADMIN_EMAIL = 'bedoushop@gmail.com';
const ADMIN_PASSWORD = 'Bx9#kLm2vQ7pWsR'; // Exactly 15 chars

async function seedAdmin() {
  console.log('--- Initializing Admin User Seed ---');
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [ADMIN_EMAIL]);

    if (existing.rows.length > 0) {
      console.log(`Admin account already exists: ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, name, email, role, created_at`,
      ['Super Admin', ADMIN_EMAIL, passwordHash]
    );

    console.log('✅ Admin user created successfully!');
    console.log('----------------------------------------------------');
    console.log(`Admin Email   : ${ADMIN_EMAIL}`);
    console.log(`Admin Password: ${ADMIN_PASSWORD}`);
    console.log('Role          : admin');
    console.log('ID            : ' + result.rows[0].id);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('Seed error:', error.message);
  } finally {
    await pool.end();
  }
}

seedAdmin();
