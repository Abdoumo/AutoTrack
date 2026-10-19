import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer({ style = {} }) {
  const { t } = useLanguage();

  return (
    <footer
      style={{
        width: '100%',
        padding: '20px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        background: 'transparent',
        transition: 'color 0.2s ease, border-color 0.2s ease',
        ...style,
      }}
    >
      <span>{t('created_by')}</span>
      <a
        href="https://cyberlymph.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--accent-primary)',
          fontWeight: '600',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          letterSpacing: '0.01em',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.85';
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            boxShadow: '0 0 6px var(--accent-subtle)',
          }}
        />
        Cyberlymph
      </a>
    </footer>
  );
}
