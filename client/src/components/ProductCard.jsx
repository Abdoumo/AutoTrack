import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProductCard({ product, onTake, onEdit, onDelete, onAdjustRisk }) {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();

  const remaining = parseFloat(product.remaining_qty || 0);
  const initialQty = parseFloat(product.quantity || product.weight || 0);
  const unit = product.unit || 'kg';
  const unitLabel = unit === 'piece' ? 'pcs' : 'kg';
  const percentageLeft = initialQty > 0 ? Math.round((remaining / initialQty) * 100) : 0;
  const isDepleted = remaining <= 0 || product.status === 'depleted';

  const daysRemaining = product.days_remaining !== undefined ? product.days_remaining : 10;
  const isCritical = product.alert_level === 'critical' || daysRemaining <= 0 || product.status === 'expired';
  const isWarning = !isCritical && (product.alert_level === 'warning' || daysRemaining <= 3);

  const canManage = isAdmin || (user && product.created_by === user.id) || (user && product.creator_email === user.email);

  let borderStyle = '1px solid var(--border-subtle)';
  let cardClass = '';

  if (isCritical && !isDepleted) {
    borderStyle = '1px solid var(--color-danger-border)';
    cardClass = 'critical-card-pulse';
  } else if (isWarning && !isDepleted) {
    borderStyle = '1px solid var(--color-warning-border)';
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: borderStyle,
        borderRadius: 'var(--radius-md)',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.15s ease, background 0.15s ease',
        position: 'relative',
      }}
      className={cardClass}
    >
      <div>
        {/* Top Meta: Unit & Status Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {t('ref')} {product.id ? product.id.slice(0, 8) : 'N/A'}
          </span>

          {/* Status Pill */}
          {isDepleted ? (
            <span className="pill pill-muted">
              <span className="status-dot status-dot-muted" />
              {t('filter_depleted')}
            </span>
          ) : isCritical ? (
            <span className="pill pill-danger">
              <span className="status-dot status-dot-danger" />
              {t('filter_day10')}
            </span>
          ) : isWarning ? (
            <span className="pill pill-warning">
              <span className="status-dot status-dot-warning" />
              {t('filter_day7')} ({daysRemaining}{t('days_left')})
            </span>
          ) : (
            <span className="pill pill-active">
              <span className="status-dot status-dot-active" />
              {t('filter_active')} ({daysRemaining}{t('days_left')})
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', lineHeight: 1.35, marginBottom: '6px' }}>
          {product.name}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          marginBottom: '12px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '34px',
        }}>
          {product.description || 'Aucune spécification complémentaire enregistrée.'}
        </p>

        {/* Metric Grid: Quantity (pcs/kg) & Weight */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('stock_available')}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: remaining > 0 ? '#fff' : 'var(--text-muted)' }}>
              {remaining} / {initialQty} {unitLabel}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${percentageLeft}%`,
              height: '100%',
              background: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#5d5fef',
              borderRadius: '999px',
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Weight row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            <span>{t('product_weight')}</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
              {product.weight} kg
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginBottom: '14px',
        }}>
          <span>{t('created_at')} {new Date(product.created_at).toLocaleDateString()}</span>
          <span style={{ color: isCritical ? '#f87171' : isWarning ? '#fbbf24' : 'inherit' }}>
            {t('risk_deadline')} {new Date(product.risk_date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Footer Controls */}
      <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', flexWrap: 'wrap' }}>
        <button
          id={`take-btn-${product.id}`}
          onClick={() => onTake(product)}
          className={`btn ${isDepleted ? 'btn-secondary' : 'btn-primary'}`}
          style={{ flex: '2 1 120px', padding: '7px 10px', fontSize: '12px' }}
          disabled={isDepleted}
        >
          {isDepleted ? t('filter_depleted') : `${t('claim_btn')} (${unitLabel})`}
        </button>

        {canManage && (
          <>
            <button
              onClick={() => onEdit(product)}
              className="btn btn-secondary"
              title={t('edit_btn')}
              style={{ flex: '1 1 auto', padding: '7px 8px', fontSize: '11px' }}
            >
              {t('edit_btn')}
            </button>

            <button
              onClick={() => onDelete(product)}
              className="btn btn-danger"
              title={t('delete_btn')}
              style={{ padding: '7px 8px', fontSize: '11px' }}
            >
              {t('delete_btn')}
            </button>
          </>
        )}

        {isAdmin && (
          <button
            onClick={() => onAdjustRisk(product)}
            className="btn btn-secondary"
            title={t('adjust_risk_btn')}
            style={{ padding: '7px 8px', fontSize: '11px' }}
          >
            Risque
          </button>
        )}
      </div>
    </div>
  );
}
