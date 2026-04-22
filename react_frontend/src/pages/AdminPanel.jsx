import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, BarChart2, Cpu, CreditCard, FileText, ArrowLeft,
  Moon, SunMedium, Shield, RefreshCw, ChevronRight,
} from 'lucide-react';
import { formatDate } from '../App.jsx';

const NAV = [
  { id: 'overview',  icon: BarChart2,   label: 'Overview'   },
  { id: 'users',     icon: Users,        label: 'Users'      },
  { id: 'models',    icon: Cpu,          label: 'Models'     },
  { id: 'payments',  icon: CreditCard,   label: 'Payments'   },
  { id: 'api_logs',  icon: FileText,     label: 'API Logs'   },
];

export default function AdminPanel({ data, loading, detail, detailLoading, selectedUserId, saving, onSelectUser, onToggleAdmin, onToggleActive, loadAdmin, user, theme, setTheme, userInitials }) {
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');

  useEffect(() => {
    if (loadAdmin) loadAdmin();
  }, []);

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="logo-mark" style={{ width: 28, height: 28, fontSize: '0.78rem' }}>M</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Meetrix AI</span>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
              <Shield size={10} /> Admin Panel
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section-title">Dashboard</div>
          {NAV.map((item) => (
            <button key={item.id} className={`admin-nav-item ${section === item.id ? 'active' : ''}`} onClick={() => setSection(item.id)}>
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ padding: '0.5rem 0.6rem', marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.6rem', borderRadius: 'var(--r-md)', background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
              <span className="avatar" style={{ width: 26, height: 26, fontSize: '0.68rem' }}>{userInitials}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)', truncate: true }}>{user?.full_name?.split(' ')[0]}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>Admin</div>
              </div>
            </div>
          </div>
          <button className="admin-nav-item" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <SunMedium size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="admin-nav-item" onClick={() => navigate('/')}>
            <ArrowLeft size={15} /> Back to App
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-content">
        {/* Topbar */}
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="admin-topbar-title">{NAV.find((n) => n.id === section)?.label}</span>
            {loading && <span style={{ fontSize: '0.78rem', color: 'var(--text-4)' }}>Loading...</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={loadAdmin} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
            </button>
          </div>
        </div>

        <div className="admin-main">
          {section === 'overview' && <OverviewSection data={data} loading={loading} />}
          {section === 'users'    && <UsersSection data={data} loading={loading} detail={detail} detailLoading={detailLoading} selectedUserId={selectedUserId} saving={saving} onSelectUser={onSelectUser} onToggleAdmin={onToggleAdmin} onToggleActive={onToggleActive} />}
          {section === 'models'   && <ModelsSection />}
          {section === 'payments' && <PaymentsSection />}
          {section === 'api_logs' && <APILogsSection />}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function OverviewSection({ data, loading }) {
  if (loading || !data.overview) return <p style={{ color: 'var(--text-4)' }}>Loading analytics...</p>;
  const ov = data.overview;
  const stats = [
    { label: 'Total Users',    value: ov.total_users,         sub: 'Registered accounts' },
    { label: 'Admin Users',    value: ov.admin_users,         sub: 'With admin access'   },
    { label: 'Projects Built', value: ov.projects_generated,  sub: 'Via web builder'     },
    { label: 'Assets Created', value: ov.assets_generated,    sub: 'Images & videos'     },
    { label: 'Chat Sessions',  value: ov.chat_sessions,       sub: 'RAG conversations'   },
    { label: 'Chat Messages',  value: ov.chat_messages,       sub: 'Total messages sent' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="stats-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-widget">
            <div className="stat-widget-label">{s.label}</div>
            <div className="stat-widget-value">{s.value ?? '—'}</div>
            <div className="stat-widget-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '1rem' }}>All Users</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Projects</th>
                <th>Assets</th>
              </tr>
            </thead>
            <tbody>
              {(data.users || []).map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <span className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                        {u.full_name?.split(' ').slice(0, 2).map((p) => p[0]).join('')}
                      </span>
                      {u.full_name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-3)' }}>{u.email}</td>
                  <td><span className={`badge ${u.is_admin ? 'badge-pro' : 'badge-new'}`}>{u.is_admin ? 'Admin' : 'User'}</span></td>
                  <td><span className={`badge ${u.is_active ? 'badge-live' : 'badge-soon'}`}>{u.is_active ? 'Active' : 'Disabled'}</span></td>
                  <td style={{ color: 'var(--text-2)' }}>{u.project_count ?? 0}</td>
                  <td style={{ color: 'var(--text-2)' }}>{u.asset_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function UsersSection({ data, loading, detail, detailLoading, selectedUserId, saving, onSelectUser, onToggleAdmin, onToggleActive }) {
  const selectedUser = detail?.user;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
      {/* User list */}
      <div className="data-table-wrap">
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-1)' }}>Users</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-4)' }}>{data.users?.length || 0} total</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {loading && <p style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-4)' }}>Loading...</p>}
          {(data.users || []).map((u) => (
            <button key={u.id}
              style={{ width: '100%', padding: '0.875rem 1rem', border: 'none', borderBottom: '1px solid var(--border)', background: selectedUserId === u.id ? 'var(--accent-muted)' : 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', transition: 'background 0.15s' }}
              onClick={() => onSelectUser(u.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                  {u.full_name?.split(' ').slice(0, 2).map((p) => p[0]).join('')}
                </span>
                <div>
                  <div style={{ fontSize: '0.855rem', fontWeight: 600, color: selectedUserId === u.id ? 'var(--accent-text)' : 'var(--text-1)' }}>{u.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>{u.email}</div>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>

      {/* User detail */}
      {detailLoading ? (
        <p style={{ color: 'var(--text-4)', padding: '1rem' }}>Loading user details...</p>
      ) : selectedUser ? (
        <div className="admin-user-detail">
          <div className="admin-detail-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span className="avatar" style={{ width: 36, height: 36, fontSize: '0.88rem' }}>
                  {selectedUser.full_name?.split(' ').slice(0, 2).map((p) => p[0]).join('')}
                </span>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{selectedUser.full_name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-4)' }}>{selectedUser.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span className={`badge ${selectedUser.is_admin ? 'badge-pro' : 'badge-new'}`}>{selectedUser.is_admin ? 'Admin' : 'User'}</span>
                <span className={`badge ${selectedUser.is_active ? 'badge-live' : 'badge-soon'}`}>{selectedUser.is_active ? 'Active' : 'Disabled'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" disabled={saving} onClick={() => onToggleAdmin(selectedUser)}>
                <Shield size={13} /> {selectedUser.is_admin ? 'Remove Admin' : 'Make Admin'}
              </button>
              <button className={`btn btn-sm ${selectedUser.is_active ? 'btn-danger' : 'btn-ghost'}`} disabled={saving} onClick={() => onToggleActive(selectedUser)}>
                {selectedUser.is_active ? 'Disable User' : 'Enable User'}
              </button>
            </div>
          </div>

          <div className="admin-detail-grid">
            {[
              { label: 'Created',       value: formatDate(selectedUser.created_at) },
              { label: 'Last Login',    value: formatDate(selectedUser.last_login_at) },
              { label: 'Projects',      value: selectedUser.project_count ?? 0 },
              { label: 'Assets',        value: selectedUser.asset_count ?? 0 },
              { label: 'Chat Sessions', value: selectedUser.chat_session_count ?? 0 },
              { label: 'Messages',      value: selectedUser.chat_message_count ?? 0 },
            ].map((c) => (
              <div key={c.label} className="admin-detail-cell">
                <span>{c.label}</span>
                <strong>{c.value}</strong>
              </div>
            ))}
          </div>

          {/* Activity lists */}
          <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { title: 'Projects',      items: (detail?.projects || []).map((p) => ({ id: p.id, title: p.project_name, meta: formatDate(p.created_at) })) },
              { title: 'Assets',        items: (detail?.assets || []).map((a) => ({ id: a.id, title: a.asset_type, meta: formatDate(a.created_at) })) },
              { title: 'Chat Sessions', items: (detail?.chat_sessions || []).map((s) => ({ id: s.id, title: s.title, meta: formatDate(s.updated_at) })) },
            ].map((group) => (
              <div key={group.title}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', marginBottom: '0.5rem' }}>
                  {group.title} <span style={{ color: 'var(--text-3)' }}>({group.items.length})</span>
                </div>
                {group.items.length === 0 ? <p style={{ fontSize: '0.82rem', color: 'var(--text-4)' }}>None yet</p> : null}
                {group.items.slice(0, 5).map((item) => (
                  <div key={item.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-1)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>{item.meta}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.875rem' }}>
          Select a user from the list to view details
        </div>
      )}
    </motion.div>
  );
}

function PlaceholderSection({ title, desc }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="coming-soon-banner" style={{ marginTop: '1rem' }}>
        <span className="badge badge-soon" style={{ marginBottom: '0.75rem' }}>Coming Soon</span>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </motion.div>
  );
}

function ModelsSection() {
  return <PlaceholderSection title="Model Management" desc="Track per-model usage, set rate limits, and manage model availability across plans. Launching with the API tier." />;
}
function PaymentsSection() {
  return <PlaceholderSection title="Payments & Billing" desc="View subscription status, invoice history, and revenue analytics. Available when paid plans launch." />;
}
function APILogsSection() {
  return <PlaceholderSection title="API Access Logs" desc="Monitor API key usage, request logs, and rate limit metrics. Available with the API access tier." />;
}
