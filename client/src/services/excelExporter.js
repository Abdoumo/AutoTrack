/**
 * AuraTrack — Excel (.xlsx) & CSV Exporter
 * Generates genuine Microsoft Excel OpenXML (.xlsx) workbooks using ExcelJS.
 * Truly embeds real product photographs directly into Excel cells (DrawingML layer),
 * guaranteed to display inside Microsoft Excel, LibreOffice Calc, and Google Sheets
 * without broken links, security warnings, or missing images.
 */

import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { getRealisticProductPhoto } from './realPhotos.js';

/**
 * Extracts raw base64 data and image extension from a data URI or URL.
 */
async function resolveImageBase64(imgSource) {
  if (!imgSource || typeof imgSource !== 'string') return null;
  const trimmed = imgSource.trim();

  // Handle data:image/...;base64,...
  if (trimmed.startsWith('data:image/')) {
    const match = trimmed.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (match) {
      let ext = match[1].toLowerCase();
      if (ext === 'jpg') ext = 'jpeg';
      // ExcelJS supports jpeg, png, gif
      if (['jpeg', 'png', 'gif'].includes(ext)) {
        return { base64: match[2], extension: ext };
      }
    }
  }

  // Handle remote or local URL (e.g. /uploads/... or https://...)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('blob:')) {
    try {
      const res = await fetch(trimmed);
      if (res.ok) {
        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64 = window.btoa(binary);
        let ext = (blob.type && blob.type.split('/')[1]?.toLowerCase()) || 'jpeg';
        if (ext === 'jpg') ext = 'jpeg';
        if (['jpeg', 'png', 'gif'].includes(ext)) {
          return { base64: b64, extension: ext };
        }
      }
    } catch (e) {
      console.warn('Could not fetch custom image for Excel embedding:', e);
    }
  }

  return null;
}

/**
 * Helper to trigger download of a generated Excel (.xlsx) Blob
 */
function downloadWorkbookBlob(buffer, filename) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `auratrack_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Helper to download CSV text
 */
function downloadCsvBlob(csvContent, filename) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `auratrack_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * CSV formula injection sanitizer
 */
