#!/usr/bin/env node
/**
 * AuraTrack — Admin Provisioning & Credential Reset CLI Utility
 * Usage:
 *   node create_admin.js
 *   node create_admin.js <email> <password> [name]
 */

const bcrypt = require('bcryptjs');
const pool = require('./src/db');
require('dotenv').config();

async function createOrUpdateAdmin() {
  const args = process.argv.slice(2);

  const email = (args[0] || process.env.ADMIN_EMAIL || 'bedoushop@gmail.com').toLowerCase().trim();
  const password = args[1] || process.env.ADMIN_PASSWORD || 'Bx9#kLm2vQ7pWsR';
  const name = args[2] || 'Super Admin';

  console.log('\n============================================================');
  console.log('🛡️  AuraTrack — Admin Account Provisioning CLI');
  console.log('============================================================\n');

  // 1. Verify Database Connection
  const connTest = await pool.testConnection();
  if (!connTest.connected) {
    console.error(`❌ Impossible de se connecter à la base de données PostgreSQL:`);
    console.error(`   ${connTest.error}`);
    console.error('\n👉 Assurez-vous d’avoir configuré DATABASE_URL dans server/.env (ex: Neon, Supabase, Render)\n');
    process.exit(1);
  }

  console.log(`✅ Connecté à PostgreSQL: "${connTest.database}" (utilisateur: "${connTest.user}")`);

  try {
    // 2. Ensure users table exists
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

    // 3. Check if user already exists
    const check = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', [email]);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (check.rows.length > 0) {
      const existingUser = check.rows[0];
      console.log(`ℹ️  L'utilisateur existe déjà : ${email}`);
      console.log(`🔄 Mise à jour du rôle en 'admin' et réinitialisation du mot de passe...`);

      const updated = await pool.query(
        `UPDATE users 
         SET name = $1, password_hash = $2, role = 'admin'
         WHERE id = $3
         RETURNING id, name, email, role, created_at`,
        [name || existingUser.name, passwordHash, existingUser.id]
      );

      console.log('\n✅ Compte Administrateur mis à jour avec succès :');
      console.log(`   ID       : ${updated.rows[0].id}`);
      console.log(`   Nom      : ${updated.rows[0].name}`);
      console.log(`   Email    : ${updated.rows[0].email}`);
      console.log(`   Rôle     : ${updated.rows[0].role}`);
      console.log('\n------------------------------------------------------------\n');
    } else {
      console.log(`➕ Création d'un nouveau compte administrateur : ${email}...`);

      const created = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash]
      );

      console.log('\n✅ Compte Administrateur créé avec succès :');
      console.log(`   ID       : ${created.rows[0].id}`);
      console.log(`   Nom      : ${created.rows[0].name}`);
      console.log(`   Email    : ${created.rows[0].email}`);
      console.log(`   Rôle     : ${created.rows[0].role}`);
      console.log('\n------------------------------------------------------------\n');
    }
  } catch (err) {
    console.error('❌ Erreur lors de la création/mise à jour de l’administrateur :', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createOrUpdateAdmin();
}

module.exports = createOrUpdateAdmin;
