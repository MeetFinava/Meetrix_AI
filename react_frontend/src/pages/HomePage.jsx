import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Image as Img, Video, Globe, BrainCircuit, Sparkles, FolderOpen, Shield, Zap, Lock } from 'lucide-react';

const TOOLS = [
  { icon: Globe,  label: 'Build Website',   path: '/tools/web-builder', color: '#6366f1' },
  { icon: Img,    label: 'Generate Image',  path: '/tools/image',       color: '#8b5cf6' },
  { icon: Video,  label: 'Generate Video',  path: '/tools/video',       color: '#ec4899' },
  { icon: Bot,    label: 'Chat with PDF',   path: '/tools/chat',        color: '#06b6d4' },
];

const FEATURES = [
  { icon: Zap,        title: 'Blazing Fast',       desc: 'Powered by Groq LLaMA 3.3 70B — sub-second response times for AI generation.' },
  { icon: Shield,     title: 'Secure by Default',  desc: 'Session-backed auth, per-user data isolation, and manual role management.' },
  { icon: FolderOpen, title: 'Full History',        desc: 'Every build, image, video, and chat is saved to your personal workspace.' },
  { icon: BrainCircuit, title: 'Multi-Model',       desc: 'Switch between models per tool. Free tier available, PRO models coming soon.' },
];

const STATS = [
  { value: '4+',    label: 'Live AI Tools'  },
  { value: '<1s',   label: 'Response Time'  },
  { value: '100%',  label: 'Open Backend'   },
  { value: 'Free',  label: 'To Try'         },
];

const UPCOMING = [
  { icon: BrainCircuit, title: 'Math Solver',        desc: 'Step-by-step solving with LaTeX output.' },
  { icon: Sparkles,     title: 'Prompt Generator',   desc: 'Reusable prompt frameworks for any workflow.' },
  { icon: FolderOpen,   title: 'Project AI',         desc: 'Idea-to-plan generation with stack advice.' },
];

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function HomePage({ user, onGetStarted }) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!user) { onGetStarted(); return; }
    navigate('/tools');
  };

  const goTool = (path) => {
    if (!user) { onGetStarted(); return; }
    navigate(path);
  };

  return (
    <div className="feature-page">
      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg-glow" aria-hidden="true" />

        <motion.div className="hero-eyebrow" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Sparkles size={13} />
          Introducing Meetrix AI — Your AI Workspace
        </motion.div>

        <motion.h1 className="hero-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          One Platform.<br />Multiple AI Tools.<br />Endless Possibilities.
        </motion.h1>

        <motion.p className="hero-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          Build websites, generate images and videos, chat with your documents — all in one professional AI workspace. No setup needed.
        </motion.p>

        {/* Prompt box */}
        <motion.div className="hero-prompt-wrap" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <form className="hero-prompt-box" onSubmit={handlePromptSubmit}>
            <Sparkles size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <input
              className="hero-prompt-input"
              placeholder="Ask Meetrix AI to build a website, generate an image, or analyze a PDF..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              {user ? 'Go' : 'Try Free'}
              <ArrowRight size={14} />
            </button>
          </form>
        </motion.div>

        {/* Quick actions */}
        <motion.div className="quick-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
          {TOOLS.map((t) => (
            <button key={t.path} className="quick-action-btn" onClick={() => goTool(t.path)}>
              <span className="quick-action-icon" style={{ background: `${t.color}18`, color: t.color }}>
                <t.icon size={16} />
              </span>
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div className="hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
          {STATS.map((s) => (
            <div key={s.label} className="hero-stat">
              <strong>{s.value}</strong>
              {s.label}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features strip ── */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={fade} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'var(--accent-muted)', border: '1px solid var(--accent-ring)', display: 'grid', placeItems: 'center', color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>
                  <f.icon size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.3rem', letterSpacing: '-0.01em' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.845rem', color: 'var(--text-3)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Live tools grid ── */}
      <section className="section">
        <div className="container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="section-label">Live Tools</span>
            <h2 className="section-title">Everything you need in one studio</h2>
            <p className="section-desc">Four production-ready AI tools, connected to your backend and ready to use. Saved history. Secure ownership.</p>
          </motion.div>

          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.1rem' }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {[
              { icon: Globe,  label: 'Web Builder',     desc: 'Generate full-stack project blueprints with live build streaming and zip download.',                  path: '/tools/web-builder', color: '#6366f1' },
              { icon: Img,    label: 'Image Generation', desc: 'Turn prompts into saved image assets. Preview instantly, download, and access from history.', path: '/tools/image',        color: '#8b5cf6' },
              { icon: Video,  label: 'Video Generation', desc: 'Create animated GIF outputs from text prompts with full resolution and FPS control.',           path: '/tools/video',        color: '#ec4899' },
              { icon: Bot,    label: 'Document Chat',    desc: 'Upload PDFs, docs, or code files and chat with them. All conversations are saved.',               path: '/tools/chat',         color: '#06b6d4' },
            ].map((t, i) => (
              <motion.div
                key={t.label}
                className="card card-clickable"
                variants={fade}
                onClick={() => goTool(t.path)}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', background: `${t.color}18`, border: `1px solid ${t.color}33`, display: 'grid', placeItems: 'center', color: t.color }}>
                    <t.icon size={20} />
                  </div>
                  <span className="badge badge-live"><span className="live-dot" style={{ width: 5, height: 5 }} />Live</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.35rem', letterSpacing: '-0.01em' }}>{t.label}</h3>
                  <p style={{ fontSize: '0.845rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{t.desc}</p>
                </div>
                <span className="btn btn-ghost btn-sm" style={{ width: 'fit-content', marginTop: 'auto' }}>
                  Open Tool <ArrowRight size={13} />
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Coming Soon ── */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="section-label" style={{ background: 'var(--warning-muted)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.25)' }}>Coming Soon</span>
            <h2 className="section-title">Next-gen tools in development</h2>
          </motion.div>
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {UPCOMING.map((u) => (
              <motion.div key={u.title} className="card" variants={fade} style={{ opacity: 0.65, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-4)', flexShrink: 0 }}>
                  <u.icon size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>{u.title}</h3>
                    <span className="badge badge-soon">Soon</span>
                  </div>
                  <p style={{ fontSize: '0.845rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{u.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            {!user ? (
              <>
                <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: 'var(--r-xl)', background: 'var(--accent-muted)', border: '1px solid var(--accent-ring)', marginBottom: '1.5rem' }}>
                  <Lock size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>Ready to build with AI?</h2>
                <p className="section-desc" style={{ margin: '0 auto 2rem' }}>Create a free account and access all four AI tools instantly. No credit card required.</p>
                <button className="btn btn-primary btn-xl" onClick={onGetStarted}>
                  Start Free <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <h2 className="section-title" style={{ marginBottom: '0.75rem' }}>Your workspace is ready</h2>
                <p className="section-desc" style={{ margin: '0 auto 2rem' }}>Jump into the studio and start building.</p>
                <button className="btn btn-primary btn-xl" onClick={() => navigate('/tools')}>
                  Open Studio <ArrowRight size={16} />
                </button>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '2rem 1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-4)', fontSize: '0.82rem', textAlign: 'center' }}>
        © 2026 Meetrix AI · Built with FastAPI + React · All tools connected to your live backend
      </footer>
    </div>
  );
}
