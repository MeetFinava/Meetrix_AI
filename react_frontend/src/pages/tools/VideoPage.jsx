import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Download, Lock, Sparkles } from 'lucide-react';

const MODELS = [
  { id: 'modelscope', label: 'ModelScope Video', provider: 'ModelScope', tier: 'free', active: true },
  { id: 'sora',       label: 'Sora',             provider: 'OpenAI',     tier: 'pro',  active: false },
  { id: 'runway',     label: 'RunwayML Gen-3',   provider: 'Runway',     tier: 'pro',  active: false },
];

export default function VideoPage({ form, setForm, busy, result, onSubmit }) {
  const [model, setModel] = useState('modelscope');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="page-content feature-page">
      <div className="container-md">
        <div className="feature-topbar">
          <div className="feature-breadcrumb">
            <Link to="/tools">Tools</Link><span className="sep">›</span>
            <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>Video Generation</span>
          </div>
          <div className="feature-title-row">
            <div>
              <h1 className="feature-title">Video Generation</h1>
              <p className="feature-desc">Create short animated GIF outputs from text prompts. Control frames, FPS, guidance, and resolution.</p>
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
          <div className="feature-cols">
            <div className="feature-panel">
              <h3><Video size={15} /> Prompt &amp; Settings</h3>
              <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Video Prompt *</label>
                  <textarea className="form-textarea" rows={4}
                    placeholder="A drone flyover of a futuristic city at dusk, cinematic slow-motion..."
                    value={form.prompt} onChange={(e) => set('prompt', e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Negative Prompt</label>
                  <input className="form-input" placeholder="static, blurry, low quality..."
                    value={form.negative_prompt} onChange={(e) => set('negative_prompt', e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Width</label>
                    <select className="form-select" value={form.width} onChange={(e) => set('width', Number(e.target.value))}>
                      {['256','320','512'].map((v) => <option key={v} value={v}>{v}px</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Height</label>
                    <select className="form-select" value={form.height} onChange={(e) => set('height', Number(e.target.value))}>
                      {['256','320','512'].map((v) => <option key={v} value={v}>{v}px</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frames</label>
                    <select className="form-select" value={form.num_frames} onChange={(e) => set('num_frames', Number(e.target.value))}>
                      {['8','12','16','20','24'].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">FPS</label>
                    <input className="form-input" type="number" min="4" max="12" value={form.fps} onChange={(e) => set('fps', Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Inference Steps</label>
                    <input className="form-input" type="number" min="10" max="50" value={form.num_inference_steps} onChange={(e) => set('num_inference_steps', Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Guidance Scale</label>
                    <input className="form-input" type="number" step="0.5" min="1" max="15" value={form.guidance_scale} onChange={(e) => set('guidance_scale', Number(e.target.value))} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                  {busy ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Generating...</> : <><Video size={15} /> Generate Video</>}
                </button>
              </form>
            </div>

            <div className="feature-panel">
              <h3><Video size={15} /> Output Preview</h3>
              <div className="output-zone">
                {result ? (
                  <>
                    <img src={result.url} alt="Generated video" style={{ borderRadius: 'var(--r-md)', maxHeight: 340 }} />
                    <a className="btn btn-secondary btn-sm" href={result.url} download={result.filename}>
                      <Download size={14} /> Download GIF
                    </a>
                  </>
                ) : (
                  <>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'rgba(236,72,153,0.1)', display: 'grid', placeItems: 'center', color: '#ec4899' }}><Video size={22} /></div>
                    <p>Your generated video preview will appear here</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-4)' }}>Generation takes 30–90 seconds</p>
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