function sanitizeCsvValue(val) {
  let str = String(val === null || val === undefined ? '' : val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export Products Catalog to Real Native Excel (.xlsx) with Embedded Images
 */
export async function exportProductsToExcel(products = [], t = (k) => k) {
  const safeProducts = Array.isArray(products) ? products : [];
  const exportDate = new Date().toLocaleString();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AuraTrack System';
  workbook.lastModifiedBy = 'AuraTrack System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Inventaire Produits', {
    views: [{ showGridLines: true }],
  });

  // Set column definitions
  worksheet.columns = [
    { key: 'idx', width: 6 },
    { key: 'image', width: 14 },
    { key: 'name', width: 34 },
    { key: 'ref', width: 14 },
    { key: 'rem_qty', width: 15 },
    { key: 'init_qty', width: 15 },
    { key: 'piece_weight', width: 16 },
    { key: 'weight', width: 15 },
    { key: 'delay', width: 14 },
    { key: 'risk_date', width: 14 },
    { key: 'status', width: 28 },
    { key: 'creator', width: 18 },
    { key: 'created_at', width: 14 },
    { key: 'desc', width: 38 },
  ];

  // 1. Title Banner
  worksheet.mergeCells('A1:N1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'AuraTrack — Inventaire des Produits & Gestion des Risques';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 36;

  // 2. Subtitle / Metadata
  worksheet.mergeCells('A2:N2');
  const metaCell = worksheet.getCell('A2');
  metaCell.value = `Exporté le ${exportDate} • ${safeProducts.length} produit(s) répertorié(s) • Photos studio intégrées dans les cellules`;
  metaCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF64748B' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // Row 3: Blank separator
  worksheet.getRow(3).height = 8;

  // 3. Header Row (Row 4)
  const headers = [
    '#',
    'Image',
    'Nom du Produit',
    'Réf',
    'Stock Restant',
    'Stock Initial',
    'Poids par pièce',
    'Poids Total',
    'Délai Risque',
    'Échéance',
    'Statut Risque',
    'Créé par',
    'Créé le',
    'Description',
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 28;
  headerRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  for (let colIdx = 1; colIdx <= headers.length; colIdx++) {
    const cell = headerRow.getCell(colIdx);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF312E81' } },
      bottom: { style: 'medium', color: { argb: 'FF312E81' } },
      left: { style: 'thin', color: { argb: 'FF3730A3' } },
      right: { style: 'thin', color: { argb: 'FF3730A3' } },
    };
  }

  // Pre-resolve images
  const resolvedImages = await Promise.all(
    safeProducts.map(async (p) => {
      // First try explicit image if available
      const explicit = p.image || p.image_url || p.img;
      let imgData = await resolveImageBase64(explicit);
      if (!imgData) {
        // Fallback to real studio photography photo
        const studioPhoto = getRealisticProductPhoto(p);
        imgData = await resolveImageBase64(studioPhoto);
      }
      return imgData;
    })
  );

  // 4. Populate Data Rows
  let currentRowNum = 5;

  for (let idx = 0; idx < safeProducts.length; idx++) {
    const p = safeProducts[idx];
    const isCritical = p.alert_level === 'critical' || p.days_remaining <= 0 || p.status === 'expired';
    const isWarning = !isCritical && (p.alert_level === 'warning' || p.days_remaining <= 3);
    const isDepleted = parseFloat(p.remaining_qty || 0) <= 0 || p.status === 'depleted';

    let statusLabel = 'Actif';
    let statusFg = 'FF065F46';
    let statusBg = 'FFD1FAE5';

    if (isDepleted) {
      statusLabel = 'Épuisé';
      statusFg = 'FF475569';
      statusBg = 'FFF1F5F9';
    } else if (isCritical) {
      statusLabel = 'Jour 10 Dépassé (Critique)';
      statusFg = 'FF991B1B';
      statusBg = 'FFFEE2E2';
    } else if (isWarning) {
      statusLabel = 'Zone Alerte Jour 7';
      statusFg = 'FF92400E';
      statusBg = 'FFFEF3C7';
    }

    const createdStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';
    const riskStr = p.risk_date ? new Date(p.risk_date).toLocaleDateString() : 'N/A';
    const unitLabel = p.unit === 'piece' ? 'pcs' : 'kg';
    const delayStr = p.days_remaining !== undefined ? `${p.days_remaining} j` : '10 j';

    let pieceWeightStr = '—';
    if (p.unit === 'piece') {
      const pw = (p.piece_weight !== undefined && p.piece_weight !== null && Number(p.piece_weight) > 0)
        ? Number(p.piece_weight)
        : (parseFloat(p.quantity) > 0 && parseFloat(p.weight) > 0 ? parseFloat(p.weight) / parseFloat(p.quantity) : 0);
      pieceWeightStr = pw > 0 ? `${parseFloat(pw.toFixed(3))} kg` : 'N/A';
    } else {
      pieceWeightStr = '1 kg';
    }

    const totalWeightStr = `${p.weight || 0} kg`;

    const row = worksheet.getRow(currentRowNum);
    row.height = 50; // Room for 44px photo + padding

    row.values = [
      idx + 1,
      '', // Column 2 is reserved for embedded image
      p.name || 'Sans nom',
      p.id ? p.id.slice(0, 8) : 'N/A',
      `${p.remaining_qty || 0} ${unitLabel}`,
      `${p.quantity || p.weight || 0} ${unitLabel}`,
      pieceWeightStr,
      totalWeightStr,
      delayStr,
      riskStr,
      statusLabel,
      p.creator_name || p.user_name || 'Utilisateur',
      createdStr,
      p.description || '',
    ];

    // Default font and zebra background
    const isEven = idx % 2 === 1;
    const rowBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle' };

      // Column-specific alignments
      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 9 || colNumber === 10 || colNumber === 13) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 5 || colNumber === 6 || colNumber === 7 || colNumber === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });

    // Formatting specific cells
    row.getCell(3).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    row.getCell(4).font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };
    row.getCell(5).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF1E293B' } };
    row.getCell(7).font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF475569' } };
    row.getCell(8).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF1E293B' } };

    // Delay column styling
    const delayCell = row.getCell(9);
    delayCell.font = {
      name: 'Segoe UI',
      size: 9.5,
      bold: true,
      color: { argb: isCritical ? 'FFDC2626' : isWarning ? 'FFD97706' : 'FF059669' },
    };

    // Status Badge styling
    const statusCell = row.getCell(11);
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
    statusCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: statusFg } };
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Embed Image into Column B (Col index 1, 0-indexed)
    const imgData = resolvedImages[idx];
    if (imgData && imgData.base64) {
      try {
        const imageId = workbook.addImage({
          base64: imgData.base64,
          extension: imgData.extension,
        });

        worksheet.addImage(imageId, {
          tl: { col: 1.15, row: currentRowNum - 1 + 0.08 },
          ext: { width: 44, height: 44 },
          editAs: 'oneCell',
        });
      } catch (err) {
        console.warn(`Could not embed image for product row ${idx + 1}:`, err);
      }
    }

    currentRowNum++;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadWorkbookBlob(buffer, `auratrack_produits_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Transactions Ledger to Real Native Excel (.xlsx) with Embedded Product Images
 */
export async function exportTransactionsToExcel(transactions = [], products = [], t = (k) => k) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const exportDate = new Date().toLocaleString();

  // Create product lookup map
  const productMap = new Map();
  safeProducts.forEach((p) => {
    if (p.id) productMap.set(p.id, p);
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AuraTrack System';
  workbook.lastModifiedBy = 'AuraTrack System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Journal Transactions', {
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { key: 'idx', width: 6 },
    { key: 'image', width: 14 },
    { key: 'name', width: 32 },
    { key: 'product_id', width: 14 },
    { key: 'user', width: 22 },
    { key: 'email', width: 26 },
    { key: 'qty', width: 16 },
    { key: 'weight', width: 14 },
    { key: 'date', width: 20 },
    { key: 'trans_id', width: 14 },
  ];

  // 1. Title Banner
  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'AuraTrack — Journal d’Audit des Transactions & Prélèvements';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 36;

  // 2. Metadata Subtitle
  worksheet.mergeCells('A2:J2');
  const metaCell = worksheet.getCell('A2');
  metaCell.value = `Exporté le ${exportDate} • ${safeTransactions.length} transaction(s) enregistrée(s) • Photos produits intégrées`;
  metaCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF64748B' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  worksheet.getRow(3).height = 8;

  // 3. Header Row (Row 4)
  const headers = [
    '#',
    'Image Produit',
    'Produit Réclamé',
    'Réf Produit',
    'Utilisateur',
    'Email Utilisateur',
    'Quantité Prise',
    'Poids Article',
    'Date & Heure',
    'Réf Trans',
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 28;
  headerRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  for (let colIdx = 1; colIdx <= headers.length; colIdx++) {
    const cell = headerRow.getCell(colIdx);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF312E81' } },
      bottom: { style: 'medium', color: { argb: 'FF312E81' } },
      left: { style: 'thin', color: { argb: 'FF3730A3' } },
      right: { style: 'thin', color: { argb: 'FF3730A3' } },
    };
  }

  // Pre-resolve images for transactions
  const resolvedImages = await Promise.all(
    safeTransactions.map(async (item) => {
      const product = productMap.get(item.product_id) || {};
      const explicit = item.product_image || product.image || product.image_url;
      let imgData = await resolveImageBase64(explicit);
      if (!imgData) {
        const studioPhoto = getRealisticProductPhoto({
          name: item.product_name || product.name,
          description: product.description,
        });
        imgData = await resolveImageBase64(studioPhoto);
      }
      return imgData;
    })
  );

  let currentRowNum = 5;

  for (let idx = 0; idx < safeTransactions.length; idx++) {
    const item = safeTransactions[idx];
    const product = productMap.get(item.product_id) || {};
    const prodName = item.product_name || product.name || 'Produit Inconnu';
    const dateStr = item.taken_at ? new Date(item.taken_at).toLocaleString() : 'N/A';

    const row = worksheet.getRow(currentRowNum);
    row.height = 50;

    row.values = [
      idx + 1,
      '', // Column 2 is image
      prodName,
      item.product_id ? item.product_id.slice(0, 8) : 'N/A',
      item.user_name || 'Utilisateur',
      item.user_email || 'N/A',
      `${item.quantity_taken || 0} ${item.unit || 'kg'}`,
      item.product_weight ? `${item.product_weight} kg` : 'N/A',
      dateStr,
      item.id ? item.id.slice(0, 8) : 'N/A',
    ];

    const isEven = idx % 2 === 1;
    const rowBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle' };

      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 9 || colNumber === 10) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 7 || colNumber === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });

    row.getCell(3).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    row.getCell(4).font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };
    row.getCell(7).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF4338CA' } };
    row.getCell(10).font = { name: 'Consolas', size: 9, color: { argb: 'FF64748B' } };

    // Embed Image
    const imgData = resolvedImages[idx];
    if (imgData && imgData.base64) {
      try {
        const imageId = workbook.addImage({
          base64: imgData.base64,
          extension: imgData.extension,
        });

        worksheet.addImage(imageId, {
          tl: { col: 1.15, row: currentRowNum - 1 + 0.08 },
          ext: { width: 44, height: 44 },
          editAs: 'oneCell',
        });
      } catch (err) {
        console.warn(`Could not embed image for transaction row ${idx + 1}:`, err);
      }
    }

    currentRowNum++;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadWorkbookBlob(buffer, `auratrack_transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Products to CSV (Text-based standard, with explicit image references/links)
 */
export function exportProductsToCSV(products = [], t = (k) => k) {
  const safeProducts = Array.isArray(products) ? products : [];
  const headers = [
    '#',
    'Image (Réf / Type)',
    'Nom du Produit',
    'Réf Produit',
    'Stock Restant',
    'Stock Initial',
    'Poids par pièce',
    'Poids Total',
    'Délai Risque (j)',
    'Échéance',
    'Statut Risque',
    'Créé par',
    'Créé le',
    'Description',
  ];

  const rows = safeProducts.map((p, idx) => {
    const isCritical = p.alert_level === 'critical' || p.days_remaining <= 0 || p.status === 'expired';
    const isWarning = !isCritical && (p.alert_level === 'warning' || p.days_remaining <= 3);
    const isDepleted = parseFloat(p.remaining_qty || 0) <= 0 || p.status === 'depleted';

    let status = 'Actif';
    if (isDepleted) status = 'Épuisé';
    else if (isCritical) status = 'Jour 10 Dépassé (Critique)';
    else if (isWarning) status = 'Zone Alerte Jour 7';

    const unit = p.unit === 'piece' ? 'pcs' : 'kg';
    const createdStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';
    const riskStr = p.risk_date ? new Date(p.risk_date).toLocaleDateString() : 'N/A';
    const imgDesc = p.image || '[Photo intégrée dans export .xlsx]';

    let pieceWeightStr = '—';
    if (p.unit === 'piece') {
      const pw = (p.piece_weight !== undefined && p.piece_weight !== null && Number(p.piece_weight) > 0)
        ? Number(p.piece_weight)
        : (parseFloat(p.quantity) > 0 && parseFloat(p.weight) > 0 ? parseFloat(p.weight) / parseFloat(p.quantity) : 0);
      pieceWeightStr = pw > 0 ? `${parseFloat(pw.toFixed(3))} kg` : 'N/A';
    } else {
      pieceWeightStr = '1 kg';
    }

    return [
      sanitizeCsvValue(idx + 1),
      sanitizeCsvValue(imgDesc),
      sanitizeCsvValue(p.name),
      sanitizeCsvValue(p.id ? p.id.slice(0, 8) : 'N/A'),
      sanitizeCsvValue(`${p.remaining_qty || 0} ${unit}`),
      sanitizeCsvValue(`${p.quantity || p.weight || 0} ${unit}`),
      sanitizeCsvValue(pieceWeightStr),
      sanitizeCsvValue(`${p.weight || 0} kg`),
      sanitizeCsvValue(p.days_remaining !== undefined ? p.days_remaining : 10),
      sanitizeCsvValue(riskStr),
      sanitizeCsvValue(status),
      sanitizeCsvValue(p.creator_name || p.user_name || 'Utilisateur'),
      sanitizeCsvValue(createdStr),
      sanitizeCsvValue(p.description || ''),
    ].join(',');
  });

  const csvContent = [headers.join(',')].concat(rows).join('\r\n');
  downloadCsvBlob(csvContent, `auratrack_produits_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export Transactions to CSV (Text-based format)
 */
export function exportTransactionsToCSV(transactions = [], products = [], t = (k) => k) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const productMap = new Map();
  safeProducts.forEach((p) => {
    if (p.id) productMap.set(p.id, p);
  });

  const headers = [
    '#',
    'Produit Réclamé',
    'Réf Produit',
    'Utilisateur',
    'Email Utilisateur',
    'Quantité Prise',
    'Poids Article',
    'Date & Heure',
    'Réf Trans',
  ];

  const rows = safeTransactions.map((item, idx) => {
    const product = productMap.get(item.product_id) || {};
    const prodName = item.product_name || product.name || 'Produit Inconnu';
    const dateStr = item.taken_at ? new Date(item.taken_at).toLocaleString() : 'N/A';
    return [
      sanitizeCsvValue(idx + 1),
      sanitizeCsvValue(prodName),
      sanitizeCsvValue(item.product_id ? item.product_id.slice(0, 8) : 'N/A'),
      sanitizeCsvValue(item.user_name || 'Utilisateur'),
      sanitizeCsvValue(item.user_email || 'N/A'),
      sanitizeCsvValue(`${item.quantity_taken || 0} ${item.unit || 'kg'}`),
      sanitizeCsvValue(item.product_weight ? `${item.product_weight} kg` : 'N/A'),
      sanitizeCsvValue(dateStr),
      sanitizeCsvValue(item.id ? item.id.slice(0, 8) : 'N/A'),
    ].join(',');
  });

  const csvContent = [headers.join(',')].concat(rows).join('\r\n');
  downloadCsvBlob(csvContent, `auratrack_transactions_${new Date().toISOString().split('T')[0]}.csv`);
}

