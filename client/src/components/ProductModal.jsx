import React, { useState, useEffect } from 'react';
import { generateUUID } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProductModal({ isOpen, onClose, onSave, editingProduct = null }) {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();

  const [previewId, setPreviewId] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('piece'); // 'piece' | 'kg'
  const [quantity, setQuantity] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [riskDays, setRiskDays] = useState(10);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setPreviewId(editingProduct.id);
        setName(editingProduct.name || '');
        setUnit(editingProduct.unit || 'piece');
        setQuantity(editingProduct.quantity || editingProduct.weight || '');
        setWeight(editingProduct.weight || '');
        setDescription(editingProduct.description || '');
        setRiskDays(editingProduct.days_remaining !== undefined ? Math.max(1, editingProduct.days_remaining) : 10);
      } else {
        setPreviewId(generateUUID());
        setName('');
        setUnit('piece');
        setQuantity('');
        setWeight('');
        setDescription('');
        setRiskDays(10);
      }
      setError('');
    }
  }, [isOpen, editingProduct]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Le nom du produit est obligatoire.');
      return;
    }

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Veuillez fournir une quantité supérieure à 0.');
      return;
    }

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight < 0) {
      setError('Veuillez fournir un poids valide (0 ou supérieur).');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSave({
        id: previewId,
        name: trimmedName,
        unit: unit,
        quantity: parsedQty,
        weight: parsedWeight,
        description: description.trim(),
        risk_days: parseInt(riskDays, 10) || 10,
        user_name: user?.name,
        user_email: user?.email,
      }, editingProduct?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Échec de l’enregistrement du produit.');
    } finally {
      setSaving(false);
    }
  };

  const calculatedRiskDate = new Date();
  calculatedRiskDate.setDate(calculatedRiskDate.getDate() + parseInt(riskDays || 10, 10));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
              {editingProduct ? t('modal_edit_title') : t('modal_capture_title')}
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {t('modal_desc')}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '20px',
              lineHeight: 1,
              padding: '6px 10px',
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

        <form onSubmit={handleSubmit}>
          {/* Readonly Reference ID */}
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('ref_uuid')}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#818cf8', wordBreak: 'break-all' }}>
              {previewId}
            </div>
          </div>

          {/* Product Name */}
          <div className="field-group">
            <label className="field-label" htmlFor="prod-name">{t('product_name_label')}</label>
            <input
              id="prod-name"
              className="field-input"
              placeholder="e.g. Café Arabica Torréfié, Huile Vierge..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Unit Selector: Piece vs Kg */}
          <div className="field-group">
            <label className="field-label">{t('measurement_unit_label')}</label>
            <div className="unit-toggle">
              <button
                type="button"
                className={`unit-btn ${unit === 'piece' ? 'active' : ''}`}
                onClick={() => setUnit('piece')}
              >
                {t('unit_piece')}
              </button>
              <button
                type="button"
                className={`unit-btn ${unit === 'kg' ? 'active' : ''}`}
                onClick={() => setUnit('kg')}
              >
                {t('unit_kg')}
              </button>
            </div>
          </div>

          {/* Dual Row: Quantity & Weight */}
          <div className="dual-field-row">
            <div className="field-group">
              <label className="field-label" htmlFor="prod-qty">
                {t('initial_qty_label')} ({unit === 'piece' ? 'pcs' : 'kg'}) *
              </label>
              <input
                id="prod-qty"
                type="number"
                step={unit === 'piece' ? '1' : '0.01'}
                min={unit === 'piece' ? '1' : '0.01'}
                className="field-input"
                placeholder={unit === 'piece' ? 'e.g. 50' : 'e.g. 25.50'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="prod-weight">
                {t('total_weight_label')}
              </label>
              <input
                id="prod-weight"
                type="number"
                step="0.01"
                min="0"
                className="field-input"
                placeholder="e.g. 15.00"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="field-group">
            <label className="field-label" htmlFor="prod-desc">{t('description_label')}</label>
            <textarea
              id="prod-desc"
              className="field-input"
              rows="2"
              style={{ resize: 'none' }}
              placeholder="Spécifications, origine, emballage..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Risk Timeline Settings */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            marginBottom: '18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {t('risk_threshold_label')}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {isAdmin ? 'Contrôle Admin' : 'Délai 10 Jours'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ width: '80px' }}>
                <input
                  id="risk-days-input"
                  type="number"
                  min="1"
                  max="90"
                  className="field-input"
                  style={{ padding: '6px 8px', fontSize: '13px' }}
                  value={riskDays}
                  onChange={(e) => setRiskDays(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
              <div style={{ flex: 1, minWidth: '160px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {t('risk_rule_notice')}
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {t('target_deadline')} {calculatedRiskDate.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: '1 1 auto' }}
            >
              {t('cancel')}
            </button>
            <button
              id="save-product-btn"
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ flex: '2 1 auto' }}
            >
              {saving ? t('saving') : editingProduct ? t('edit_btn') : t('save_product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
