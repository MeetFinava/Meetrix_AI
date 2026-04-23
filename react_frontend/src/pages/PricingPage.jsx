import { motion } from 'framer-motion';
import { Check, Zap, Lock, Sparkles } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Perfect to explore all AI tools.',
    features: ['4 Live AI Tools', '50 generations/month', '100MB document storage', 'Community support', 'Basic history'],
    cta: 'Current Plan',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    desc: 'For individuals and creators at scale.',
    features: ['All Free features', 'Unlimited generations', '10GB storage', 'Priority support', 'GPT-4o + Claude 3.5', 'API access', 'Advanced analytics'],
    cta: 'Coming Soon',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: '$79',
    period: '/month',
    desc: 'For teams and businesses.',
    features: ['All Pro features', 'Team collaboration', 'Custom models', 'SSO / SAML', 'Dedicated support', 'Custom SLA', 'Audit logs'],
    cta: 'Contact Us',
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="page-content feature-page">
      <div className="container-md">
        <motion.div className="static-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="section-label" style={{ background: 'var(--warning-muted)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.25)' }}>
            <Sparkles size={12} /> Pricing — Launching Soon
          </span>
          <h1 className="section-title" style={{ marginTop: '1rem' }}>Simple, transparent pricing</h1>
          <p className="section-desc">All tools are free during the beta. Paid plans launch soon with more models, storage, and API access.</p>
        </motion.div>

        <motion.div
          className="pricing-grid"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {PLANS.map((plan) => (
            <div key={plan.name} className={`pricing-card ${plan.featured ? 'featured' : ''}`} style={{ position: 'relative' }}>
              {plan.featured && (
                <span className="badge badge-pro" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                  <Zap size={10} /> Most Popular
                </span>
              )}
              <div style={{ marginBottom: '0.5rem' }}>
                <span className="badge badge-soon" style={{ fontSize: '0.7rem' }}>Launching Soon</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '0.25rem' }}>{plan.name}</h3>
              <p style={{ fontSize: '0.845rem', color: 'var(--text-3)', marginBottom: '0.75rem' }}>{plan.desc}</p>
              <div className="price">
                {plan.price}<span>{plan.period}</span>
              </div>
              <ul className="pricing-feature-list">
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="btn btn-full" disabled style={{ background: plan.featured ? 'var(--accent-muted)' : 'var(--surface-alt)', color: plan.featured ? 'var(--accent-text)' : 'var(--text-3)', border: '1px solid var(--border)', cursor: 'not-allowed' }}>
                <Lock size={13} /> {plan.cta}
              </button>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="coming-soon-banner"
          style={{ marginTop: '3rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="badge badge-soon" style={{ marginBottom: '0.75rem' }}>Launching Q2 2026</span>
          <h3>Be the first to know</h3>
          <p>Paid plans are in development. All current tools remain free during beta. We'll notify registered users when billing goes live.</p>
        </motion.div>
      </div>
    </div>
  );
}
