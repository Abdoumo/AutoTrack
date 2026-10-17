const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

/**
 * GET /api/products
 * List all products with computed days_remaining and alert_level
 */
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        u.name AS creator_name,
        u.email AS creator_email,
        CEIL(EXTRACT(EPOCH FROM (p.risk_date - NOW())) / 86400) AS days_remaining
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `);

    const products = result.rows.map((p) => {
      const days = parseInt(p.days_remaining, 10) || 0;
      let alert_level = 'normal';
      if (p.status === 'expired' || days <= 0) alert_level = 'critical';
      else if (days <= 3) alert_level = 'warning';

      return { ...p, days_remaining: days, alert_level };
    });

    res.json(products);
  } catch (err) {
    console.error('Get products error:', err.message);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const productResult = await pool.query(
      `SELECT 
        p.*,
        u.name AS creator_name,
        u.email AS creator_email,
        CEIL(EXTRACT(EPOCH FROM (p.risk_date - NOW())) / 86400) AS days_remaining
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = productResult.rows[0];
    product.days_remaining = parseInt(product.days_remaining, 10) || 0;

    const transResult = await pool.query(
      `SELECT 
        t.*,
        u.name AS user_name,
        u.email AS user_email
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.product_id = $1
      ORDER BY t.taken_at DESC`,
      [id]
    );

    res.json({ product, transactions: transResult.rows });
  } catch (err) {
    console.error('Get product error:', err.message);
    res.status(500).json({ error: 'Server error fetching product.' });
  }
});

/**
 * POST /api/products
 * Create product with unit ('piece' | 'kg'), quantity, weight, description, risk_days
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, unit = 'kg', quantity, weight = 0, description = '', risk_days } = req.body;

    // Strict input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Valid product name is required.' });
    }

    const validUnits = ['kg', 'piece'];
    const chosenUnit = validUnits.includes(unit) ? unit : 'kg';

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight < 0) {
      return res.status(400).json({ error: 'Weight must be 0 or greater.' });
    }

    const days = parseInt(risk_days, 10) || 10;
    const riskDate = new Date();
    riskDate.setDate(riskDate.getDate() + Math.max(1, days));

    const result = await pool.query(
      `INSERT INTO products (name, unit, quantity, remaining_qty, weight, description, risk_date, created_by)
       VALUES ($1, $2, $3, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name.trim(), chosenUnit, parsedQty, parsedWeight, description.trim(), riskDate.toISOString(), req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create product error:', err.message);
    res.status(500).json({ error: 'Server error creating product.' });
  }
});

/**
 * PUT /api/products/:id
 * Full product update (name, unit, quantity, weight, description, risk_date)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit = 'kg', quantity, weight, description, risk_date } = req.body;

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Only admin or the creator can edit
    if (req.user.role !== 'admin' && existing.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied. You can only edit your own products.' });
    }

    const current = existing.rows[0];
    const newName = name ? name.trim() : current.name;
    const newUnit = ['kg', 'piece'].includes(unit) ? unit : current.unit;
    const newQty = quantity !== undefined ? parseFloat(quantity) : parseFloat(current.quantity);
    const newWeight = weight !== undefined ? parseFloat(weight) : parseFloat(current.weight);
    const newDesc = description !== undefined ? description.trim() : current.description;
    const newRiskDate = risk_date ? new Date(risk_date).toISOString() : current.risk_date;

    // Adjust remaining_qty proportionally or preserve it
    const deducted = parseFloat(current.quantity) - parseFloat(current.remaining_qty);
    const newRemaining = Math.max(0, newQty - deducted);
    const newStatus = newRemaining <= 0 ? 'depleted' : current.status;

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, unit = $2, quantity = $3, remaining_qty = $4, weight = $5, description = $6, risk_date = $7, status = $8
       WHERE id = $9
       RETURNING *`,
      [newName, newUnit, newQty, newRemaining, newWeight, newDesc, newRiskDate, newStatus, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ error: 'Server error updating product.' });
  }
});

/**
 * PUT /api/products/:id/risk-date (Admin)
 */
router.put('/:id/risk-date', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { risk_date } = req.body;

    if (!risk_date || isNaN(new Date(risk_date).getTime())) {
      return res.status(400).json({ error: 'Valid risk date is required.' });
    }

    const result = await pool.query(
      `UPDATE products SET risk_date = $1 WHERE id = $2 RETURNING *`,
      [new Date(risk_date).toISOString(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update risk date error:', err.message);
    res.status(500).json({ error: 'Server error updating risk date.' });
  }
});

/**
 * DELETE /api/products/:id (Admin)
 */
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ error: 'Server error deleting product.' });
  }
});

module.exports = router;
