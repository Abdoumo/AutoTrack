const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');
const { validateEmail, validatePassword, validateName } = require('../utils/validators');

/**
 * POST /api/auth/register
 * Create a new user account.
 * Body: { name, email, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const cleanName = validateName(name);
    if (!cleanName) {
      return res.status(400).json({ error: 'Nom complet invalide (1 à 100 caractères requis).' });
    }

    const cleanEmail = validateEmail(email);
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Format d’adresse email invalide.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter entre 6 et 128 caractères.' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte avec cette adresse email existe déjà.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, 'user') 
       RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase(), password_hash]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err.message);
    const isConnErr = err.code === 'ECONNREFUSED' || err.code === '28P01' || err.message.includes('authentication failed') || err.message.includes('connect');
    const msg = isConnErr 
      ? 'Database not connected: Please configure a valid DATABASE_URL in server/.env (e.g. Neon, Supabase, Render)'
      : (err.message || 'Server error during registration.');
    res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = validateEmail(email);
    if (!cleanEmail || !password || typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ error: 'Identifiants ou format invalide.' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    const isConnErr = err.code === 'ECONNREFUSED' || err.code === '28P01' || err.message.includes('authentication failed') || err.message.includes('connect');
    const msg = isConnErr 
      ? 'Database not connected: Please configure a valid DATABASE_URL in server/.env (e.g. Neon, Supabase, Render)'
      : (err.message || 'Server error during login.');
    res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/auth/me
 * Get the current authenticated user's info.
 * Requires: Bearer token
 */
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
