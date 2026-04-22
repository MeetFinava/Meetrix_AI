import { motion } from 'framer-motion';
import { Code2, Key, Zap, Lock } from 'lucide-react';

const ENDPOINTS = [
  { method: 'POST', path: '/api/image/generate-image', desc: 'Generate image from prompt' },
  { method: 'POST', path: '/api/video/generate-video', desc: 'Generate video from prompt' },
  { method: 'POST', path: '/api/chat/message',         desc: 'Send message in chat session' },
  { method: 'POST', path: '/api/build-project',        desc: 'Build a full project blueprint' },
];

const MOCK_CODE = `import requests

# Your API key (coming soon)
API_KEY = "mtx_xxxxxxxxxxxxxxxxxxxx"

response = requests.post(
  "https://api.meetrix.ai/v1/image/generate",
  headers={"Authorization": f"Bearer {API_KEY}"},
  json={
    "prompt": "A futuristic city skyline at dusk",
    "width": 512,
    "height": 512
  }
)

image = response.json()
print(image["url"])`;

export default function APIPage() {
  return (
    <div className="page-content feature-page">
      <div className="container-md">
        <motion.div className="static-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="section-label"><Code2 size={12} /> API — Coming Soon</span>
          <h1 className="section-title" style={{ marginTop: '1rem' }}>Build with Meetrix AI API</h1>
          <p className="section-desc">Integrate Meetrix AI tools directly into your applications. RESTful API with SDK support for Python, JavaScript, and more.</p>
        </motion.div>

        <motion.div style={{ display: 'grid', gap: '2rem' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>

          {/* API Key section */}
          <div className="feature-panel" style={{ opacity: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={15} /> API Keys</h3>
              <span className="badge badge-soon"><Lock size={10} /> Disabled</span>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ padding: '0.875rem 1rem', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.2rem' }}>Production Key</p>
                  <code style={{ fontSize: '0.82rem', color: 'var(--text-4)', fontFamily: 'ui-monospace, monospace' }}>mtx_•••••••••••••••••••••••••••</code>
                </div>
                <button className="btn btn-ghost btn-sm" disabled><Lock size={13} /> Reveal</button>
              </div>
              <button className="btn btn-primary btn-sm" disabled style={{ width: 'fit-content' }}>
                <Lock size={13} /> Generate New Key — Coming Soon
              </button>
            </div>
          </div>

          {/* Endpoints preview */}
          <div className="feature-panel">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={15} /> Available Endpoints</h3>
            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
              {ENDPOINTS.map((ep) => (
                <div key={ep.path} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.875rem', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                  <span style={{ padding: '0.2rem 0.55rem', background: 'rgba(99,102,241,0.12)', border: '1px solid var(--accent-ring)', borderRadius: 'var(--r-sm)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-text)', fontFamily: 'ui-monospace, monospace', flexShrink: 0 }}>
                    {ep.method}
                  </span>
                  <code style={{ fontSize: '0.82rem', color: 'var(--text-2)', fontFamily: 'ui-monospace, monospace', flex: 1 }}>{ep.path}</code>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-4)' }}>{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code example */}
          <div className="feature-panel">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}><Code2 size={15} /> Quick Start (Python)</h3>
            <div className="api-code-block">{MOCK_CODE}</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-4)', marginTop: '0.75rem' }}>
              ⚠️ This is a preview. API access will be available with Pro and Enterprise plans.
            </p>
          </div>

          <div className="coming-soon-banner">
            <span className="badge badge-soon" style={{ marginBottom: '0.75rem' }}>API Launching Q2 2026</span>
            <h3>API access coming soon</h3>
            <p>We're building a developer-first API with rate limits, usage analytics, and SDK support. Register now to get early access.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
