const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

/**
 * GET /api/users
 * Retrieve all users with aggregated activity metrics:
 * - products_created_count
 * - transactions_count
 * - total_quantity_claimed
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
 * Deep analytics on a specific user's actions:
 * - Products captured
 * - Transactions made (who took what, quantity, weight, date)
 */
router.get('/:id/activity', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // User details
    const userResult = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Products captured by this user
    const productsResult = await pool.query(
      `SELECT id, name, unit, quantity, remaining_qty, weight, status, risk_date, created_at
       FROM products
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [id]
    );

    // Transactions made by this user (items claimed)
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

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const validRoles = ['admin', 'user'];
    const chosenRole = validRoles.includes(role) ? role : 'user';

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, chosenRole]
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

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const validRoles = ['admin', 'user'];
    const chosenRole = role && validRoles.includes(role) ? role : userResult.rows[0].role;
    const chosenName = name ? name.trim() : userResult.rows[0].name;
    const chosenEmail = email ? email.toLowerCase().trim() : userResult.rows[0].email;

    let passwordHash = userResult.rows[0].password_hash;
    if (password && password.trim().length >= 6) {
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

    // Prevent deleting the primary admin account
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (userResult.rows[0].email === 'bedoushop@gmail.com') {
      return res.status(403).json({ error: 'Cannot delete the primary root admin account.' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User account removed successfully.' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Server error removing user.' });
  }
});

module.exports = router;
