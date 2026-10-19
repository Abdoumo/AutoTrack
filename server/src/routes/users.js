const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  validateEmail,
  validatePassword,
  validateName,
  validateRole,
  isValidUUID,
} = require('../utils/validators');

/**
 * GET /api/users
 * Retrieve all users with aggregated activity metrics
 */
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        COUNT(DISTINCT p.id)::int AS products_created_count,
        COUNT(DISTINCT t.id)::int AS transactions_count,
        COALESCE(SUM(t.quantity_taken), 0)::numeric(12,2) AS total_quantity_claimed
      FROM users u
      LEFT JOIN products p ON p.created_by = u.id
      LEFT JOIN transactions t ON t.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ error: 'Server error retrieving user directory.' });
  }
});

/**
 * GET /api/users/:id/activity
 * Deep analytics on a specific user's actions
 */
router.get('/:id/activity', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Format d’identifiant utilisateur (UUID) invalide.' });
    }

    // User details
    const userResult = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    // Products captured by this user
    const productsResult = await pool.query(
      `SELECT id, name, unit, quantity, remaining_qty, weight, status, risk_date, created_at
       FROM products
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // Transactions made by this user
    const transactionsResult = await pool.query(
      `SELECT 
        t.id,
        t.quantity_taken,
        t.unit,
        t.taken_at,
        p.id AS product_id,
        p.name AS product_name,
        p.weight AS product_weight,
        p.status AS product_status
       FROM transactions t
       JOIN products p ON t.product_id = p.id
       WHERE t.user_id = $1
       ORDER BY t.taken_at DESC`,
      [id]
    );

    res.json({
      user: userResult.rows[0],
      products_created: productsResult.rows,
      transactions: transactionsResult.rows,
      summary: {
        total_products_created: productsResult.rows.length,
        total_claims_made: transactionsResult.rows.length,
        total_quantity_claimed: transactionsResult.rows.reduce(
          (acc, cur) => acc + parseFloat(cur.quantity_taken || 0),
          0
        ),
      },
    });
  } catch (err) {
    console.error('Get user activity error:', err.message);
    res.status(500).json({ error: 'Server error retrieving user analytics.' });
  }
});

/**
 * POST /api/users
 * Admin creates a new user account
 */
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    const cleanName = validateName(name);
    if (!cleanName) {
      return res.status(400).json({ error: 'Nom complet requis (1 à 100 caractères).' });
    }

    const cleanEmail = validateEmail(email);
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Format d’adresse email invalide.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter entre 6 et 128 caractères.' });
    }

    const cleanRole = validateRole(role);

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Un utilisateur avec cette adresse email existe déjà.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [cleanName, cleanEmail, passwordHash, cleanRole]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ error: 'Server error creating user.' });
  }
});

/**
 * PUT /api/users/:id
 * Admin updates user information (name, email, role, or resets password)
 */
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Format d’identifiant utilisateur (UUID) invalide.' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const currentUser = userResult.rows[0];

    const chosenName = name ? (validateName(name) || currentUser.name) : currentUser.name;
    
    let chosenEmail = currentUser.email;
    if (email) {
      const validEmail = validateEmail(email);
      if (!validEmail) {
        return res.status(400).json({ error: 'Format d’adresse email invalide.' });
      }
      // Check collision
      if (validEmail !== currentUser.email) {
        const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [validEmail, id]);
        if (emailCheck.rows.length > 0) {
          return res.status(409).json({ error: 'Cette adresse email est déjà utilisée.' });
        }
      }
      chosenEmail = validEmail;
    }

    const chosenRole = role ? validateRole(role) : currentUser.role;

    let passwordHash = currentUser.password_hash;
    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter entre 6 et 128 caractères.' });
      }
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    const updateResult = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, role = $3, password_hash = $4
       WHERE id = $5
       RETURNING id, name, email, role, created_at`,
      [chosenName, chosenEmail, chosenRole, passwordHash, id]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ error: 'Server error updating user.' });
  }
});

/**
 * DELETE /api/users/:id
 * Admin deletes a user account
 */
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Format d’identifiant utilisateur (UUID) invalide.' });
    }

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Action interdite : vous ne pouvez pas supprimer votre propre compte actif.' });
    }

    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const rootAdminEmail = (process.env.ADMIN_EMAIL || 'bedoushop@gmail.com').toLowerCase();
    if (userResult.rows[0].email.toLowerCase() === rootAdminEmail) {
      return res.status(403).json({ error: 'Interdit : le compte administrateur racine ne peut pas être supprimé.' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Compte utilisateur supprimé avec succès.' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Server error removing user.' });
  }
});

module.exports = router;
