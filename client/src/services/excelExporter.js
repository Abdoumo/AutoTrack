/**
 * AuraTrack — Excel Exporter with Embedded Product Images
 * Generates rich HTML-based Excel spreadsheets (.xls) that native Excel, 
 * LibreOffice, and Google Sheets render with inline product image thumbnails,
 * styled headers, risk status badges, and formatted columns.
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format image cell for Excel.
 * If data URI or web URL, renders <img> tag.
 * If missing, renders a clean product initial fallback.
 */
function renderImageCell(imageUrl, productName = '') {
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
    return `<div style="text-align: center;">
      <img src="${escapeHtml(imageUrl)}" width="56" height="56" style="width: 56px; height: 56px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; display: block; margin: 0 auto;" />
    </div>`;
  }
  const initial = productName ? productName.charAt(0).toUpperCase() : 'P';
  return `<div style="width: 50px; height: 50px; background-color: #e0e7ff; color: #4338ca; border-radius: 6px; text-align: center; line-height: 50px; font-weight: bold; font-size: 16pt; margin: 0 auto;">
    ${initial}
  </div>`;
}

/**
 * Trigger download of the HTML-based Excel document
 */
function downloadExcelBlob(excelContent, filename) {
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `auratrack_export_${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export Products Catalog to Excel with Product Images
 */
export function exportProductsToExcel(products = [], t = (k) => k) {
  const safeProducts = Array.isArray(products) ? products : [];
  const exportDate = new Date().toLocaleString();

  const rowsHtml = safeProducts.map((p, idx) => {
    const isCritical = p.alert_level === 'critical' || p.days_remaining <= 0 || p.status === 'expired';
    const isWarning = !isCritical && (p.alert_level === 'warning' || p.days_remaining <= 3);
    const isDepleted = parseFloat(p.remaining_qty || 0) <= 0 || p.status === 'depleted';

    let statusLabel = 'Actif';
    let statusBg = '#d1fae5';
    let statusColor = '#065f46';

    if (isDepleted) {
      statusLabel = 'Épuisé';
      statusBg = '#f1f5f9';
      statusColor = '#475569';
    } else if (isCritical) {
      statusLabel = 'Jour 10 Dépassé (Critique)';
      statusBg = '#fee2e2';
      statusColor = '#991b1b';
    } else if (isWarning) {
      statusLabel = 'Zone Alerte Jour 7';
      statusBg = '#fef3c7';
      statusColor = '#92400e';
    }

    const createdStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';
    const riskStr = p.risk_date ? new Date(p.risk_date).toLocaleDateString() : 'N/A';
    const unitLabel = p.unit === 'piece' ? 'pcs' : 'kg';

    return `
      <tr style="height: 66px;">
        <td style="text-align: center; vertical-align: middle;">${idx + 1}</td>
        <td style="text-align: center; vertical-align: middle;">${renderImageCell(p.image, p.name)}</td>
        <td style="vertical-align: middle; font-weight: bold; color: #0f172a;">${escapeHtml(p.name)}</td>
        <td style="vertical-align: middle; font-family: monospace; font-size: 9pt; color: #64748b;">${escapeHtml(p.id ? p.id.slice(0, 8) : 'N/A')}</td>
        <td style="vertical-align: middle; text-align: right; font-weight: bold; color: #1e293b;">${p.remaining_qty || 0} ${unitLabel}</td>
        <td style="vertical-align: middle; text-align: right; color: #64748b;">${p.quantity || p.weight || 0} ${unitLabel}</td>
        <td style="vertical-align: middle; text-align: right;">${p.weight || 0} kg</td>
        <td style="vertical-align: middle; text-align: center; font-weight: bold; color: ${isCritical ? '#dc2626' : isWarning ? '#d97706' : '#059669'};">
          ${p.days_remaining !== undefined ? p.days_remaining : '10'} j
        </td>
        <td style="vertical-align: middle; text-align: center;">${riskStr}</td>
        <td style="vertical-align: middle; text-align: center;">
          <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 9pt;">
            ${statusLabel}
          </span>
        </td>
        <td style="vertical-align: middle;">${escapeHtml(p.creator_name || p.user_name || 'Utilisateur')}</td>
        <td style="vertical-align: middle; text-align: center; color: #64748b;">${createdStr}</td>
        <td style="vertical-align: middle; font-size: 9pt; color: #475569;">${escapeHtml(p.description || '')}</td>
      </tr>
    `;
  }).join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Inventaire Produits</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #1e293b; }
          .report-title { font-size: 16pt; font-weight: bold; color: #4338ca; margin-bottom: 4px; }
          .report-meta { font-size: 9pt; color: #64748b; margin-bottom: 14px; }
          table { border-collapse: collapse; width: 100%; }
          th { 
            background-color: #4f46e5; 
            color: #ffffff; 
            font-weight: 600; 
            padding: 10px 12px; 
            border: 1px solid #c7d2fe; 
            text-align: left;
            vertical-align: middle;
            font-size: 10pt;
          }
          td { 
            padding: 8px 10px; 
            border: 1px solid #cbd5e1; 
          }
          tr:nth-child(even) td { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="report-title">📦 Inventaire des Produits avec Images</div>
        <div class="report-meta">Exporté le ${exportDate} • ${safeProducts.length} produit(s) répertorié(s) • AuraTrack System</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="width: 70px; text-align: center;">Image</th>
              <th>Nom du Produit</th>
              <th style="width: 80px;">Réf</th>
              <th style="width: 100px; text-align: right;">Stock Restant</th>
              <th style="width: 100px; text-align: right;">Stock Initial</th>
              <th style="width: 90px; text-align: right;">Poids Total</th>
              <th style="width: 80px; text-align: center;">Délai Risque</th>
              <th style="width: 100px; text-align: center;">Échéance</th>
              <th style="width: 140px; text-align: center;">Statut Risque</th>
              <th>Créé par</th>
              <th style="width: 100px; text-align: center;">Créé le</th>
              <th style="width: 200px;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  downloadExcelBlob(excelHtml, `auratrack_produits_images_${new Date().toISOString().split('T')[0]}.xls`);
}

/**
 * Export Transactions / Claim Ledger to Excel with Product Images
 */
export function exportTransactionsToExcel(transactions = [], products = [], t = (k) => k) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const exportDate = new Date().toLocaleString();

  // Create product lookup map for images and details
  const productMap = new Map();
  safeProducts.forEach(p => {
    if (p.id) productMap.set(p.id, p);
  });

  const rowsHtml = safeTransactions.map((item, idx) => {
    const product = productMap.get(item.product_id) || {};
    const imgSource = item.product_image || product.image || '';
    const prodName = item.product_name || product.name || 'Produit Inconnu';
    const dateStr = item.taken_at ? new Date(item.taken_at).toLocaleString() : 'N/A';

    return `
      <tr style="height: 66px;">
        <td style="text-align: center; vertical-align: middle;">${idx + 1}</td>
        <td style="text-align: center; vertical-align: middle;">${renderImageCell(imgSource, prodName)}</td>
        <td style="vertical-align: middle; font-weight: bold; color: #0f172a;">${escapeHtml(prodName)}</td>
        <td style="vertical-align: middle; font-family: monospace; font-size: 9pt; color: #64748b;">${escapeHtml(item.product_id ? item.product_id.slice(0, 8) : 'N/A')}</td>
        <td style="vertical-align: middle;">
          <div style="font-weight: 600; color: #1e293b;">${escapeHtml(item.user_name || 'Utilisateur')}</div>
          <div style="font-size: 8.5pt; color: #64748b;">${escapeHtml(item.user_email || 'N/A')}</div>
        </td>
        <td style="vertical-align: middle; text-align: right; font-weight: bold; color: #4338ca;">
          ${item.quantity_taken || 0} ${item.unit || 'kg'}
        </td>
        <td style="vertical-align: middle; text-align: right;">${item.product_weight ? `${item.product_weight} kg` : 'N/A'}</td>
        <td style="vertical-align: middle; text-align: center; font-size: 9pt; color: #334155;">${dateStr}</td>
        <td style="vertical-align: middle; font-family: monospace; font-size: 8.5pt; color: #64748b;">${escapeHtml(item.id ? item.id.slice(0, 8) : 'N/A')}</td>
      </tr>
    `;
  }).join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Journal des Transactions</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #1e293b; }
          .report-title { font-size: 16pt; font-weight: bold; color: #4338ca; margin-bottom: 4px; }
          .report-meta { font-size: 9pt; color: #64748b; margin-bottom: 14px; }
          table { border-collapse: collapse; width: 100%; }
          th { 
            background-color: #4f46e5; 
            color: #ffffff; 
            font-weight: 600; 
            padding: 10px 12px; 
            border: 1px solid #c7d2fe; 
            text-align: left;
            vertical-align: middle;
            font-size: 10pt;
          }
          td { 
            padding: 8px 10px; 
            border: 1px solid #cbd5e1; 
          }
          tr:nth-child(even) td { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="report-title">📊 Journal des Réclamations & Expéditions avec Images</div>
        <div class="report-meta">Exporté le ${exportDate} • ${safeTransactions.length} transaction(s) • AuraTrack Audit</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="width: 70px; text-align: center;">Image Produit</th>
              <th>Produit Réclamé</th>
              <th style="width: 80px;">Réf Produit</th>
              <th>Expéditeur / Utilisateur</th>
              <th style="width: 120px; text-align: right;">Quantité Prise</th>
              <th style="width: 90px; text-align: right;">Poids Article</th>
              <th style="width: 140px; text-align: center;">Date & Heure</th>
              <th style="width: 80px;">Réf Trans</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  downloadExcelBlob(excelHtml, `auratrack_transactions_images_${new Date().toISOString().split('T')[0]}.xls`);
}
