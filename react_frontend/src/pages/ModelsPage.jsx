import { motion } from 'framer-motion';
import { Cpu, Zap } from 'lucide-react';

const MODELS = [
  {
    name: 'LLaMA 3.3 70B',
    provider: 'Meta / Groq',
    type: 'Language Model',
    tier: 'free',
    desc: 'State-of-the-art open-source language model. Powers Document Chat and Web Builder. Sub-second latency via Groq.',
    usedFor: ['Document Chat', 'Web Builder'],
    speed: 'Fast',
  },
  {
    name: 'Stable Diffusion XL',
    provider: 'Stability AI / HuggingFace',
    type: 'Image Generation',
    tier: 'free',
    desc: 'High-quality image generation with negative prompt support. Outputs up to 768×768 PNG.',
    usedFor: ['Image Generation'],
    speed: 'Medium',
  },
  {
    name: 'ModelScope Video',
    provider: 'Alibaba / HuggingFace',
    type: 'Video Generation',
    tier: 'free',
    desc: 'Text-to-video model generating animated GIF outputs. Control frames, FPS, and resolution.',
    usedFor: ['Video Generation'],
    speed: 'Slow',
  },
  {
    name: 'GPT-4o',
    provider: 'OpenAI',
    type: 'Language + Vision',
    tier: 'pro',
    desc: 'OpenAI\'s most capable model. Multimodal input, reasoning, and long context window support.',
    usedFor: ['Chat', 'Image Analysis'],
    speed: 'Fast',
    comingSoon: true,
  },
  {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    type: 'Language Model',
    tier: 'pro',
    desc: 'Anthropic\'s flagship model. Exceptional at long documents, coding, and analytical tasks.',
    usedFor: ['Chat', 'Documents'],
    speed: 'Fast',
    comingSoon: true,
  },
  {
    name: 'Gemini Pro',
    provider: 'Google DeepMind',
    type: 'Multimodal',
    tier: 'pro',
    desc: 'Google\'s multimodal model with native image, video, and audio understanding.',
    usedFor: ['Chat', 'Vision'],
    speed: 'Fast',
    comingSoon: true,
  },
];

const SPEED_COLOR = { Fast: 'var(--success)', Medium: 'var(--warning)', Slow: 'var(--danger)' };

export default function ModelsPage() {
  const free = MODELS.filter((m) => m.tier === 'free');
  const paid = MODELS.filter((m) => m.tier === 'pro');

  return (
    <div className="page-content feature-page">
      <div className="container-md">
        <motion.div className="static-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="section-label"><Cpu size={12} /> AI Models</span>
          <h1 className="section-title" style={{ marginTop: '1rem' }}>Models powering Meetrix AI</h1>
          <p className="section-desc">We use best-in-class open-source and commercial models for each task. Free models are available now. Pro models coming with paid plans.</p>
        </motion.div>

        {/* Free models */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Free Models</h2>
            <span className="badge badge-free">Live Now</span>
          </div>
          <div className="models-grid" style={{ marginBottom: '2.5rem' }}>
            {free.map((m) => <ModelCard key={m.name} model={m} />)}
          </div>
        </motion.div>

        {/* Pro models */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Pro Models</h2>
            <span className="badge badge-pro"><Zap size={10} /> PRO</span>
            <span className="badge badge-soon">Coming Soon</span>
          </div>
          <div className="models-grid">
            {paid.map((m) => <ModelCard key={m.name} model={m} />)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ModelCard({ model: m }) {
  return (
    <div className="model-card" style={{ opacity: m.comingSoon ? 0.6 : 1 }}>
      <div className="model-card-header">
        <div>
          <div className="model-name">{m.name}</div>
          <div className="model-provider">{m.provider} · {m.type}</div>
        </div>
        <span className={`badge ${m.tier === 'free' ? 'badge-free' : 'badge-pro'}`}>
          {m.tier === 'free' ? 'Free' : 'PRO'}
        </span>
      </div>
      <p className="model-desc" style={{ marginBottom: '0.875rem' }}>{m.desc}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {m.usedFor.map((u) => (
            <span key={u} style={{ padding: '0.18rem 0.55rem', borderRadius: 'var(--r-full)', background: 'var(--surface-raised)', border: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 500 }}>{u}</span>
          ))}
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: SPEED_COLOR[m.speed], flexShrink: 0 }}>⚡ {m.speed}</span>
      </div>
      {m.comingSoon && <div style={{ marginTop: '0.75rem' }}><span className="badge badge-soon">Coming Soon</span></div>}
    </div>
  );
}
