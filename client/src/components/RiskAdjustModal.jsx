import React, { useState } from 'react';

export default function RiskAdjustModal({ product, isOpen, onClose, onSave }) {
  const [date, setDate] = useState(() => {
    if (!product?.risk_date) return '';
    return new Date(product.risk_date).toISOString().split('T')[0];
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(product.id, new Date(date).toISOString());
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to update risk date');
    } finally {
      setSaving(false);
    }
  };

  const setPresetDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Modify Risk Threshold</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin control for shelf-life deadline.</p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '18px', padding: '4px' }}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Adjusting expiration date for <strong style={{ color: '#fff' }}>{product.name}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label" htmlFor="risk-date-input">Target Expiration Date</label>
            <input
              id="risk-date-input"
              type="date"
              className="field-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Quick Presets */}
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Quick Presets:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPresetDays(-1)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  border: '1px solid var(--color-danger-border)',
                }}
              >
                Overdue (-1d)
              </button>
              <button
                type="button"
                onClick={() => setPresetDays(2)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#fbbf24',
                  border: '1px solid var(--color-warning-border)',
                }}
              >
                Day 7 Notice (+2d)
              </button>
              <button
                type="button"
                onClick={() => setPresetDays(10)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(93, 95, 239, 0.12)',
                  color: '#818cf8',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Standard (+10d)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Save Deadline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
