const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { validateName, validateUnit, validatePositiveNumber, isValidUUID, validateDate } = require('../utils/validators');

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
    const isConnErr = err.code === 'ECONNREFUSED' || err.code === '28P01' || err.message.includes('authentication failed') || err.message.includes('connect');
    const msg = isConnErr 
      ? 'Database not connected: Please configure a valid DATABASE_URL in server/.env'
      : 'Server error fetching products.';
    res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Format d’identifiant produit (UUID) invalide.' });
    }

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
      return res.status(404).json({ error: 'Produit non trouvé.' });
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
    const { name, unit = 'kg', quantity, weight = 0, piece_weight, description = '', risk_days, image = '' } = req.body;

    const cleanName = validateName(name);
    if (!cleanName) {
      return res.status(400).json({ error: 'Nom du produit invalide (1 à 100 caractères requis).' });
    }

    const chosenUnit = validateUnit(unit);

    const parsedQty = validatePositiveNumber(quantity, 0.01);
    if (parsedQty === null) {
      return res.status(400).json({ error: 'La quantité doit être un nombre positif valide (> 0).' });
    }

    const parsedWeight = validatePositiveNumber(weight, 0);
    if (parsedWeight === null) {
      return res.status(400).json({ error: 'Le poids doit être un nombre positif ou nul (>= 0).' });
    }

    const parsedPieceWeight = validatePositiveNumber(piece_weight, 0) || (chosenUnit === 'piece' && parsedQty > 0 ? parsedWeight / parsedQty : 1);

    const cleanDesc = typeof description === 'string' ? description.trim().slice(0, 2000) : '';

    const days = parseInt(risk_days, 10);
    const validDays = !isNaN(days) && days >= 1 && days <= 3650 ? days : 10;
    const riskDate = new Date();
    riskDate.setDate(riskDate.getDate() + validDays);

    const imgVal = typeof image === 'string' ? image : '';

    let result;
    try {
      result = await pool.query(
        `INSERT INTO products (name, unit, quantity, remaining_qty, weight, piece_weight, description, risk_date, created_by, image)
         VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [cleanName, chosenUnit, parsedQty, parsedWeight, parsedPieceWeight, cleanDesc, riskDate.toISOString(), req.user.id, imgVal]
      );
    } catch (colErr) {
      try {
        result = await pool.query(
          `INSERT INTO products (name, unit, quantity, remaining_qty, weight, description, risk_date, created_by, image)
           VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [cleanName, chosenUnit, parsedQty, parsedWeight, cleanDesc, riskDate.toISOString(), req.user.id, imgVal]
        );
      } catch (innerErr) {
        result = await pool.query(
          `INSERT INTO products (name, unit, quantity, remaining_qty, weight, description, risk_date, created_by)
           VALUES ($1, $2, $3, $3, $4, $5, $6, $7)
           RETURNING *`,
          [cleanName, chosenUnit, parsedQty, parsedWeight, cleanDesc, riskDate.toISOString(), req.user.id]
        );
        if (result.rows[0]) {
          result.rows[0].image = imgVal;
        }
      }
    }

    if (result.rows[0] && result.rows[0].piece_weight === undefined) {
      result.rows[0].piece_weight = parsedPieceWeight;
    }

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
    const { name, unit = 'kg', quantity, weight, description, risk_date, image } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Format d’identifiant produit (UUID) invalide.' });
    }

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    // Only admin or the creator can edit (IDOR protection)
    if (req.user.role !== 'admin' && existing.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez modifier que vos propres produits.' });
    }

    const current = existing.rows[0];
    const newName = name ? (validateName(name) || current.name) : current.name;
    const newUnit = validateUnit(unit);
    
    let newQty = parseFloat(current.quantity);
    if (quantity !== undefined) {
      const validQty = validatePositiveNumber(quantity, 0.01);
      if (validQty === null) {
        return res.status(400).json({ error: 'La quantité doit être un nombre positif valide (> 0).' });
      }
      newQty = validQty;
    }

    let newWeight = parseFloat(current.weight);
    if (weight !== undefined) {
      const validWeight = validatePositiveNumber(weight, 0);
      if (validWeight === null) {
        return res.status(400).json({ error: 'Le poids doit être un nombre positif ou nul (>= 0).' });
      }
      newWeight = validWeight;
    }

    const newDesc = description !== undefined && typeof description === 'string'
      ? description.trim().slice(0, 2000)
      : current.description;

    let newRiskDate = current.risk_date;
    if (risk_date) {
      const validDate = validateDate(risk_date);
      if (!validDate) {
        return res.status(400).json({ error: 'Format de date de risque invalide.' });
      }
      newRiskDate = validDate;
    }

    const newImage = image !== undefined ? (typeof image === 'string' ? image : '') : (current.image || '');

    // Adjust remaining_qty proportionally or preserve it
    const deducted = parseFloat(current.quantity) - parseFloat(current.remaining_qty);
    const newRemaining = Math.max(0, newQty - deducted);
    const newStatus = newRemaining <= 0 ? 'depleted' : current.status;

    let newPieceWeight = current.piece_weight;
    if (req.body.piece_weight !== undefined) {
      const validPw = validatePositiveNumber(req.body.piece_weight, 0);
      if (validPw !== null) newPieceWeight = validPw;
    } else if (newUnit === 'piece' && newQty > 0 && newWeight > 0) {
      newPieceWeight = parseFloat((newWeight / newQty).toFixed(4));
    }

    let result;
    try {
      result = await pool.query(
        `UPDATE products 
         SET name = $1, unit = $2, quantity = $3, remaining_qty = $4, weight = $5, piece_weight = $6, description = $7, risk_date = $8, status = $9, image = $10
         WHERE id = $11
         RETURNING *`,
        [newName, newUnit, newQty, newRemaining, newWeight, newPieceWeight, newDesc, newRiskDate, newStatus, newImage, id]
      );
    } catch (colErr) {
      try {
        result = await pool.query(
          `UPDATE products 
           SET name = $1, unit = $2, quantity = $3, remaining_qty = $4, weight = $5, description = $6, risk_date = $7, status = $8, image = $9
           WHERE id = $10
           RETURNING *`,
          [newName, newUnit, newQty, newRemaining, newWeight, newDesc, newRiskDate, newStatus, newImage, id]
        );
      } catch (innerErr) {
        result = await pool.query(
          `UPDATE products 
           SET name = $1, unit = $2, quantity = $3, remaining_qty = $4, weight = $5, description = $6, risk_date = $7, status = $8
           WHERE id = $9
           RETURNING *`,
          [newName, newUnit, newQty, newRemaining, newWeight, newDesc, newRiskDate, newStatus, id]
        );
        if (result.rows[0]) {
          result.rows[0].image = newImage;
        }
      }
    }

    if (result.rows[0] && result.rows[0].piece_weight === undefined) {
      result.rows[0].piece_weight = newPieceWeight;
    }

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

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Format d’identifiant produit (UUID) invalide.' });
    }

    const validDate = validateDate(risk_date);
    if (!validDate) {
      return res.status(400).json({ error: 'Date de risque invalide.' });
    }

    const result = await pool.query(
      `UPDATE products SET risk_date = $1 WHERE id = $2 RETURNING *`,
      [validDate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
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

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Format d’identifiant produit (UUID) invalide.' });
    }

    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ error: 'Server error deleting product.' });
  }
});

module.exports = router;

