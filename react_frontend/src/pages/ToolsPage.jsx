import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Image as Img, Video, Bot, BrainCircuit, Sparkles, FolderOpen, FileText, Lock, ArrowRight } from 'lucide-react';

const LIVE_TOOLS = [
  {
    icon: Globe, label: 'Web Builder', path: '/tools/web-builder', color: '#6366f1',
    desc: 'Generate full-stack project blueprints from a prompt. Supports FastAPI, React, Next.js, and more with live build streaming.',
    tags: ['FastAPI', 'React', 'HTML'],
  },
  {
    icon: Img, label: 'Image Generation', path: '/tools/image', color: '#8b5cf6',
    desc: 'Turn text prompts into high-quality images using Stable Diffusion. Negative prompts, custom dimensions, and saved history.',
    tags: ['Stable Diffusion', '512×512', 'PNG'],
  },
  {
    icon: Video, label: 'Video Generation', path: '/tools/video', color: '#ec4899',
    desc: 'Generate animated GIF outputs from text prompts. Control frames, FPS, guidance scale, and resolution.',
    tags: ['ModelScope', 'GIF', 'Animated'],
  },
  {
    icon: Bot, label: 'Document Chat', path: '/tools/chat', color: '#06b6d4',
    desc: 'Upload PDFs, DOCX, TXT, or code files and have a full RAG-powered conversation. Sessions are saved to your history.',
    tags: ['RAG', 'PDF', 'LLaMA 3.3'],
  },
];

const COMING_SOON = [
  { icon: BrainCircuit, label: 'Math Solver',       desc: 'Step-by-step equation solving with LaTeX rendering and formula explanation.' },
  { icon: Sparkles,     label: 'Prompt Generator',  desc: 'Build reusable prompt frameworks for image, video, and chat workflows.' },
  { icon: FolderOpen,   label: 'Project AI',         desc: 'Idea-to-plan generator with stack recommendations and phased milestones.' },
  { icon: FileText,     label: 'Script Writer AI',  desc: 'Generate scripts for YouTube, ads, podcasts, and social content.' },
];

const fade = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function ToolsPage({ user, onLoginNeeded }) {
  const navigate = useNavigate();

  const openTool = (path) => {
    if (!user) { onLoginNeeded(); return; }
    navigate(path);
  };

  return (
    <div className="page-content feature-page">
      <div className="container-lg">
        {/* Header */}
        <motion.div className="tools-page-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <span className="section-label">All Tools</span>
          <h1 className="section-title" style={{ marginTop: '0.75rem' }}>Your AI Workspace</h1>
          <p className="section-desc" style={{ margin: '0.5rem auto 0' }}>
            Four live tools ready to use. More coming soon. Click any live tool to open it in the studio.
          </p>
        </motion.div>

        {/* ── Live Tools ── */}
        <div style={{ marginBottom: '3rem' }}>
          <div className="tools-section-title" style={{ marginBottom: '1.25rem' }}>
            <span className="live-indicator"><span className="live-dot" />Live — Ready to Use</span>
          </div>
          <motion.div
            className="tools-grid"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {LIVE_TOOLS.map((t) => (
              <motion.div key={t.label} className="tool-card" variants={fade} onClick={() => openTool(t.path)}>
                <div className="tool-card-icon" style={{ background: `${t.color}18`, borderColor: `${t.color}33`, color: t.color }}>
                  <t.icon size={20} />
                </div>
                <div className="tool-card-body">
                  <h3>{t.label}</h3>
                  <p>{t.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                    {t.tags.map((tag) => (
                      <span key={tag} style={{ padding: '0.2rem 0.55rem', borderRadius: 'var(--r-full)', background: 'var(--surface-raised)', border: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 500 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="tool-card-footer">
                  <span className="badge badge-live"><span className="live-dot" style={{ width: 5, height: 5 }} />Live</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── Coming Soon Tools ── */}
        <div>
          <div className="tools-section-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-soon" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '0.78rem' }}>Coming Soon</span>
            <span style={{ color: 'var(--text-4)', fontSize: '0.8rem' }}>— In development, not yet available</span>
          </div>
          <motion.div
            className="tools-grid"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {COMING_SOON.map((t) => (
              <motion.div key={t.label} className="tool-card tool-card-disabled" variants={fade}
                style={{ cursor: 'not-allowed', opacity: 0.55 }}
                onClick={() => {/* no-op */}}
              >
                <div className="lock-overlay"><Lock size={13} /></div>
                <div className="tool-card-icon" style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--text-4)' }}>
                  <t.icon size={20} />
                </div>
                <div className="tool-card-body">
                  <h3>{t.label}</h3>
                  <p>{t.desc}</p>
                </div>
                <div className="tool-card-footer">
                  <span className="badge badge-soon">Coming Soon</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Login prompt if not authenticated */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: '2.5rem', padding: '1.75rem 2rem', background: 'var(--accent-muted)', border: '1px solid var(--accent-ring)', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}
          >
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.3rem' }}>Sign in to access live tools</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Create a free account to use Web Builder, Image Generation, Video Generation, and Document Chat.</p>
            </div>
            <button className="btn btn-primary" onClick={onLoginNeeded}>
              Get Started Free <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
