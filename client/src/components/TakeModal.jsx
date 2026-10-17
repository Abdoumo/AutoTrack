import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function TakeModal({ product, isOpen, onClose, onConfirm }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [takeQty, setTakeQty] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const remaining = parseFloat(product.remaining_qty || 0);
  const unit = product.unit || 'kg';
  const unitLabel = unit === 'piece' ? 'pcs' : 'kg';

  const handleQuickPercent = (pct) => {
    const rawVal = remaining * (pct / 100);
    const val = unit === 'piece' ? Math.max(1, Math.round(rawVal)) : parseFloat(rawVal.toFixed(2));
    setTakeQty(val);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(takeQty);

    if (isNaN(qty) || qty <= 0) {
      setError('Entrez une quantité valide supérieure à 0.');
      return;
    }

    if (qty > remaining) {
      setError(`Quantité indisponible (${remaining} ${unitLabel} restants).`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onConfirm(product.id, qty, user);
      onClose();
    } catch (err) {
      setError(err.message || 'Échec de la transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const parsedQty = parseFloat(takeQty) || 0;
  const leftAfter = Math.max(0, remaining - parsedQty).toFixed(unit === 'piece' ? 0 : 2);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{t('claim_title')}</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {t('claim_desc')}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '20px',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: '#f87171',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            marginBottom: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Product Summary */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {product.name}
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '10px' }}>
            {t('ref')} : {product.id}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '10px',
          }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {t('total_weight')}
              </span>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {product.weight} kg
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {t('stock_available')}
              </span>
              <div style={{ fontSize: '14px', fontWeight: '700', color: remaining > 0 ? '#10b981' : '#ef4444' }}>
                {remaining} {unitLabel}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Quantity Input */}
          <div className="field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="field-label" htmlFor="take-qty-input">
                {t('qty_to_claim')} ({unitLabel}) *
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {t('balance_after')} <strong style={{ color: leftAfter === '0' || leftAfter === '0.00' ? '#ef4444' : 'var(--text-primary)' }}>{leftAfter} {unitLabel}</strong>
              </span>
            </div>

            <input
              id="take-qty-input"
              type="number"
              step={unit === 'piece' ? '1' : '0.01'}
              min={unit === 'piece' ? '1' : '0.01'}
              max={remaining}
              className="field-input"
              style={{ fontSize: '15px', fontWeight: '600' }}
              placeholder={unit === 'piece' ? 'e.g. 5' : 'e.g. 2.50'}
              value={takeQty}
              onChange={(e) => {
                setTakeQty(e.target.value);
                setError('');
              }}
              required
              autoFocus
            />

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {pct === 100 ? 'Total' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* User Sign-off */}
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            background: 'var(--bg-surface-elevated)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '18px',
          }}>
            {t('logged_under')} <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{user?.email || 'anonyme'}</span> pour le journal et le rapport CSV.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              {t('cancel')}
            </button>
            <button
              id="confirm-take-btn"
              type="submit"
              className="btn btn-primary"
              disabled={submitting || remaining <= 0}
            >
              {submitting ? t('confirming') : `${t('confirm_claim')} (${takeQty || 0} ${unitLabel})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
