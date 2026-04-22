import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Zap, LogOut, Shield, CreditCard } from 'lucide-react';
import { formatDate } from '../App.jsx';

export default function SettingsPage({ user, onLogout }) {
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="page-content feature-page">
      <div className="container-sm">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 className="section-title">Settings</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-3)' }}>Manage your account, plan, and preferences.</p>
          </div>

          {/* Profile */}
          <div className="settings-section" style={{ marginBottom: '1.5rem' }}>
            <div className="settings-section-header">
              <h3><User size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />Profile</h3>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Full Name</div>
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 500 }}>{user.full_name}</span>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Email</div>
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>{user.email}</span>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Account Type</div>
              </div>
              <span className={`badge ${user.is_admin ? 'badge-pro' : 'badge-new'}`}>
                {user.is_admin ? <><Shield size={10} /> Admin</> : 'Standard'}
              </span>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Member Since</div>
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>{formatDate(user.created_at)}</span>
            </div>
          </div>

          {/* Usage */}
          <div className="settings-section" style={{ marginBottom: '1.5rem' }}>
            <div className="settings-section-header">
              <h3><Zap size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />Usage</h3>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Token Usage</div>
                <div className="settings-row-desc">Free plan — unlimited during beta</div>
                <div className="usage-bar" style={{ marginTop: '0.5rem' }}>
                  <div className="usage-bar-fill" style={{ width: '18%' }} />
                </div>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)' }}>Beta</span>
            </div>
          </div>

          {/* Plan */}
          <div className="settings-section" style={{ marginBottom: '1.5rem' }}>
            <div className="settings-section-header">
              <h3><CreditCard size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />Plan</h3>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Current Plan</div>
                <div className="settings-row-desc">All tools free during beta period</div>
              </div>
              <span className="badge badge-free">Free Beta</span>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Upgrade to Pro</div>
                <div className="settings-row-desc">Unlimited generations, GPT-4o, Claude 3.5 access</div>
              </div>
              <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.5 }}>
                <Lock size={12} /> Coming Soon
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="settings-section" style={{ marginBottom: '1.5rem' }}>
            <div className="settings-section-header">
              <h3><Lock size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />Security</h3>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Password</div>
                <div className="settings-row-desc">Change your account password</div>
              </div>
              <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.5 }}>
                <Lock size={12} /> Reset — Coming Soon
              </button>
            </div>
          </div>

          {/* Admin panel shortcut */}
          {user.is_admin && (
            <div className="settings-section" style={{ marginBottom: '1.5rem' }}>
              <div className="settings-section-header">
                <h3><Shield size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />Admin Access</h3>
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Admin Panel</div>
                  <div className="settings-row-desc">Manage users, view activity, and control API access</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin')}>
                  <Shield size={13} /> Open Admin Panel
                </button>
              </div>
            </div>
          )}

          {/* Sign out */}
          <div className="settings-section">
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Sign Out</div>
                <div className="settings-row-desc">End your current session on this browser</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={onLogout}>
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
