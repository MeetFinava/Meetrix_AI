import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';

import Navbar    from './components/Navbar.jsx';
import AuthModal from './components/AuthModal.jsx';

import HomePage      from './pages/HomePage.jsx';
import ToolsPage     from './pages/ToolsPage.jsx';
import PricingPage   from './pages/PricingPage.jsx';
import APIPage       from './pages/APIPage.jsx';
import ModelsPage    from './pages/ModelsPage.jsx';
import SettingsPage  from './pages/SettingsPage.jsx';
import AdminPanel    from './pages/AdminPanel.jsx';

import ImagePage      from './pages/tools/ImagePage.jsx';
import VideoPage      from './pages/tools/VideoPage.jsx';
import ChatPage       from './pages/tools/ChatPage.jsx';
import WebBuilderPage from './pages/tools/WebBuilderPage.jsx';

/* ── Constants ───────────────────────────────────────────── */
const API = 'http://localhost:8000/api';

const EMPTY_HISTORY = { projects: [], assets: [], chat_sessions: [] };

const INITIAL_WEB_FORM = {
  project_name: '', website_type: 'Hospital', styling_framework: 'CSS',
  theme: 'Modern', frontend_framework: 'HTML', backend_required: true,
  backend_framework: 'FastAPI', database: 'PostgreSQL',
  pages: ['Home', 'About', 'Contact'], authentication: true,
  payment_integration: false, admin_panel: false,
};
const INITIAL_IMAGE_FORM = { prompt: '', negative_prompt: '', width: 512, height: 512 };
const INITIAL_VIDEO_FORM = {
  prompt: '', negative_prompt: '', num_frames: 16, num_inference_steps: 25,
  guidance_scale: 7.5, width: 512, height: 320, fps: 8,
};

/* ── Helpers ─────────────────────────────────────────────── */
function parseError(payload, status) {
  if (payload?.message)
    return { title: payload.error_type || 'Error', message: payload.message, suggestion: payload.suggestion || null };
  if (payload?.detail && typeof payload.detail === 'string')
    return { title: 'Request failed', message: payload.detail, suggestion: status >= 500 ? 'Check backend logs.' : null };
  if (status === 401) return { title: 'Unauthorized', message: 'Session expired. Please sign in again.', suggestion: null };
  if (status === 429) return { title: 'Rate limit', message: 'Too many requests. Please wait.', suggestion: null };
  return { title: 'Error', message: 'An unknown error occurred.', suggestion: 'Check backend status.' };
}

async function api(path, options = {}, token) {
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.body)
    headers.set('Content-Type', 'application/json');

  let response;
  try {
    response = await fetch(`${API}${path}`, { ...options, headers });
  } catch {
    throw { title: 'Connection error', message: 'Cannot reach the backend.', suggestion: 'Start FastAPI on port 8000.' };
  }
  if (!response.ok) {
    let payload = null;
    try { payload = await response.json(); } catch { /* empty */ }
    throw parseError(payload, response.status);
  }
  return response;
}

export function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString();
}

/* ── Route Guards (defined outside App to preserve identity across renders) ── */
function ProtectedRoute({ user, onRequireAuth, children }) {
  useEffect(() => { if (!user) onRequireAuth?.(); }, [user, onRequireAuth]);
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ user, children }) {
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return children;
}

