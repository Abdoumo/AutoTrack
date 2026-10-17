const cron = require('node-cron');
const pool = require('../db');
const { sendDay7WarningEmail, sendDay10CriticalEmail } = require('../services/emailService');

/**
 * Checks all active products for Day 7 (warning) and Day 10 (critical) thresholds.
 */
async function checkProductRiskDates() {
  console.log('[Cron] Running daily product risk check...');
  try {
    // Fetch products with remaining stock
    const result = await pool.query(`
      SELECT 
        p.*,
        CEIL(EXTRACT(EPOCH FROM (p.risk_date - NOW())) / 86400) AS days_remaining
      FROM products p
      WHERE (p.status = 'active' OR p.status = 'expired') AND p.remaining_qty > 0
    `);

    for (const product of result.rows) {
      const daysRemaining = parseInt(product.days_remaining, 10);

      // Day 10 reached / Expired (0 or fewer days remaining)
      if (daysRemaining <= 0) {
        if (product.status !== 'expired') {
          await pool.query("UPDATE products SET status = 'expired' WHERE id = $1", [product.id]);
          console.log(`[Cron] Marked product ${product.id} ("${product.name}") as EXPIRED.`);
        }
        await sendDay10CriticalEmail(product);
      } 
      // Day 7 reached (between 1 and 3 days remaining out of the 10-day window)
      else if (daysRemaining <= 3) {
        await sendDay7WarningEmail(product, daysRemaining);
      }
    }
  } catch (error) {
    // If DB is not connected yet during dev, log gracefully
    console.error('[Cron] Error running risk check:', error.message);
  }
}

// Run every day at 8:00 AM ('0 8 * * *')
// For demo and testing, also export checkProductRiskDates directly
cron.schedule('0 8 * * *', () => {
  checkProductRiskDates();
});

module.exports = { checkProductRiskDates };
