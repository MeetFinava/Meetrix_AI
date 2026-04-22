import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Moon, SunMedium, LogOut, Settings, Shield } from 'lucide-react';

export default function Navbar({ user, theme, setTheme, backendOnline, onLoginClick, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const userInitials = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
    : 'AI';

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <button className="navbar-logo" onClick={() => handleNav('/')}>
          <span className="logo-mark">M</span>
          Meetrix AI
        </button>

        {/* Desktop Nav */}
        <div className="navbar-nav">
          <button className={`nav-link ${isActive('/tools') ? 'active' : ''}`} onClick={() => handleNav('/tools')}>
            Tools
          </button>
          <button className={`nav-link ${isActive('/pricing') ? 'active' : ''}`} onClick={() => handleNav('/pricing')}>
            Pricing
            <span className="nav-badge-soon">Soon</span>
          </button>
          <button className={`nav-link ${isActive('/api') ? 'active' : ''}`} onClick={() => handleNav('/api')}>
            API
          </button>
          <button className={`nav-link ${isActive('/models') ? 'active' : ''}`} onClick={() => handleNav('/models')}>
            Models
          </button>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Backend status */}
          <div className={`status-dot-wrap`}>
            <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
            {backendOnline ? 'Online' : 'Offline'}
          </div>

          {/* Theme toggle */}
          <button
            className="theme-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
          </button>

          {/* Auth */}
          {user ? (
            <>
              {user.is_admin && (
                <button className="btn btn-ghost btn-sm" onClick={() => handleNav('/admin')}>
                  <Shield size={14} />
                  Admin
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => handleNav('/settings')}>
                <Settings size={14} />
              </button>
              <button className="user-btn" onClick={onLogout}>
                <span className="avatar">{userInitials}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{user.full_name?.split(' ')[0]}</span>
                <LogOut size={14} style={{ color: 'var(--text-4)', marginLeft: '2px' }} />
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={onLoginClick}>
                Sign in
              </button>
              <button className="btn btn-primary btn-sm" onClick={onLoginClick}>
                Get Started
              </button>
            </>
          )}

          {/* Mobile menu */}
          <button className="navbar-menu-btn" onClick={() => setMobileOpen((v) => !v)}>
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '1rem',
          right: '1rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '0.5rem',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
        }}>
          {[
            { label: 'Home', path: '/' },
            { label: 'Tools', path: '/tools' },
            { label: 'Pricing', path: '/pricing' },
            { label: 'API', path: '/api' },
            { label: 'Models', path: '/models' },
            ...(user ? [{ label: 'Settings', path: '/settings' }] : []),
            ...(user?.is_admin ? [{ label: 'Admin Panel', path: '/admin' }] : []),
          ].map((item) => (
            <button
              key={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => handleNav(item.path)}
            >
              {item.label}
            </button>
          ))}
          {!user && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.4rem', width: '100%' }} onClick={() => { onLoginClick(); setMobileOpen(false); }}>
              Sign in
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
