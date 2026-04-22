import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Download, Lock, Zap } from 'lucide-react';

const MODELS = [
  { id: 'llama', label: 'LLaMA 3.3 70B', provider: 'Groq',       tier: 'free', active: true  },
  { id: 'gpt4',  label: 'GPT-4o',         provider: 'OpenAI',     tier: 'pro',  active: false },
  { id: 'claude', label: 'Claude 3.5',    provider: 'Anthropic',  tier: 'pro',  active: false },
];

const SITE_TYPES   = ['Hospital', 'E-commerce', 'Portfolio', 'Gym', 'School', 'SaaS', 'Blog', 'Agency'];
const STYLING      = ['CSS', 'Bootstrap', 'Tailwind'];
const THEMES       = ['Modern', 'Minimal', 'Dark', 'Corporate', 'Colorful'];
const FRONTEND_FW  = ['HTML', 'React', 'Next.js', 'Vue'];
const BACKEND_FW   = ['FastAPI', 'Node.js', 'Django', 'Express'];
const DATABASES    = ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'];
const ALL_PAGES    = ['Home', 'About', 'Contact', 'Services', 'Blog', 'Login', 'Dashboard'];

export default function WebBuilderPage({ form, setForm, busy, log, latestZip, onSubmit }) {
  const [model, setModel] = useState('llama');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const togglePage = (p) => setForm((f) => ({
    ...f, pages: f.pages.includes(p) ? f.pages.filter((x) => x !== p) : [...f.pages, p],
  }));

  return (
    <div className="page-content feature-page">
      <div className="container-lg">
        <div className="feature-topbar">
          <div className="feature-breadcrumb">
            <Link to="/tools">Tools</Link><span className="sep">›</span>
            <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>Web Builder</span>
          </div>
          <div className="feature-title-row">
            <div>
              <h1 className="feature-title">Web Builder</h1>
              <p className="feature-desc">Generate full-stack project blueprints with live backend streaming. Download the complete zip when done.</p>
            </div>
            <span className="badge badge-live"><span className="live-dot" />Live</span>
          </div>
          <div className="model-selector">
            <span className="model-selector-label">Model</span>
            {MODELS.map((m) => (
              <button key={m.id} className={`model-pill ${model === m.id && m.active ? 'selected' : ''} ${!m.active ? 'disabled' : ''}`}
                onClick={() => m.active && setModel(m.id)} disabled={!m.active}>
                {!m.active && <Lock size={11} />}
                {m.label}
                <span className={`pill-badge badge ${m.tier === 'free' ? 'badge-free' : 'badge-pro'}`}>{m.tier === 'free' ? 'Free' : 'PRO'}</span>
                {!m.active && <span className="badge badge-soon" style={{ fontSize: '0.62rem' }}>Soon</span>}
              </button>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

            {/* Config form */}
            <div className="feature-panel">
              <h3><Globe size={15} /> Project Configuration</h3>
              <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>

                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input className="form-input" placeholder="my-awesome-project" value={form.project_name}
                    onChange={(e) => set('project_name', e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  {[
                    { label: 'Site Type', key: 'website_type', options: SITE_TYPES },
                    { label: 'Theme', key: 'theme', options: THEMES },
                    { label: 'Styling', key: 'styling_framework', options: STYLING },
                    { label: 'Frontend', key: 'frontend_framework', options: FRONTEND_FW },
                    { label: 'Backend', key: 'backend_framework', options: BACKEND_FW },
                    { label: 'Database', key: 'database', options: DATABASES },
                  ].map(({ label, key, options }) => (
                    <div key={key} className="form-group">
                      <label className="form-label">{label}</label>
                      <select className="form-select" value={form[key]} onChange={(e) => set(key, e.target.value)}>
                        {options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Pages</label>
                  <div className="pill-select">
                    {ALL_PAGES.map((p) => (
                      <button key={p} type="button" className={`pill-option ${form.pages.includes(p) ? 'active' : ''}`} onClick={() => togglePage(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                  {[
                    { label: 'Authentication', key: 'authentication' },
                    { label: 'Payment', key: 'payment_integration' },
                    { label: 'Admin Panel', key: 'admin_panel' },
                  ].map(({ label, key }) => (
                    <button key={key} type="button" className={`toggle-row ${form[key] ? 'on' : ''}`} onClick={() => set(key, !form[key])}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{label}</span>
                      <span className="toggle-val">{form[key] ? 'On' : 'Off'}</span>
                    </button>
                  ))}
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                  {busy
                    ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Building...</>
                    : <><Zap size={15} /> Generate &amp; Build</>
                  }
                </button>
              </form>
            </div>

            {/* Output panel */}
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div className="feature-panel">
                <h3><Zap size={15} /> Live Build Stream</h3>
                <div className="wb-log-panel">
                  <pre>{log || 'Build logs will stream here when you click Generate...'}</pre>
                </div>
              </div>

              <div className="feature-panel">
                <h3><Download size={15} /> Download</h3>
                {latestZip ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--success-muted)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--r-md)', fontSize: '0.875rem', color: 'var(--success)' }}>
                      ✓ Build successful — project ready for download
                    </div>
                    <a className="btn btn-primary btn-full" href={URL.createObjectURL(latestZip.blob)} download={latestZip.filename}>
                      <Download size={15} /> Download {latestZip.filename}
                    </a>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-4)' }}>
                    After a successful build, the generated ZIP file will appear here for download.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
