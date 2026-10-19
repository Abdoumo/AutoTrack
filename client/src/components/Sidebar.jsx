import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Package, 
  Users, 
  FileSpreadsheet, 
  PlusCircle, 
  Moon, 
  Sun, 
  Languages, 
  LogOut, 
  ShieldCheck, 
  User, 
  X,
  Layers
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenCapture,
  criticalCount = 0,
  warningCount = 0,
  isMobileOpen = false,
  setIsMobileOpen = () => {},
}) {
  const { user, isAdmin, logout, toggleRole } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const handleCaptureClick = () => {
    onOpenCapture();
    setIsMobileOpen(false);
  };

  const totalAlerts = criticalCount + warningCount;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`sidebar-container ${isMobileOpen ? 'open' : ''}`}>
        {/* Top Brand Header */}
        <div style={{
          padding: '20px 18px 16px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div
            onClick={() => handleTabClick('feed')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #5d5fef 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(93, 95, 239, 0.35)',
              color: '#fff',
            }}>
              <Layers size={18} />
            </div>
            <div>
              <div style={{
                fontSize: '15px',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}>
                Aura<span style={{ color: '#5d5fef' }}>Track</span>
              </div>
              <span style={{
                fontSize: '9px',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                PERN Inventory
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Fermer"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: isMobileOpen ? 'block' : 'none',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Primary Action Button */}
        <div style={{ padding: '16px 14px 12px 14px' }}>
          <button
            id="sidebar-create-product-btn"
            type="button"
            onClick={handleCaptureClick}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(93, 95, 239, 0.35)',
            }}
          >
            <PlusCircle size={17} />
            <span>{t('capture')}</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div style={{ flex: 1, padding: '0 10px', overflowY: 'auto' }}>
          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            fontWeight: '700',
            padding: '8px 10px 6px 10px',
          }}>
            {t('sidebar_nav') || 'Menu Principal'}
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {/* Feed / Inventory Tab */}
            <button
              id="sidebar-feed-btn"
              type="button"
              onClick={() => handleTabClick('feed')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: activeTab === 'feed' ? '600' : '500',
                background: activeTab === 'feed' ? 'var(--accent-subtle)' : 'transparent',
                color: activeTab === 'feed' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: activeTab === 'feed' ? '1px solid var(--border-medium)' : '1px solid transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Package size={17} color={activeTab === 'feed' ? '#5d5fef' : 'currentColor'} />
              <span style={{ flex: 1 }}>{t('feed')}</span>
            </button>

            {/* Admin Tabs */}
            {isAdmin && (
              <>
                {/* Users Management Tab */}
                <button
                  id="sidebar-users-btn"
                  type="button"
                  onClick={() => handleTabClick('users')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: activeTab === 'users' ? '600' : '500',
                    background: activeTab === 'users' ? 'var(--accent-subtle)' : 'transparent',
                    color: activeTab === 'users' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: activeTab === 'users' ? '1px solid var(--border-medium)' : '1px solid transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Users size={17} color={activeTab === 'users' ? '#5d5fef' : 'currentColor'} />
                  <span style={{ flex: 1 }}>{t('users')}</span>
                </button>

                {/* Admin Ledger & Export Tab */}
                <button
                  id="sidebar-admin-btn"
                  type="button"
                  onClick={() => handleTabClick('admin')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: activeTab === 'admin' ? '600' : '500',
                    background: activeTab === 'admin' ? 'var(--accent-subtle)' : 'transparent',
                    color: activeTab === 'admin' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: activeTab === 'admin' ? '1px solid var(--border-medium)' : '1px solid transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileSpreadsheet size={17} color={activeTab === 'admin' ? '#5d5fef' : 'currentColor'} />
                  <span style={{ flex: 1 }}>{t('admin')}</span>
                  {totalAlerts > 0 && (
                    <span style={{
                      background: criticalCount > 0 ? '#ef4444' : '#f59e0b',
                      color: '#ffffff',
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '700',
                    }}>
                      {totalAlerts}
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>

          {/* Preferences Group */}
          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            fontWeight: '700',
            padding: '18px 10px 6px 10px',
          }}>
            {t('sidebar_preferences') || 'Préférences'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Theme Toggle */}
            <button
              id="sidebar-theme-toggle"
              type="button"
              onClick={toggleTheme}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isDark ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#6366f1" />}
                <span>{isDark ? t('theme_light') : t('theme_dark')}</span>
              </div>
              <span style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontWeight: '600',
                background: 'var(--bg-input)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}>
                {isDark ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* Language Toggle */}
            <button
              id="sidebar-lang-toggle"
              type="button"
              onClick={toggleLanguage}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Languages size={15} />
                <span>Langue</span>
              </div>
              <span style={{
                fontSize: '10px',
                color: '#818cf8',
                fontWeight: '700',
                background: 'var(--bg-input)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}>
                {lang === 'fr' ? 'FR' : 'EN'}
              </span>
            </button>
          </div>
        </div>

        {/* User Profile & Session Footer */}
        <div style={{
          padding: '14px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-elevated)',
        }}>
          {/* User Profile Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5d5fef 0%, #a855f7 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(93, 95, 239, 0.3)',
              }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user?.name || 'Utilisateur'}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user?.email || 'N/A'}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              id="sidebar-logout-btn"
              type="button"
              onClick={logout}
              title={t('logout')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Role badge switcher */}
          <div
            onClick={toggleRole}
            title="Cliquer pour basculer Admin / Utilisateur"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={`status-dot ${isAdmin ? 'status-dot-active' : 'status-dot-muted'}`} />
              <span style={{ fontWeight: '600', color: isAdmin ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {isAdmin ? t('admin_role') : t('user_role')}
              </span>
            </div>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              Basculer ⇄
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
