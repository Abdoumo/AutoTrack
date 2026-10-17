import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function AlertBanner({ criticalProducts, onInspect }) {
  const { t } = useLanguage();
  if (!criticalProducts || criticalProducts.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #991b1b, #b91c1c)',
      color: '#fff',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '8px',
      position: 'relative',
      zIndex: 90,
      fontSize: '12px',
      borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
        <span style={{
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '2px 6px',
          borderRadius: '3px',
          fontWeight: '700',
          fontSize: '10px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {t('day10_alert_tag')}
        </span>
        <span style={{ lineHeight: 1.35 }}>
          <strong>{criticalProducts.length}</strong> {t('day10_alert_text')}
        </span>
      </div>

      <button
        onClick={onInspect}
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 'var(--radius-xs)',
          fontSize: '11px',
          fontWeight: '600',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        {t('view_in_ledger')}
      </button>
    </div>
  );
}