/* ── App ─────────────────────────────────────────────────── */
export default function App() {
  /* Auth */
  const [token, setToken] = useState(() => localStorage.getItem('meetrix_token') || '');
  const [user,  setUser]  = useState(() => {
    const s = localStorage.getItem('meetrix_user');
    return s ? JSON.parse(s) : null;
  });
  const [authOpen, setAuthOpen] = useState(false);

  /* Theme */
  const [theme, setTheme] = useState(() => localStorage.getItem('meetrix_theme') || 'dark');

  /* Backend health */
  const [backendOnline, setBackendOnline] = useState(false);

  /* Global error */
  const [globalError, setGlobalError] = useState(null);

  /* History */
  const [historyData, setHistoryData] = useState(EMPTY_HISTORY);
  const [historyBusy, setHistoryBusy] = useState(false);

  /* Web Builder */
  const [webForm,       setWebForm]       = useState(INITIAL_WEB_FORM);
  const [webLog,        setWebLog]        = useState('');
  const [webBusy,       setWebBusy]       = useState(false);
  const [latestZip,     setLatestZip]     = useState(null);

  /* Image */
  const [imageForm,   setImageForm]   = useState(INITIAL_IMAGE_FORM);
  const [imageBusy,   setImageBusy]   = useState(false);
  const [imageResult, setImageResult] = useState(null);

  /* Video */
  const [videoForm,   setVideoForm]   = useState(INITIAL_VIDEO_FORM);
  const [videoBusy,   setVideoBusy]   = useState(false);
  const [videoResult, setVideoResult] = useState(null);

  /* Chat */
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatMessages,  setChatMessages]  = useState([]);
  const [chatPrompt,    setChatPrompt]    = useState('');
  const [chatBusy,      setChatBusy]      = useState(false);
  const [chatUploadBusy, setChatUploadBusy] = useState(false);
  const chatFileRef = useRef(null);

  /* Admin */
  const [adminData,            setAdminData]            = useState({ overview: null, users: [] });
  const [adminBusy,            setAdminBusy]            = useState(false);
  const [selectedAdminUserId,  setSelectedAdminUserId]  = useState(null);
  const [adminUserDetail,      setAdminUserDetail]      = useState(null);
  const [adminDetailBusy,      setAdminDetailBusy]      = useState(false);
  const [adminSaveBusy,        setAdminSaveBusy]        = useState(false);

  const userInitials = useMemo(() => {
    if (!user?.full_name) return 'AI';
    return user.full_name.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  }, [user]);

  /* ── Effects ── */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('meetrix_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) localStorage.setItem('meetrix_token', token);
    else       localStorage.removeItem('meetrix_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('meetrix_user', JSON.stringify(user));
    else      localStorage.removeItem('meetrix_user');
  }, [user]);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const r = await fetch('http://localhost:8000/health');
        if (alive) setBackendOnline(r.ok);
      } catch { if (alive) setBackendOnline(false); }
    };
    check();
    const id = setInterval(check, 7000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!token) return;
    api('/auth/me', {}, token)
      .then((r) => r.json())
      .then((p) => setUser(p.user))
      .catch(() => {});
  }, [token]);

  /* ── Auth handlers ── */
  const handleAuthSuccess = (tok, usr, _mode) => {
    setToken(tok);
    setUser(usr);
    setAuthOpen(false);
  };

  const handleLogout = async () => {
    try { if (token) await api('/auth/logout', { method: 'POST' }, token); } catch { /* ok */ }
    setToken(''); setUser(null);
    setChatSessionId(null); setChatMessages([]);
    setHistoryData(EMPTY_HISTORY);
    setAdminData({ overview: null, users: [] });
  };

  /* ── History ── */
  const loadHistory = async () => {
    setHistoryBusy(true);
    try {
      const r = await api('/auth/history', {}, token);
      const p = await r.json();
      setHistoryData(p);
      return p;
    } catch (e) { setGlobalError(e); return null; }
    finally { setHistoryBusy(false); }
  };

  /* ── Web Builder ── */
  const handleWebSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(null); setWebBusy(true); setWebLog(''); setLatestZip(null);
    try {
      const r = await api('/build-project', { method: 'POST', body: JSON.stringify(webForm) }, token);
      const reader = r.body.getReader(); const dec = new TextDecoder(); let log = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        log += chunk; setWebLog((c) => c + chunk);
      }
      await loadHistory();
      if (log.includes('BUILD SUCCESS')) {
        const hr = await api('/auth/history', {}, token);
        const hl = await hr.json();
        const proj = hl.projects?.[0];
        if (proj?.project_slug) {
          const dr = await api(`/download/${proj.project_slug}`, {}, token);
          const blob = await dr.blob();
          setLatestZip({ blob, filename: `${proj.project_name}.zip` });
        }
      }
    } catch (e) { setGlobalError(e); }
    finally { setWebBusy(false); }
  };

  /* ── Image ── */
  const handleImageSubmit = async (e) => {
    e.preventDefault(); setGlobalError(null); setImageBusy(true);
    try {
      const r = await api('/image/generate-image', {
        method: 'POST',
        body: JSON.stringify({ ...imageForm, width: Number(imageForm.width), height: Number(imageForm.height) }),
      }, token);
      const blob = await r.blob();
      setImageResult({ url: URL.createObjectURL(blob), blob, filename: `meetrix-${Date.now()}.png` });
      await loadHistory();
    } catch (e) { setGlobalError(e); }
    finally { setImageBusy(false); }
  };

  /* ── Video ── */
  const handleVideoSubmit = async (e) => {
    e.preventDefault(); setGlobalError(null); setVideoBusy(true);
    try {
      const r = await api('/video/generate-video', {
        method: 'POST',
        body: JSON.stringify({
          ...videoForm,
          num_frames: Number(videoForm.num_frames), num_inference_steps: Number(videoForm.num_inference_steps),
          guidance_scale: Number(videoForm.guidance_scale), width: Number(videoForm.width),
          height: Number(videoForm.height), fps: Number(videoForm.fps),
        }),
      }, token);
      const blob = await r.blob();
      setVideoResult({ url: URL.createObjectURL(blob), blob, filename: `meetrix-${Date.now()}.gif` });
      await loadHistory();
    } catch (e) { setGlobalError(e); }
    finally { setVideoBusy(false); }
  };

  /* ── Chat ── */
  const ensureSession = async () => {
    if (chatSessionId) return chatSessionId;
    const r = await api('/chat/session', { method: 'POST' }, token);
    const p = await r.json();
    setChatSessionId(p.session_id); setChatMessages([]);
    return p.session_id;
  };

  const handleChatUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setChatUploadBusy(true); setGlobalError(null);
    try {
      const sid = await ensureSession();
      const fd = new FormData(); fd.append('file', file);
      await api(`/chat/upload?session_id=${sid}`, { method: 'POST', body: fd }, token);
      await loadHistory();
    } catch (e) { setGlobalError(e); }
    finally { setChatUploadBusy(false); if (chatFileRef.current) chatFileRef.current.value = ''; }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault(); if (!chatPrompt.trim()) return;
    const prompt = chatPrompt.trim(); setChatPrompt(''); setChatBusy(true); setGlobalError(null);
    setChatMessages((m) => [...m, { role: 'user', content: prompt }]);
    try {
      const sid = await ensureSession();
      const r = await api('/chat/message', { method: 'POST', body: JSON.stringify({ session_id: sid, message: prompt }) }, token);
      const p = await r.json();
      setChatMessages((m) => [...m, { role: 'assistant', content: p.answer }]);
      await loadHistory();
    } catch (e) { setGlobalError(e); }
    finally { setChatBusy(false); }
  };

  const startNewChat = () => { setChatSessionId(null); setChatMessages([]); };

  const loadConversation = async (sid) => {
    setGlobalError(null);
    try {
      const r = await api(`/chat/history/${sid}`, {}, token);
      const p = await r.json();
      setChatSessionId(sid);
      setChatMessages(p.messages.map((m) => ({ role: m.role, content: m.content })));
    } catch (e) { setGlobalError(e); }
  };

  /* ── Admin ── */
  const loadAdminDetail = async (uid) => {
    if (!uid) return; setAdminDetailBusy(true);
    try {
      const r = await api(`/admin/users/${uid}`, {}, token);
      setAdminUserDetail(await r.json());
    } catch (e) { setGlobalError(e); }
    finally { setAdminDetailBusy(false); }
  };

  const loadAdmin = async () => {
    setAdminBusy(true);
    try {
      const [or, ur] = await Promise.all([api('/admin/overview', {}, token), api('/admin/users', {}, token)]);
      const overview = await or.json();
      const { users = [] } = await ur.json();
      setAdminData({ overview, users });
      const pref = users.find((u) => u.id === selectedAdminUserId)?.id || users[0]?.id || null;
      setSelectedAdminUserId(pref);
      if (pref) await loadAdminDetail(pref);
      else setAdminUserDetail(null);
    } catch (e) { setGlobalError(e); }
    finally { setAdminBusy(false); }
  };

  const updateAdminUser = async (uid, updates) => {
    setAdminSaveBusy(true); setGlobalError(null);
    try {
      const r = await api(`/admin/users/${uid}`, { method: 'PATCH', body: JSON.stringify(updates) }, token);
      const p = await r.json();
      setAdminData((d) => ({ ...d, users: d.users.map((u) => (u.id === uid ? p.user : u)) }));
      if (adminUserDetail?.user?.id === uid) setAdminUserDetail((d) => ({ ...d, user: p.user }));
      if (user?.id === uid) setUser((u) => u ? { ...u, ...p.user } : u);
      await loadAdmin();
    } catch (e) { setGlobalError(e); }
    finally { setAdminSaveBusy(false); }
  };

  /* ── Shared props ── */
  const navProps   = { user, theme, setTheme, backendOnline, onLoginClick: () => setAuthOpen(true), onLogout: handleLogout };
  const histProps  = { historyData, historyBusy, loadHistory };
  const chatProps  = { chatSessionId, chatMessages, chatPrompt, setChatPrompt, chatBusy, chatUploadBusy, chatFileRef, onUpload: handleChatUpload, onSubmit: handleChatSubmit, onNewChat: startNewChat, onOpenConversation: loadConversation, ...histProps };
  const adminProps = { data: adminData, loading: adminBusy, detail: adminUserDetail, detailLoading: adminDetailBusy, selectedUserId: selectedAdminUserId, saving: adminSaveBusy, onSelectUser: (id) => { setSelectedAdminUserId(id); loadAdminDetail(id); }, onToggleAdmin: (u) => updateAdminUser(u.id, { is_admin: !u.is_admin }), onToggleActive: (u) => updateAdminUser(u.id, { is_active: !u.is_active }), loadAdmin };

  const requireAuth = useCallback(() => setAuthOpen(true), []);

  return (
    <BrowserRouter>
      {/* Admin panel has its own full-page layout */}
      <Routes>
        <Route path="/admin/*" element={
          <AdminRoute user={user}>
            <AdminPanel {...adminProps} user={user} loadAdmin={loadAdmin} theme={theme} setTheme={setTheme} userInitials={userInitials} />
          </AdminRoute>
        } />

        {/* Main app routes */}
        <Route path="*" element={
          <>
            <Navbar {...navProps} userInitials={userInitials} />

            <div className="page-wrapper">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<HomePage user={user} onGetStarted={() => setAuthOpen(true)} backendOnline={backendOnline} />} />
                  <Route path="/tools" element={<ToolsPage user={user} onLoginNeeded={() => setAuthOpen(true)} />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/api" element={<APIPage />} />
                  <Route path="/models" element={<ModelsPage />} />
                  <Route path="/settings" element={
                    <ProtectedRoute user={user} onRequireAuth={requireAuth}>
                      <SettingsPage user={user} onLogout={handleLogout} />
                    </ProtectedRoute>
                  } />

                  <Route path="/tools/image" element={
                    <ProtectedRoute user={user} onRequireAuth={requireAuth}>
                      <ImagePage form={imageForm} setForm={setImageForm} busy={imageBusy} result={imageResult} onSubmit={handleImageSubmit} token={token} />
                    </ProtectedRoute>
                  } />
                  <Route path="/tools/video" element={
                    <ProtectedRoute user={user} onRequireAuth={requireAuth}>
                      <VideoPage form={videoForm} setForm={setVideoForm} busy={videoBusy} result={videoResult} onSubmit={handleVideoSubmit} token={token} />
                    </ProtectedRoute>
                  } />
                  <Route path="/tools/chat" element={
                    <ProtectedRoute user={user} onRequireAuth={requireAuth}>
                      <ChatPage {...chatProps} token={token} />
                    </ProtectedRoute>
                  } />
                  <Route path="/tools/web-builder" element={
                    <ProtectedRoute user={user} onRequireAuth={requireAuth}>
                      <WebBuilderPage form={webForm} setForm={setWebForm} busy={webBusy} log={webLog} latestZip={latestZip} onSubmit={handleWebSubmit} token={token} />
                    </ProtectedRoute>
                  } />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </div>

            {/* Auth modal */}
            {authOpen && (
              <AuthModal onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} backendOnline={backendOnline} />
            )}

            {/* Global error toast */}
            {globalError && (
              <motion.div
                className="toast-error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="toast-error-title">{globalError.title || 'Error'}</span>
                <span className="toast-error-msg">{globalError.message}</span>
                {globalError.suggestion && <span className="toast-error-hint">Tip: {globalError.suggestion}</span>}
                <button
                  onClick={() => setGlobalError(null)}
                  style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: '1rem', lineHeight: 1 }}
                >×</button>
              </motion.div>
            )}
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}
