import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError(lang === 'fr' ? 'Veuillez saisir votre email et mot de passe.' : 'Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'login') {
        const res = await api.login(cleanEmail, password);
        login(res.user, res.token);
      } else {
        if (!name.trim()) {
          setError(lang === 'fr' ? 'Le nom complet est obligatoire.' : 'Full name is required.');
          setSubmitting(false);
          return;
        }
        const res = await api.register(name.trim(), cleanEmail, password);
        login(res.user, res.token);
      }
    } catch (err) {
      setError(err.message || (lang === 'fr' ? 'Échec de connexion.' : 'Authentication failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('bedoushop@gmail.com');
    setPassword('Bx9#kLm2vQ7pWsR');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-app)',
      padding: '16px',
    }}>
      {/* Top Header Bar */}
      <header style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '9px',
            height: '9px',
            borderRadius: '2px',
            background: '#5d5fef',
            boxShadow: '0 0 8px rgba(93, 95, 239, 0.6)',
            display: 'inline-block',
          }} />
          <span style={{
            fontSize: '15px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            color: '#fff',
            textTransform: 'uppercase',
          }}>
            Aura<span style={{ color: '#818cf8' }}>Track</span>
          </span>
          <span style={{
            fontSize: '9px',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            padding: '1px 5px',
            borderRadius: '3px',
            fontWeight: '600',
          }}>
            PERN
          </span>
        </div>

        {/* Language Switcher */}
        <button
          id="login-lang-toggle"
          onClick={toggleLanguage}
          style={{
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: '700',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            letterSpacing: '0.04em',
          }}
        >
          {lang === 'fr' ? 'FR' : 'EN'}
        </button>
      </header>

      {/* Centered Auth Gate Card */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 0',
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)',
          width: '100%',
          maxWidth: '400px',
          padding: '28px 24px',
          animation: 'modalReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}>
          {/* Card Title */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '-0.01em' }}>
              {mode === 'login' ? t('auth_welcome_login') : t('auth_welcome_register')}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {lang === 'fr' 
                ? 'Authentification requise pour accéder à l’inventaire.' 
                : 'Authentication required to access product inventory.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              color: '#f87171',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="field-group">
                <label className="field-label" htmlFor="auth-gate-name">
                  {t('full_name')}
                </label>
                <input
                  id="auth-gate-name"
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
              <label className="field-label" htmlFor="auth-gate-email">
                {t('email_address')}
              </label>
              <input
                id="auth-gate-email"
                type="email"
                className="field-input"
                placeholder="bedoushop@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus={mode === 'login'}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="auth-gate-password">
                {t('password_label')}
              </label>
              <input
                id="auth-gate-password"
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              id="auth-gate-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', padding: '10px', fontSize: '13px' }}
              disabled={submitting}
            >
              {submitting 
                ? (lang === 'fr' ? 'Connexion en cours...' : 'Logging in...') 
                : mode === 'login' ? t('submit_login') : t('submit_register')}
            </button>

            {/* Quick Demo Credentials Helper */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '7px 10px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(93, 95, 239, 0.1)',
                  color: '#818cf8',
                  border: '1px solid rgba(93, 95, 239, 0.25)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {lang === 'fr' ? 'Remplir compte admin (bedoushop@gmail.com)' : 'Fill admin credentials (bedoushop@gmail.com)'}
              </button>
            )}

            {/* Mode Switcher */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {mode === 'login' ? t('auth_no_account') : t('auth_have_account')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
