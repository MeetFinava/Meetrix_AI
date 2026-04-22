import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Send, Upload, Plus, Lock } from 'lucide-react';
import { formatDate } from '../../App.jsx';

const MODELS = [
  { id: 'llama', label: 'LLaMA 3.3 70B', provider: 'Groq', tier: 'free', active: true },
  { id: 'gpt4',  label: 'GPT-4o',        provider: 'OpenAI', tier: 'pro', active: false },
  { id: 'claude', label: 'Claude 3.5',   provider: 'Anthropic', tier: 'pro', active: false },
];

export default function ChatPage({ chatSessionId, chatMessages, chatPrompt, setChatPrompt, chatBusy, chatUploadBusy, chatFileRef, onUpload, onSubmit, onNewChat, onOpenConversation, historyData, historyBusy }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="page-content feature-page">
      <div className="container-lg">
        <div className="feature-topbar">
          <div className="feature-breadcrumb">
            <Link to="/tools">Tools</Link><span className="sep">›</span>
            <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>Document Chat</span>
          </div>
          <div className="feature-title-row">
            <div>
              <h1 className="feature-title">Chat with Documents</h1>
              <p className="feature-desc">Upload PDFs, DOCX, TXT, or code files and ask questions. Powered by RAG. All sessions are saved.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-live"><span className="live-dot" />Live</span>
            </div>
          </div>
          <div className="model-selector">
            <span className="model-selector-label">Model</span>
            {MODELS.map((m) => (
              <button key={m.id} className={`model-pill ${m.id === 'llama' ? 'selected' : ''} ${!m.active ? 'disabled' : ''}`} disabled={!m.active}>
                {!m.active && <Lock size={11} />}
                {m.label}
                <span className={`pill-badge badge ${m.tier === 'free' ? 'badge-free' : 'badge-pro'}`}>{m.tier === 'free' ? 'Free' : 'PRO'}</span>
                {!m.active && <span className="badge badge-soon" style={{ fontSize: '0.62rem' }}>Soon</span>}
              </button>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem', alignItems: 'start' }}>

            {/* Sidebar */}
            <div className="chat-sidebar">
              <div className="chat-sidebar-header">
                <h3>Saved Chats</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>
                  {historyBusy ? 'Loading...' : `${historyData.chat_sessions?.length || 0}`}
                </span>
              </div>

              {/* Actions */}
              <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onNewChat}>
                  <Plus size={13} /> New Chat
                </button>
                <label className="btn btn-ghost btn-sm" style={{ flex: 1, cursor: 'pointer' }}>
                  {chatUploadBusy ? 'Uploading...' : <><Upload size={13} /> Upload</>}
                  <input ref={chatFileRef} type="file" accept=".pdf,.docx,.txt,.md,.csv,.json,.py,.js,.ts" onChange={onUpload} hidden />
                </label>
              </div>

              <div className="chat-history-list">
                {(historyData.chat_sessions || []).length === 0 && !historyBusy ? (
                  <p style={{ padding: '1rem', fontSize: '0.82rem', color: 'var(--text-4)', textAlign: 'center' }}>No saved chats yet</p>
                ) : null}
                {(historyData.chat_sessions || []).map((s) => (
                  <button key={s.id} className={`chat-history-item ${chatSessionId === s.id ? 'active' : ''}`} onClick={() => onOpenConversation(s.id)}>
                    <strong>{s.title}</strong>
                    <em>{s.message_count} messages · {formatDate(s.updated_at)}</em>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat main */}
            <div className="chat-main">
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="chat-empty">
                    <div style={{ width: 52, height: 52, borderRadius: 'var(--r-lg)', background: 'var(--accent-muted)', border: '1px solid var(--accent-ring)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
                      <Bot size={24} />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Start a conversation</h3>
                    <p>Upload a document using the sidebar button, then ask a question about its content.</p>
                  </div>
                ) : (
                  chatMessages.map((m, i) => (
                    <div key={i} className={`msg-bubble ${m.role}`}>
                      <span className="msg-label">{m.role === 'user' ? 'You' : 'Meetrix AI'}</span>
                      <div className="msg-text">{m.content}</div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <form className="chat-input-area" onSubmit={onSubmit}>
                <input
                  className="form-input"
                  placeholder="Ask a question about your uploaded document..."
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={chatBusy || !chatPrompt.trim()}>
                  {chatBusy ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : <Send size={15} />}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
