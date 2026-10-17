import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ activeTab, setActiveTab, onOpenCapture, criticalCount, warningCount }) {
  const { user, isAdmin, logout, toggleRole } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const handleCaptureClick = () => {
    setIsMenuOpen(false);
    onOpenCapture();
  };

  return (
    <header style={{
      background: 'rgba(12, 14, 20, 0.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 16px',
        position: 'relative',
      }}>
        {/* Main Navbar Bar */}
        <div style={{
          height: '58px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          {/* Brand */}
          <div 
            onClick={() => handleNavClick('feed')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
          >
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

          {/* Desktop Navigation Links */}
          <nav className="nav-desktop-links" style={{ display: 'flex', gap: '4px' }}>
            <button
              id="nav-feed-btn"
              onClick={() => handleNavClick('feed')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: activeTab === 'feed' ? '600' : '500',
                background: activeTab === 'feed' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: activeTab === 'feed' ? '#fff' : 'var(--text-secondary)',
                border: activeTab === 'feed' ? '1px solid var(--border-medium)' : '1px solid transparent',
              }}
            >
              {t('feed')}
            </button>

            {/* Admin Only Tabs */}
            {isAdmin && (
              <>
                <button
                  id="nav-users-btn"
                  onClick={() => handleNavClick('users')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: activeTab === 'users' ? '600' : '500',
                    background: activeTab === 'users' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)',
                    border: activeTab === 'users' ? '1px solid var(--border-medium)' : '1px solid transparent',
                  }}
                >
                  {t('users')}
                </button>

                <button
                  id="nav-admin-btn"
                  onClick={() => handleNavClick('admin')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: activeTab === 'admin' ? '600' : '500',
                    background: activeTab === 'admin' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    color: activeTab === 'admin' ? '#fff' : 'var(--text-secondary)',
                    border: activeTab === 'admin' ? '1px solid var(--border-medium)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {t('admin')}
                  {(criticalCount > 0 || warningCount > 0) && (
                    <span style={{
                      background: criticalCount > 0 ? '#ef4444' : '#f59e0b',
                      color: '#fff',
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '700',
                    }}>
                      {criticalCount + warningCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>

          {/* Desktop Right Actions */}
          <div className="nav-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Language Switcher */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              title="Changer de langue / Switch Language"
              style={{
                padding: '5px 8px',
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

            {/* Capture Product Trigger */}
            <button
              id="open-capture-modal-btn"
              onClick={handleCaptureClick}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {t('capture')}
            </button>

            {/* User Session Info & Role Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                onClick={toggleRole}
                title="Cliquer pour basculer Admin / Utilisateur"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span className={`status-dot ${isAdmin ? 'status-dot-active' : 'status-dot-muted'}`} />
                <span style={{ fontSize: '11px', fontWeight: '600', color: isAdmin ? '#818cf8' : '#cbd5e1' }}>
                  {isAdmin ? t('admin_role') : t('user_role')}
                </span>
              </div>

              <button
                id="logout-btn"
                onClick={logout}
                className="btn btn-secondary"
                title="Se déconnecter"
                style={{ padding: '5px 9px', fontSize: '11px' }}
              >
                {t('logout')}
              </button>
            </div>
          </div>

          {/* Mobile Right Controls: Hamburger Toggle Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              id="hamburger-btn"
              className={`hamburger-toggle-btn ${isMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <span className="hamburger-line line-1" />
              <span className="hamburger-line line-2" />
              <span className="hamburger-line line-3" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        <div className={`mobile-hamburger-drawer ${isMenuOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Navigation Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                id="mobile-nav-feed"
                onClick={() => handleNavClick('feed')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: activeTab === 'feed' ? '700' : '500',
                  background: activeTab === 'feed' ? 'rgba(93, 95, 239, 0.15)' : 'transparent',
                  color: activeTab === 'feed' ? '#818cf8' : '#fff',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{t('feed')}</span>
                {activeTab === 'feed' && <span className="status-dot status-dot-active" />}
              </button>

              {isAdmin && (
                <>
                  <button
                    id="mobile-nav-users"
                    onClick={() => handleNavClick('users')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px',
                      fontWeight: activeTab === 'users' ? '700' : '500',
                      background: activeTab === 'users' ? 'rgba(93, 95, 239, 0.15)' : 'transparent',
                      color: activeTab === 'users' ? '#818cf8' : '#fff',
                      border: '1px solid var(--border-subtle)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{t('users')}</span>
                    {activeTab === 'users' && <span className="status-dot status-dot-active" />}
                  </button>

                  <button
                    id="mobile-nav-admin"
                    onClick={() => handleNavClick('admin')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px',
                      fontWeight: activeTab === 'admin' ? '700' : '500',
                      background: activeTab === 'admin' ? 'rgba(93, 95, 239, 0.15)' : 'transparent',
                      color: activeTab === 'admin' ? '#818cf8' : '#fff',
                      border: '1px solid var(--border-subtle)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{t('admin')}</span>
                    {(criticalCount > 0 || warningCount > 0) && (
                      <span style={{
                        background: criticalCount > 0 ? '#ef4444' : '#f59e0b',
                        color: '#fff',
                        fontSize: '10px',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: '700',
                      }}>
                        {criticalCount + warningCount}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Mobile Actions: Capture & Language */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={handleCaptureClick}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px' }}
              >
                {t('capture')}
              </button>

              <button
                onClick={toggleLanguage}
                className="btn btn-secondary"
                style={{ padding: '10px 16px', fontWeight: '700' }}
              >
                {lang === 'fr' ? 'FR' : 'EN'}
              </button>
            </div>

            {/* Mobile User Profile Section */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              marginTop: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div onClick={toggleRole} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`status-dot ${isAdmin ? 'status-dot-active' : 'status-dot-muted'}`} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                    {user?.name || user?.email}
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: isAdmin ? '#818cf8' : 'var(--text-muted)' }}>
                  {isAdmin ? t('admin_role') : t('user_role')} (Toucher pour basculer)
                </span>
              </div>

              <button
                onClick={() => { setIsMenuOpen(false); logout(); }}
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '11px' }}
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
