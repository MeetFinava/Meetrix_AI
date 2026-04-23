import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Download, Lock } from 'lucide-react';

const MODELS = [
  { id: 'sdxl',  label: 'Stable Diffusion XL', provider: 'HuggingFace', tier: 'free',  active: true  },
  { id: 'dalle', label: 'DALL-E 3',             provider: 'OpenAI',      tier: 'pro',  active: false },
  { id: 'flux',  label: 'Flux Pro',             provider: 'Black Forest', tier: 'pro', active: false },
];

export default function ImagePage({ form, setForm, busy, result, onSubmit }) {
  const [model, setModel] = useState('sdxl');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="page-content feature-page">
      <div className="container-md">

        {/* Top bar */}
        <div className="feature-topbar">
          <div className="feature-breadcrumb">
            <Link to="/tools">Tools</Link><span className="sep">›</span>
            <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>Image Generation</span>
          </div>

          <div className="feature-title-row">
            <div>
              <h1 className="feature-title">Image Generation</h1>
              <p className="feature-desc">Turn text prompts into high-quality images. Adjust dimensions and use negative prompts for fine-tuned results.</p>
            </div>
            <span className="badge badge-live"><span className="live-dot" />Live</span>
          </div>

          {/* Model selector */}
          <div className="model-selector">
            <span className="model-selector-label">Model</span>
            {MODELS.map((m) => (
              <button
                key={m.id}
                className={`model-pill ${model === m.id && m.active ? 'selected' : ''} ${!m.active ? 'disabled' : ''}`}
                onClick={() => m.active && setModel(m.id)}
                disabled={!m.active}
              >
                {!m.active && <Lock size={11} />}
                {m.label}
                <span className={`pill-badge badge ${m.tier === 'free' ? 'badge-free' : 'badge-pro'}`}>
                  {m.tier === 'free' ? 'Free' : 'PRO'}
                </span>
                {!m.active && <span className="badge badge-soon" style={{ fontSize: '0.62rem' }}>Soon</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="feature-cols">
            {/* Form */}
            <div className="feature-panel">
              <h3><Sparkles size={15} /> Prompt</h3>
              <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Image Prompt *</label>
                  <textarea
                    className="form-textarea"
                    rows={5}
                    placeholder="A futuristic city skyline at sunset with neon lights reflecting on wet streets, cinematic photography..."
                    value={form.prompt}
                    onChange={(e) => set('prompt', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Negative Prompt</label>
                  <input className="form-input" placeholder="blurry, low quality, distorted..." value={form.negative_prompt} onChange={(e) => set('negative_prompt', e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Width</label>
                    <select className="form-select" value={form.width} onChange={(e) => set('width', Number(e.target.value))}>
                      {['256', '512', '768'].map((v) => <option key={v} value={v}>{v}px</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Height</label>
                    <select className="form-select" value={form.height} onChange={(e) => set('height', Number(e.target.value))}>
                      {['256', '512', '768'].map((v) => <option key={v} value={v}>{v}px</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                  {busy ? (
                    <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Generating...</>
                  ) : (
                    <><Sparkles size={15} /> Generate Image</>
                  )}
                </button>
              </form>
            </div>

            {/* Output */}
            <div className="feature-panel">
              <h3><ChevronRight size={15} /> Output</h3>
              <div className="output-zone">
                {result ? (
                  <>
                    <img src={result.url} alt="Generated" style={{ borderRadius: 'var(--r-md)', maxHeight: 380 }} />
                    <a className="btn btn-secondary btn-sm" href={result.url} download={result.filename}>
                      <Download size={14} /> Download PNG
                    </a>
                  </>
                ) : (
                  <>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'var(--accent-muted)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
                      <Sparkles size={22} />
                    </div>
                    <p>Your generated image will appear here</p>
                  </>
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
