const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

/**
 * POST /api/transactions/take
 * Atomic partial or full quantity deduction
 */
router.post('/take', auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }

    await client.query('BEGIN');

    // Lock product row to prevent concurrency race conditions
    const productResult = await client.query(
      'SELECT * FROM products WHERE id = $1 FOR UPDATE',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = productResult.rows[0];

    if (product.status === 'depleted' || parseFloat(product.remaining_qty) <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Product is completely depleted. No stock available.' });
    }

    const currentRemaining = parseFloat(product.remaining_qty);
    if (qty > currentRemaining) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient stock. Only ${currentRemaining} ${product.unit || 'units'} available.`,
      });
    }

    // Deduct quantity
    const newRemainingQty = parseFloat((currentRemaining - qty).toFixed(2));
    const newStatus = newRemainingQty <= 0 ? 'depleted' : product.status;

    await client.query(
      'UPDATE products SET remaining_qty = $1, status = $2 WHERE id = $3',
      [newRemainingQty, newStatus, product_id]
    );

    // Record the transaction with unit
    const transResult = await client.query(
      `INSERT INTO transactions (product_id, user_id, quantity_taken, unit)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [product_id, req.user.id, qty, product.unit || 'kg']
    );

    await client.query('COMMIT');

    res.status(201).json({
      transaction: transResult.rows[0],
      product_remaining_qty: newRemainingQty,
      product_status: newStatus,
      unit: product.unit || 'kg',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Take product error:', err.message);
    res.status(500).json({ error: 'Server error processing transaction.' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/transactions/my
 */
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.*,
        p.name AS product_name,
        p.weight AS product_weight,
        p.status AS product_status
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.user_id = $1
      ORDER BY t.taken_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get my transactions error:', err.message);
    res.status(500).json({ error: 'Server error fetching transactions.' });
  }
});

module.exports = router;
