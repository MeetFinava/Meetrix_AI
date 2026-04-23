import { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthModal({ onClose, onSuccess, backendOnline }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && form.password.length < 8) {
      setError({ title: 'Password too short', message: 'Password must be at least 8 characters.' });
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? JSON.stringify({ email: form.email, password: form.password })
        : JSON.stringify({ full_name: form.full_name, email: form.email, password: form.password });

      const res = await fetch(`http://localhost:8000/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const payload = await res.json();
      if (!res.ok) throw { message: payload?.message || payload?.detail || 'Authentication failed.' };
      onSuccess(payload.token, payload.user, mode);
    } catch (err) {
      setError({ title: 'Error', message: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span className="logo-mark" style={{ width: 28, height: 28, fontSize: '0.78rem' }}>M</span>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)' }}>Meetrix AI</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
            {mode === 'login' ? 'Welcome back. Sign in to your workspace.' : 'Create your free account to get started.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(null); }}>
            Sign In
          </button>
          <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(null); }}>
            Register
          </button>
        </div>

        {/* Google button */}
        <button className="btn-google" disabled>
          {GOOGLE_ICON}
          Continue with Google
          <span className="badge badge-soon" style={{ marginLeft: 'auto' }}>Soon</span>
        </button>

        {/* Divider */}
        <div className="auth-divider">or continue with email</div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: '2.2rem' }}
                  placeholder="Jane Smith"
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: '2.2rem' }}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: '2.2rem' }}
                type="password"
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <strong style={{ fontWeight: 700 }}>{error.title}: </strong>{error.message}
            </div>
          )}

          {!backendOnline && (
            <div className="auth-error">Backend is offline. Please start the FastAPI server.</div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !backendOnline}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-4)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            style={{ border: 'none', background: 'none', color: 'var(--accent-text)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
