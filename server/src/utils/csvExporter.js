/**
 * Secure CSV Exporter Utility
 * Protects against CSV / Spreadsheet Formula Injection (OWASP CWE-1236)
 */

function sanitizeForCsv(value) {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();

  // Neutralize formula injection triggers: =, +, -, @, tab, newline
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape quotes if needed
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert transactions to secure CSV
 */
function transactionsToCSV(transactions) {
  const headers = [
    'Transaction ID',
    'Product Name',
    'Product Image Link',
    'Product ID',
    'User Name',
    'User Email',
    'Quantity Taken',
    'Unit',
    'Product Total Weight (kg)',
    'Date Taken',
    'Status',
  ];

  const rows = transactions.map((t) => [
    sanitizeForCsv(t.id),
    sanitizeForCsv(t.product_name || 'N/A'),
    sanitizeForCsv(t.product_id ? `http://localhost:5000/api/products/${t.product_id}/image` : 'N/A'),
    sanitizeForCsv(t.product_id),
    sanitizeForCsv(t.user_name || 'N/A'),
    sanitizeForCsv(t.user_email || 'N/A'),
    sanitizeForCsv(t.quantity_taken),
    sanitizeForCsv(t.unit || 'kg'),
    sanitizeForCsv(t.product_weight || 'N/A'),
    sanitizeForCsv(new Date(t.taken_at).toISOString()),
    sanitizeForCsv(t.product_status || 'N/A'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

module.exports = { transactionsToCSV };
