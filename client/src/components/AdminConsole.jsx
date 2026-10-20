import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { exportTransactionsToExcel } from '../services/excelExporter';
import { FileSpreadsheet } from 'lucide-react';

export default function AdminConsole({ products, onRefreshProducts }) {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const listToExport = filteredTransactions.length > 0 ? filteredTransactions : safeTransactions;
      await exportTransactionsToExcel(listToExport, safeProducts, t);
    } catch (err) {
      console.error('Excel Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const filteredTransactions = safeTransactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.product_name && t.product_name.toLowerCase().includes(q)) ||
      (t.user_name && t.user_name.toLowerCase().includes(q)) ||
      (t.user_email && t.user_email.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q))
    );
  });

  const criticalProducts = safeProducts.filter(
    (p) => (p.alert_level === 'critical' || p.days_remaining <= 0 || p.status === 'expired') && p.remaining_qty > 0
  );

  const warningProducts = safeProducts.filter(
    (p) => p.alert_level === 'warning' || (p.days_remaining > 0 && p.days_remaining <= 3 && p.remaining_qty > 0)
  );

  return (
    <div style={{ padding: '4px 0 40px 0' }}>
      {/* Header & CSV Trigger */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div>
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: '#818cf8',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            {t('audit_oversight')}
          </span>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '2px' }}>
            {t('admin_title')}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {t('admin_subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            id="preview-day7-email-link"
            href="/previews/day7.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}
            title="Ouvrir le modèle d'email Jour 7 dans un nouvel onglet"
          >
            {t('preview_day7')} ↗
          </a>

          <a
            id="preview-day10-email-link"
            href="/previews/day10.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}
            title="Ouvrir le modèle d'email Jour 10 dans un nouvel onglet"
          >
            {t('preview_day10')} ↗
          </a>

          <button
            onClick={loadTransactions}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {t('refresh')}
          </button>

          <button
            id="export-excel-btn"
            onClick={handleExportExcel}
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            disabled={exporting}
          >
            <FileSpreadsheet size={15} />
            <span>{exporting ? 'Génération...' : t('export_csv')}</span>
          </button>
        </div>
      </div>

      {/* Risk Metrics Cards */}
      <div className="admin-metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {/* Day 10 Critical Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--color-danger-border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-dot status-dot-danger" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {t('day10_card_title')}
              </span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#f87171' }}>
              {criticalProducts.length}
            </span>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {t('day10_card_desc')}
          </p>

          {criticalProducts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {criticalProducts.map((p) => (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'rgba(239, 68, 68, 0.08)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '11px',
                }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{p.name}</span>
                  <span style={{ color: '#fca5a5' }}>
                    {p.remaining_qty} {p.unit || 'kg'} invendu
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Day 7 Warning Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--color-warning-border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-dot status-dot-warning" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {t('day7_card_title')}
              </span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#fbbf24' }}>
              {warningProducts.length}
            </span>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {t('day7_card_desc')}
          </p>

          {warningProducts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {warningProducts.map((p) => (
                <div key={p.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'rgba(245, 158, 11, 0.08)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '11px',
                }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{p.name}</span>
                  <span style={{ color: '#fde68a' }}>
                    {p.remaining_qty} {p.unit || 'kg'} ({p.days_remaining}j restants)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table Section */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        {/* Search Bar */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {t('user_claim_ledger')}
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {filteredTransactions.length} transaction(s)
            </span>
          </div>

          <input
            className="field-input"
            style={{ width: '100%', maxWidth: '240px', padding: '6px 10px', fontSize: '12px' }}
            placeholder={t('search_records')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Responsive Table */}
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Chargement du journal...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Aucune transaction enregistrée.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_claimant')}</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_product')}</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_qty')}</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_weight')}</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_date')}</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600' }}>{t('col_ref')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tItem, idx) => (
                  <tr
                    key={tItem.id || idx}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{tItem.user_name || 'Utilisateur'}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{tItem.user_email || 'N/A'}</div>
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      {(() => {
                        const matchingProd = safeProducts.find((p) => p.id === tItem.product_id);
                        const prodImg = tItem.product_image || matchingProd?.image;
                        const hasRealImg = prodImg && typeof prodImg === 'string' && !prodImg.startsWith('data:image/svg+xml');
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {hasRealImg && (
                              <img
                                src={prodImg}
                                alt={tItem.product_name}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: 'var(--radius-xs)',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                  border: '1px solid var(--border-subtle)',
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{tItem.product_name}</div>
                              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                {tItem.product_id ? tItem.product_id.slice(0, 8) : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        background: 'var(--accent-subtle)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                      }}>
                        {tItem.quantity_taken} {tItem.unit || 'kg'}
                      </span>
                    </td>

                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {tItem.product_weight ? `${tItem.product_weight} kg` : 'N/A'}
                    </td>

                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {new Date(tItem.taken_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                      {tItem.id ? tItem.id.slice(0, 8) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
