import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'login') {
        const res = await api.login(email.trim(), password);
        login(res.user, res.token);
      } else {
        if (!name.trim()) {
          setError('Le nom complet est obligatoire.');
          setSubmitting(false);
          return;
        }
        const res = await api.register(name.trim(), email.trim(), password);
        login(res.user, res.token);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Échec de l’authentification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
              {mode === 'login' ? t('auth_welcome_login') : t('auth_welcome_register')}
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              AuraTrack PERN Inventory
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '20px', padding: '4px' }}
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
          {mode === 'register' && (
            <div className="field-group">
              <label className="field-label" htmlFor="auth-name">{t('full_name')}</label>
              <input
                id="auth-name"
                className="field-input"
                placeholder="e.g. Mohammed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <div className="field-group">
            <label className="field-label" htmlFor="auth-email">{t('email_address')}</label>
            <input
              id="auth-email"
              type="email"
              className="field-input"
              placeholder="e.g. bedoushop@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="auth-password">{t('password_label')}</label>
            <input
              id="auth-password"
              type="password"
              className="field-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            disabled={submitting}
          >
            {submitting ? 'Patientez...' : mode === 'login' ? t('submit_login') : t('submit_register')}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                textDecoration: 'underline',
              }}
            >
              {mode === 'login' ? t('auth_no_account') : t('auth_have_account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
