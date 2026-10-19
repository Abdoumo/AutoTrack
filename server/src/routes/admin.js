const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { transactionsToCSV } = require('../utils/csvExporter');

/**
 * GET /api/admin/transactions
 */
router.get('/transactions', auth, adminOnly, async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(`
        SELECT 
          t.id,
          t.product_id,
          t.user_id,
          t.quantity_taken,
          t.unit,
          t.taken_at,
          p.name AS product_name,
          p.weight AS product_weight,
          p.remaining_qty,
          p.status AS product_status,
          p.risk_date,
          p.image AS product_image,
          u.name AS user_name,
          u.email AS user_email
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.taken_at DESC
      `);
    } catch (colErr) {
      result = await pool.query(`
        SELECT 
          t.id,
          t.product_id,
          t.user_id,
          t.quantity_taken,
          t.unit,
          t.taken_at,
          p.name AS product_name,
          p.weight AS product_weight,
          p.remaining_qty,
          p.status AS product_status,
          p.risk_date,
          u.name AS user_name,
          u.email AS user_email
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.taken_at DESC
      `);
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Admin get transactions error:', err.message);
    res.status(500).json({ error: 'Server error retrieving transactions.' });
  }
});

/**
 * GET /api/admin/export-csv
 */
router.get('/export-csv', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.product_id,
        t.user_id,
        t.quantity_taken,
        t.unit,
        t.taken_at,
        p.name AS product_name,
        p.weight AS product_weight,
        p.status AS product_status,
        u.name AS user_name,
        u.email AS user_email
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.taken_at DESC
    `);

    const csvData = transactionsToCSV(result.rows);
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  } catch (err) {
    console.error('Admin export CSV error:', err.message);
    res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

/**
 * GET /api/admin/alerts
 */
router.get('/alerts', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        u.name AS creator_name,
        u.email AS creator_email,
        CEIL(EXTRACT(EPOCH FROM (p.risk_date - NOW())) / 86400) AS days_remaining
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.status = 'active' OR p.status = 'expired'
      ORDER BY p.risk_date ASC
    `);

    const warnings = [];
    const criticals = [];

    result.rows.forEach((prod) => {
      const days = parseInt(prod.days_remaining, 10);
      if (days <= 0 || prod.status === 'expired') {
        criticals.push({ ...prod, alert_level: 'critical', days_remaining: days });
      } else if (days <= 3) {
        warnings.push({ ...prod, alert_level: 'warning', days_remaining: days });
      }
    });

    res.json({
      summary: {
        warning_count: warnings.length,
        critical_count: criticals.length,
      },
      warnings,
      criticals,
    });
  } catch (err) {
    console.error('Admin alerts error:', err.message);
    res.status(500).json({ error: 'Server error retrieving alerts.' });
  }
});

/**
 * POST /api/admin/send-test-email
 * Dispatch a test alert email to verify Gmail credentials and view the design
 */
router.post('/send-test-email', auth, adminOnly, async (req, res) => {
  const { sendTestEmail } = require('../services/emailService');
  const { validateEmail } = require('../utils/validators');

  try {
    const { targetEmail } = req.body || {};
    let recipient = null;
    if (targetEmail) {
      recipient = validateEmail(targetEmail);
      if (!recipient) {
        return res.status(400).json({ error: 'Adresse email destinataire invalide.' });
      }
    }
    const result = await sendTestEmail(recipient);
    res.json({ success: true, message: 'Email de test envoyé avec succès.', result });
  } catch (err) {
    console.error('Send test email error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/admin/verify-email
 * Verify SMTP transport connectivity
 */
router.get('/verify-email', auth, adminOnly, async (req, res) => {
  const { verifyConnection } = require('../services/emailService');
  try {
    const result = await verifyConnection();
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
