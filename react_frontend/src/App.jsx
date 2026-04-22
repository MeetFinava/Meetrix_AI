import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  FolderOpen,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sparkles,
  SunMedium,
  UserCog,
  Video,
  X,
} from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:8000/api';

const featureTiles = [
  {
    id: 'web_builder',
    icon: LayoutDashboard,
    label: 'Web Builder',
    title: 'Generate full-stack project blueprints with live build streaming',
    description: 'Use the current FastAPI backend to create project structures, zip downloads, and saved project history.',
    status: 'Live',
  },
  {
    id: 'image_generation',
    icon: ImageIcon,
    label: 'Image Generation',
    title: 'Turn prompts into saved image assets',
    description: 'Generate images, preview them instantly, and keep them inside user history with secure ownership.',
    status: 'Live',
  },
  {
    id: 'video_generation',
    icon: Video,
    label: 'Video Generation',
    title: 'Create animated outputs from text prompts',
    description: 'Your backend video route stays intact while the frontend becomes easier to explore and operate.',
    status: 'Live',
  },
  {
    id: 'rag_chat',
    icon: Bot,
    label: 'Chat With Documents',
    title: 'Upload files, ask questions, and reopen saved conversations',
    description: 'Now lives directly inside the main 4-feature studio so the experience feels unified and usable.',
    status: 'Live',
  },
];

const upcomingFeatures = [
  {
    icon: BrainCircuit,
    title: 'Math Solver',
    description: 'Step-by-step solving, formula explanation, and cleaner educational outputs.',
  },
  {
    icon: Sparkles,
    title: 'Prompt Generator',
    description: 'Reusable prompt frameworks for marketing, product, image, and research workflows.',
  },
  {
    icon: FolderOpen,
    title: 'Project AI',
    description: 'Guided idea-to-plan generation with stack recommendations and phased execution.',
  },
];

const initialWebBuilderForm = {
  project_name: '',
  website_type: 'Hospital',
  styling_framework: 'CSS',
  theme: 'Modern',
  frontend_framework: 'HTML',
  backend_required: true,
  backend_framework: 'FastAPI',
  database: 'PostgreSQL',
  pages: ['Home', 'About', 'Contact'],
  authentication: true,
  payment_integration: false,
  admin_panel: false,
};

const initialImageForm = {
  prompt: '',
  negative_prompt: '',
  width: 512,
  height: 512,
};

const initialVideoForm = {
  prompt: '',
  negative_prompt: '',
  num_frames: 16,
  num_inference_steps: 25,
  guidance_scale: 7.5,
  width: 512,
  height: 320,
  fps: 8,
};

const authInitialState = {
  full_name: '',
  email: '',
  password: '',
};

const emptyHistory = {
  projects: [],
  assets: [],
  chat_sessions: [],
};

function parseErrorPayload(payload, status) {
  if (Array.isArray(payload)) {
    return {
      title: 'Unexpected response',
      message: 'The backend returned an unexpected validation payload.',
      suggestion: 'Retry once. If it continues, check the backend logs.',
    };
  }

  if (payload?.message) {
    return {
      title: payload.error_type || 'Request failed',
      message: payload.message,
      suggestion: payload.suggestion || null,
    };
  }

  if (payload?.detail && typeof payload.detail === 'string') {
    return {
      title: 'Request failed',
      message: payload.detail,
      suggestion: status >= 500 ? 'Please retry or inspect the backend service.' : null,
    };
  }

  if (status === 401) {
    return {
      title: 'Authentication failed',
      message: 'Your session or credentials are not valid.',
      suggestion: 'Log in again and retry.',
    };
  }

  if (status === 429) {
    return {
      title: 'Rate limit reached',
      message: 'You have reached the current usage limit for this feature.',
      suggestion: 'Wait for the next usage window or use another feature.',
    };
  }

  return {
    title: 'Request failed',
    message: 'An unknown error occurred.',
    suggestion: 'Retry once. If it continues, check backend and database status.',
  };
}

async function apiRequest(path, options = {}, token) {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw {
      title: 'Connection problem',
      message: 'Cannot reach the backend server.',
      suggestion: 'Start FastAPI on http://localhost:8000 and make sure PostgreSQL is running.',
      raw: error,
    };
  }

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw parseErrorPayload(payload, response.status);
  }

  return response;
}

function formatDate(value) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('meetrix_token') || '');
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('meetrix_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('meetrix_theme') || 'dark');
  const [backendOnline, setBackendOnline] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutPromptOpen, setLogoutPromptOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(authInitialState);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [featureFocus, setFeatureFocus] = useState('web_builder');
  const [webBuilderForm, setWebBuilderForm] = useState(initialWebBuilderForm);
  const [webBuilderLog, setWebBuilderLog] = useState('');
  const [webBuilderBusy, setWebBuilderBusy] = useState(false);
  const [latestProjectBlob, setLatestProjectBlob] = useState(null);
  const [imageForm, setImageForm] = useState(initialImageForm);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageResult, setImageResult] = useState(null);
  const [videoForm, setVideoForm] = useState(initialVideoForm);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoResult, setVideoResult] = useState(null);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatUploadBusy, setChatUploadBusy] = useState(false);
  const [historyData, setHistoryData] = useState(emptyHistory);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [adminData, setAdminData] = useState({ overview: null, users: [] });
  const [adminBusy, setAdminBusy] = useState(false);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState(null);
  const [selectedAdminUserDetail, setSelectedAdminUserDetail] = useState(null);
  const [adminDetailBusy, setAdminDetailBusy] = useState(false);
  const [adminSaveBusy, setAdminSaveBusy] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [notice, setNotice] = useState('Meetrix AI is connected to your current backend routes.');
  const chatFileInputRef = useRef(null);

  const userInitials = useMemo(() => {
    if (!user?.full_name) return 'AI';
    return user.full_name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('meetrix_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('meetrix_token', token || '');
    if (!token) {
      localStorage.removeItem('meetrix_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('meetrix_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('meetrix_user');
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        if (!mounted) return;
        setBackendOnline(response.ok);
      } catch {
        if (!mounted) return;
        setBackendOnline(false);
      }
    };

    checkHealth();
    const intervalId = window.setInterval(checkHealth, 7000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const loadMe = async () => {
      try {
        const response = await apiRequest('/auth/me', {}, token);
        const payload = await response.json();
        setUser(payload.user);
      } catch (error) {
        setGlobalError(error);
      }
    };

    void loadMe();
  }, [token]);

  useEffect(() => {
    if (!user && ['studio', 'history', 'admin'].includes(activeView)) {
      setActiveView('auth');
      setNotice('Please login or register to access the workspace.');
    }
  }, [activeView, user]);

  useEffect(() => {
    if (!token) return;
    if (activeView === 'history') {
      void loadHistory();
    }
    if (activeView === 'studio' && featureFocus === 'rag_chat') {
      void loadHistory();
    }
    if (activeView === 'admin' && user?.is_admin) {
      void loadAdmin();
    }
  }, [activeView, featureFocus, token, user?.is_admin]);

  const setView = (view) => {
    startTransition(() => {
      setActiveView(view);
      setMobileMenuOpen(false);
      setGlobalError(null);
    });
  };

  const openFeature = (featureId) => {
    setFeatureFocus(featureId);
    setView('studio');
  };

  const loadHistory = async () => {
    setHistoryBusy(true);
    try {
      const response = await apiRequest('/auth/history', {}, token);
      const payload = await response.json();
      setHistoryData(payload);
      return payload;
    } catch (error) {
      setGlobalError(error);
      return null;
    } finally {
      setHistoryBusy(false);
    }
  };

  const loadAdminDetail = async (userId) => {
    if (!userId) return;
    setAdminDetailBusy(true);
    try {
      const response = await apiRequest(`/admin/users/${userId}`, {}, token);
      const payload = await response.json();
      setSelectedAdminUserDetail(payload);
    } catch (error) {
      setGlobalError(error);
    } finally {
      setAdminDetailBusy(false);
    }
  };

  const loadAdmin = async () => {
    setAdminBusy(true);
    try {
      const [overviewResponse, usersResponse] = await Promise.all([
        apiRequest('/admin/overview', {}, token),
        apiRequest('/admin/users', {}, token),
      ]);

      const overview = await overviewResponse.json();
      const usersPayload = await usersResponse.json();
      const users = usersPayload.users || [];
      setAdminData({ overview, users });

      const preferredUserId =
        users.find((entry) => entry.id === selectedAdminUserId)?.id || users[0]?.id || null;

      setSelectedAdminUserId(preferredUserId);
      if (preferredUserId) {
        await loadAdminDetail(preferredUserId);
      } else {
        setSelectedAdminUserDetail(null);
      }
    } catch (error) {
      setGlobalError(error);
    } finally {
      setAdminBusy(false);
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError(null);

    if (authMode === 'register' && authForm.password.length < 8) {
      setAuthError({
        title: 'Password too short',
        message: 'Password must be at least 8 characters.',
        suggestion: 'Try something like Meetrix123! so registration succeeds.',
      });
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        authMode === 'login'
          ? JSON.stringify({ email: authForm.email, password: authForm.password })
          : JSON.stringify({
              full_name: authForm.full_name,
              email: authForm.email,
              password: authForm.password,
            });

      const response = await apiRequest(endpoint, { method: 'POST', body }, null);
      const payload = await response.json();
      setToken(payload.token);
      setUser(payload.user);
      setAuthForm(authInitialState);
      setNotice(authMode === 'login' ? 'Welcome back. Your saved work is ready.' : 'Account created. New users start as normal users.');
      setView('studio');
    } catch (error) {
      setAuthError(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const performLogout = async () => {
    try {
      if (token) {
        await apiRequest('/auth/logout', { method: 'POST' }, token);
      }
    } catch {
      // Keep local logout reliable even if backend logout fails.
    }

    setLogoutPromptOpen(false);
    setToken('');
    setUser(null);
    setChatSessionId(null);
    setChatMessages([]);
    setHistoryData(emptyHistory);
    setAdminData({ overview: null, users: [] });
    setSelectedAdminUserId(null);
    setSelectedAdminUserDetail(null);
    setNotice('Signed out successfully.');
    setView('home');
  };

  const handleWebBuilderSubmit = async (event) => {
    event.preventDefault();
    setGlobalError(null);
    setWebBuilderBusy(true);
    setWebBuilderLog('');
    setLatestProjectBlob(null);

    try {
      const response = await apiRequest(
        '/build-project',
        {
          method: 'POST',
          body: JSON.stringify(webBuilderForm),
        },
        token,
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finishedLog = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        finishedLog += chunk;
        setWebBuilderLog((current) => current + chunk);
      }

      setNotice('Project build finished. Pull the zip from the latest entry below.');
      await loadHistory();

      if (finishedLog.includes('BUILD SUCCESS')) {
        const historyResponse = await apiRequest('/auth/history', {}, token);
        const latestHistory = await historyResponse.json();
        const latestProject = latestHistory.projects?.[0];
        if (latestProject?.project_slug) {
          const downloadResponse = await apiRequest(`/download/${latestProject.project_slug}`, {}, token);
          const blob = await downloadResponse.blob();
          setLatestProjectBlob({
            blob,
            filename: `${latestProject.project_name}.zip`,
          });
        }
      }
    } catch (error) {
      setGlobalError(error);
    } finally {
      setWebBuilderBusy(false);
    }
  };

  const handleImageSubmit = async (event) => {
    event.preventDefault();
    setGlobalError(null);
    setImageBusy(true);
    try {
      const response = await apiRequest(
        '/image/generate-image',
        {
          method: 'POST',
          body: JSON.stringify({
            ...imageForm,
            width: Number(imageForm.width),
            height: Number(imageForm.height),
          }),
        },
        token,
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageResult({ url, blob, filename: `meetrix-image-${Date.now()}.png` });
      setNotice('Image generated and stored to your history.');
      await loadHistory();
    } catch (error) {
      setGlobalError(error);
    } finally {
      setImageBusy(false);
    }
  };

  const handleVideoSubmit = async (event) => {
    event.preventDefault();
    setGlobalError(null);
    setVideoBusy(true);
    try {
      const response = await apiRequest(
        '/video/generate-video',
        {
          method: 'POST',
          body: JSON.stringify({
            ...videoForm,
            num_frames: Number(videoForm.num_frames),
            num_inference_steps: Number(videoForm.num_inference_steps),
            guidance_scale: Number(videoForm.guidance_scale),
            width: Number(videoForm.width),
            height: Number(videoForm.height),
            fps: Number(videoForm.fps),
          }),
        },
        token,
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoResult({ url, blob, filename: `meetrix-video-${Date.now()}.gif` });
      setNotice('Video generated and saved in your asset history.');
      await loadHistory();
    } catch (error) {
      setGlobalError(error);
    } finally {
      setVideoBusy(false);
    }
  };

  const ensureChatSession = async () => {
    if (chatSessionId) return chatSessionId;
    const response = await apiRequest('/chat/session', { method: 'POST' }, token);
    const payload = await response.json();
    setChatSessionId(payload.session_id);
    setChatMessages([]);
    return payload.session_id;
  };

  const handleChatUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setChatUploadBusy(true);
    setGlobalError(null);

    try {
      const sessionId = await ensureChatSession();
      const formData = new FormData();
      formData.append('file', file);
      await apiRequest(`/chat/upload?session_id=${sessionId}`, { method: 'POST', body: formData }, token);
      setNotice(`${file.name} indexed successfully.`);
      await loadHistory();
    } catch (error) {
      setGlobalError(error);
    } finally {
      setChatUploadBusy(false);
      if (chatFileInputRef.current) {
        chatFileInputRef.current.value = '';
      }
    }
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    if (!chatPrompt.trim()) return;
    setChatBusy(true);
    setGlobalError(null);
    const prompt = chatPrompt.trim();
    setChatPrompt('');
    setChatMessages((current) => [...current, { role: 'user', content: prompt }]);

    try {
      const sessionId = await ensureChatSession();
      const response = await apiRequest(
        '/chat/message',
        {
          method: 'POST',
          body: JSON.stringify({ session_id: sessionId, message: prompt }),
        },
        token,
      );
      const payload = await response.json();
      setChatMessages((current) => [...current, { role: 'assistant', content: payload.answer }]);
      setNotice('Conversation saved to your history.');
      await loadHistory();
    } catch (error) {
      setGlobalError(error);
    } finally {
      setChatBusy(false);
    }
  };

  const startNewChat = () => {
    setChatSessionId(null);
    setChatMessages([]);
    setNotice('New conversation ready.');
  };

  const loadSavedConversation = async (sessionId) => {
    setGlobalError(null);
    try {
      const response = await apiRequest(`/chat/history/${sessionId}`, {}, token);
      const payload = await response.json();
      setChatSessionId(sessionId);
      setChatMessages(payload.messages.map((message) => ({ role: message.role, content: message.content })));
      setFeatureFocus('rag_chat');
      setView('studio');
      setNotice(`Loaded conversation: ${payload.title}`);
    } catch (error) {
      setGlobalError(error);
    }
  };

  const updateManagedUser = async (userId, updates) => {
    setAdminSaveBusy(true);
    setGlobalError(null);
    try {
      const response = await apiRequest(
        `/admin/users/${userId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        },
        token,
      );
      const payload = await response.json();

      setAdminData((current) => ({
        ...current,
        users: current.users.map((entry) => (entry.id === userId ? payload.user : entry)),
      }));

      if (selectedAdminUserDetail?.user?.id === userId) {
        setSelectedAdminUserDetail((current) => ({ ...current, user: payload.user }));
      }

      if (user?.id === userId) {
        setUser((current) => (current ? { ...current, ...payload.user } : current));
      }

      setNotice('User permissions updated successfully.');
      await loadAdmin();
    } catch (error) {
      setGlobalError(error);
    } finally {
      setAdminSaveBusy(false);
    }
  };

  const navigationItems = [
    { id: 'home', label: 'Home' },
    { id: 'studio', label: 'Studio' },
    { id: 'history', label: 'History' },
    ...(user?.is_admin ? [{ id: 'admin', label: 'Admin Panel' }] : []),
  ];

  return (
    <div className="app-shell">
      <BackgroundFX theme={theme} />

      <header className="topbar">
        <motion.button
          type="button"
          className="brand"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setView('home')}
        >
          <span className="brand-mark">M</span>
          <div>
            <strong>Meetrix AI</strong>
            <span>Production workspace for build, media, chat, and admin visibility</span>
          </div>
        </motion.button>

        <nav className={`nav-links ${mobileMenuOpen ? 'is-open' : ''}`}>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? 'nav-active' : ''}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <button type="button" className="theme-toggle" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </button>

          <div className={`status-pill ${backendOnline ? 'online' : 'offline'}`}>
            <span />
            {backendOnline ? 'Backend Online' : 'Backend Offline'}
          </div>

          {user ? (
            <>
              <div className="user-chip">
                <div className="avatar-badge">{userInitials}</div>
                <div>
                  <strong>{user.full_name}</strong>
                  <span>{user.is_admin ? 'Admin access' : 'Standard access'}</span>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setLogoutPromptOpen(true)} aria-label="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button type="button" className="primary-button" onClick={() => setView('auth')}>
              Open Access
            </button>
          )}

          <button type="button" className="menu-button" onClick={() => setMobileMenuOpen((current) => !current)}>
            <Menu size={18} />
          </button>
        </div>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeView === 'home' && (
            <motion.section
              key="home"
              className="page-frame"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <HeroSection user={user} notice={notice} onAuth={() => setView(user ? 'studio' : 'auth')} onStudio={() => setView('studio')} />

              <section className="section-block">
                <div className="section-intro">
                  <span className="eyebrow">Live Features</span>
                  <h2>The four main Meetrix AI features now feel like one connected product</h2>
                  <p>Chat is no longer hidden behind a weak separate page. Each core tool opens inside the main studio workspace.</p>
                </div>
                <div className="feature-grid">
                  {featureTiles.map((tile, index) => (
                    <FeatureCard
                      key={tile.id}
                      tile={tile}
                      index={index}
                      focused={featureFocus === tile.id}
                      onFocus={() => setFeatureFocus(tile.id)}
                      onOpen={() => openFeature(tile.id)}
                    />
                  ))}
                </div>
              </section>

              <section className="experience-grid">
                <div className="panel narrative-card">
                  <span className="eyebrow">Platform Direction</span>
                  <h2>Sharper admin control, clearer user roles, and a frontend that feels launch-ready</h2>
                  <p>
                    Normal users stay normal by default. Admins can manage roles, inspect user activity, and work from a dedicated
                    admin panel without the old first-user shortcut.
                  </p>
                </div>

                <div className="panel checklist-card">
                  <div className="check-row">
                    <Shield size={18} />
                    <span>Manual admin role management</span>
                  </div>
                  <div className="check-row">
                    <Bot size={18} />
                    <span>Chat moved into the main studio feature set</span>
                  </div>
                  <div className="check-row">
                    <SunMedium size={18} />
                    <span>Light and dark themes with persistence</span>
                  </div>
                  <div className="check-row">
                    <LogOut size={18} />
                    <span>Interactive logout confirmation</span>
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="section-header">
                  <div>
                    <span className="eyebrow">Coming Soon</span>
                    <h2>Future modules already staged in the interface</h2>
                  </div>
                </div>
                <div className="upcoming-grid">
                  {upcomingFeatures.map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.title}
                        className="upcoming-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <div className="upcoming-icon">
                          <Icon size={20} />
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <span>Upcoming Feature</span>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            </motion.section>
          )}

          {activeView === 'auth' && (
            <motion.section
              key="auth"
              className="page-frame"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <div className="auth-layout">
                <div className="auth-copy panel">
                  <span className="eyebrow">Secure Access</span>
                  <h2>Login for your workspace. Registering creates a normal user account by default.</h2>
                  <p>
                    Admin access is now manual and controlled from the admin side. That keeps your user system clean and prevents the
                    first signup from automatically becoming an admin.
                  </p>
                  <div className="auth-points">
                    <div>
                      <Lock size={18} />
                      <span>Session-backed authentication</span>
                    </div>
                    <div>
                      <FolderOpen size={18} />
                      <span>User-owned projects, media, and chat history</span>
                    </div>
                    <div>
                      <UserCog size={18} />
                      <span>Manual role-based admin management</span>
                    </div>
                  </div>
                </div>

                <form className="auth-card panel" onSubmit={handleAuthSubmit}>
                  <div className="tab-strip">
                    <button type="button" className={authMode === 'login' ? 'tab-active' : ''} onClick={() => setAuthMode('login')}>
                      Login
                    </button>
                    <button type="button" className={authMode === 'register' ? 'tab-active' : ''} onClick={() => setAuthMode('register')}>
                      Register
                    </button>
                  </div>

                  {authMode === 'register' && (
                    <label>
                      Full Name
                      <input
                        value={authForm.full_name}
                        onChange={(event) => setAuthForm((current) => ({ ...current, full_name: event.target.value }))}
                        placeholder="Meet Patel"
                        required
                      />
                    </label>
                  )}

                  <label>
                    Email
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="meet@gmail.com"
                      required
                    />
                  </label>

                  <label>
                    Password
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="At least 8 characters"
                      required
                    />
                  </label>

                  {authError && <ErrorBanner error={authError} />}
                  {!backendOnline && (
                    <ErrorBanner
                      error={{
                        title: 'Backend offline',
                        message: 'FastAPI is not reachable right now.',
                        suggestion: 'Start backend/run_backend.ps1 and make sure PostgreSQL is running.',
                      }}
                    />
                  )}

                  <button type="submit" className="primary-button wide-button" disabled={authLoading}>
                    {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login to Meetrix AI' : 'Create Account'}
                  </button>
                </form>
              </div>
            </motion.section>
          )}

          {activeView === 'studio' && (
            <motion.section
              key="studio"
              className="page-frame"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <StudioView
                featureFocus={featureFocus}
                setFeatureFocus={setFeatureFocus}
                webBuilderForm={webBuilderForm}
                setWebBuilderForm={setWebBuilderForm}
                webBuilderBusy={webBuilderBusy}
                webBuilderLog={webBuilderLog}
                latestProjectBlob={latestProjectBlob}
                onWebBuilderSubmit={handleWebBuilderSubmit}
                imageForm={imageForm}
                setImageForm={setImageForm}
                imageBusy={imageBusy}
                imageResult={imageResult}
                onImageSubmit={handleImageSubmit}
                videoForm={videoForm}
                setVideoForm={setVideoForm}
                videoBusy={videoBusy}
                videoResult={videoResult}
                onVideoSubmit={handleVideoSubmit}
                historyData={historyData}
                historyBusy={historyBusy}
                chatBusy={chatBusy}
                chatUploadBusy={chatUploadBusy}
                chatPrompt={chatPrompt}
                setChatPrompt={setChatPrompt}
                chatMessages={chatMessages}
                chatFileInputRef={chatFileInputRef}
                onChatUpload={handleChatUpload}
                onChatSubmit={handleChatSubmit}
                onNewChat={startNewChat}
                onOpenConversation={loadSavedConversation}
              />
            </motion.section>
          )}

          {activeView === 'history' && (
            <motion.section
              key="history"
              className="page-frame"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <HistoryView historyData={historyData} loading={historyBusy} onOpenChat={loadSavedConversation} />
            </motion.section>
          )}

          {activeView === 'admin' && user?.is_admin && (
            <motion.section
              key="admin"
              className="page-frame"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <AdminView
                data={adminData}
                loading={adminBusy}
                detail={selectedAdminUserDetail}
                detailLoading={adminDetailBusy}
                selectedUserId={selectedAdminUserId}
                saving={adminSaveBusy}
                onSelectUser={(userId) => {
                  setSelectedAdminUserId(userId);
                  void loadAdminDetail(userId);
                }}
                onToggleAdmin={(entry) => updateManagedUser(entry.id, { is_admin: !entry.is_admin })}
                onToggleActive={(entry) => updateManagedUser(entry.id, { is_active: !entry.is_active })}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {globalError && <ErrorBanner error={globalError} sticky />}
      </main>

      <AnimatePresence>
        {logoutPromptOpen && (
          <ConfirmDialog
            title="Logout from Meetrix AI?"
            description="Your current session will end on this browser. Are you sure you want to logout?"
            confirmLabel="Yes, logout"
            cancelLabel="Cancel"
            onCancel={() => setLogoutPromptOpen(false)}
            onConfirm={performLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BackgroundFX({ theme }) {
  return (
    <div className={`background-fx theme-${theme}`} aria-hidden="true">
      <div className="blob blob-one" />
      <div className="blob blob-two" />
      <div className="blob blob-three" />
      <div className="grid-glow" />
    </div>
  );
}

function HeroSection({ user, notice, onAuth, onStudio }) {
  return (
    <section className="hero-panel panel">
      <div className="hero-copy">
        <motion.span className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Meetrix AI Workspace
        </motion.span>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          Build websites, generate media, chat with files, and manage users from one strong frontend
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          The UI is now shaped around the real product flow: feature-first studio modules, optional admin visibility, cleaner auth,
          theme choice, and a more reliable user journey.
        </motion.p>
        <div className="hero-actions">
          <button type="button" className="primary-button" onClick={user ? onStudio : onAuth}>
            {user ? 'Open Studio' : 'Login / Register'}
            <ArrowRight size={16} />
          </button>
          <button type="button" className="ghost-button" onClick={() => onStudio()}>
            Explore Features
          </button>
        </div>
        <div className="notice-pill">{notice}</div>
      </div>

      <div className="hero-visual">
        <motion.div
          className="command-board"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
        >
          <div className="command-row">
            <div className="command-chip">
              <LayoutDashboard size={16} />
              Web Builder
            </div>
            <div className="command-chip">
              <ImageIcon size={16} />
              Images
            </div>
          </div>
          <div className="metric-stack">
            <div className="metric-card highlight">
              <span>Admin policy</span>
              <strong>Manual roles only</strong>
            </div>
            <div className="metric-card">
              <span>Chat flow</span>
              <strong>Inside feature studio</strong>
            </div>
            <div className="metric-card">
              <span>Theme</span>
              <strong>Light + Dark</strong>
            </div>
          </div>
          <div className="hero-status-row">
            <div className="mini-stage">
              <Bot size={18} />
              <div>
                <strong>Document Chat</strong>
                <span>Saved sessions with uploads</span>
              </div>
            </div>
            <div className="mini-stage">
              <UserCog size={18} />
              <div>
                <strong>Admin Panel</strong>
                <span>User activity visibility</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ tile, index, focused, onFocus, onOpen }) {
  const Icon = tile.icon;
  return (
    <motion.article
      className={`feature-card panel ${focused ? 'feature-card-focused' : ''}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      onMouseEnter={onFocus}
    >
      <div className="feature-meta">
        <div className="feature-icon">
          <Icon size={20} />
        </div>
        <span>{tile.status}</span>
      </div>
      <h3>{tile.label}</h3>
      <strong>{tile.title}</strong>
      <p>{tile.description}</p>
      <button type="button" className="ghost-button" onClick={onOpen}>
        Open Feature
      </button>
    </motion.article>
  );
}

function StudioView(props) {
  const {
    featureFocus,
    setFeatureFocus,
    webBuilderForm,
    setWebBuilderForm,
    webBuilderBusy,
    webBuilderLog,
    latestProjectBlob,
    onWebBuilderSubmit,
    imageForm,
    setImageForm,
    imageBusy,
    imageResult,
    onImageSubmit,
    videoForm,
    setVideoForm,
    videoBusy,
    videoResult,
    onVideoSubmit,
    historyData,
    historyBusy,
    chatBusy,
    chatUploadBusy,
    chatPrompt,
    setChatPrompt,
    chatMessages,
    chatFileInputRef,
    onChatUpload,
    onChatSubmit,
    onNewChat,
    onOpenConversation,
  } = props;

  return (
    <section className="studio-layout">
      <aside className="studio-rail panel">
        <span className="eyebrow">Workspace</span>
        <h2>Choose a live module</h2>
        <p className="rail-copy">All 4 core features live here now, including chat.</p>

        {featureTiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className={featureFocus === tile.id ? 'rail-item active' : 'rail-item'}
            onClick={() => setFeatureFocus(tile.id)}
          >
            <tile.icon size={18} />
            <div>
              <strong>{tile.label}</strong>
              <span>{tile.status}</span>
            </div>
          </button>
        ))}
      </aside>

      <div className="studio-main">
        {featureFocus === 'web_builder' && (
          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Web Builder</span>
                <h2>Generate project builds with live backend streaming</h2>
              </div>
            </div>

            <form className="tool-form" onSubmit={onWebBuilderSubmit}>
              <div className="field-grid three-up">
                <LabeledSelect
                  label="Website Type"
                  value={webBuilderForm.website_type}
                  onChange={(value) => setWebBuilderForm((current) => ({ ...current, website_type: value }))}
                  options={['Hospital', 'E-commerce', 'Portfolio', 'Gym', 'School', 'SaaS']}
                />
                <LabeledSelect
                  label="Styling Framework"
                  value={webBuilderForm.styling_framework}
                  onChange={(value) => setWebBuilderForm((current) => ({ ...current, styling_framework: value }))}
                  options={['CSS', 'Bootstrap', 'Tailwind']}
                />
                <LabeledSelect
                  label="Theme"
                  value={webBuilderForm.theme}
                  onChange={(value) => setWebBuilderForm((current) => ({ ...current, theme: value }))}
                  options={['Modern', 'Minimal', 'Dark', 'Corporate']}
                />
              </div>

              <div className="field-grid three-up">
                <label>
                  Project Name
                  <input
                    value={webBuilderForm.project_name}
                    onChange={(event) => setWebBuilderForm((current) => ({ ...current, project_name: event.target.value }))}
                    placeholder="mediverse-pro"
                    required
                  />
                </label>
                <LabeledSelect
                  label="Frontend Framework"
                  value={webBuilderForm.frontend_framework}
                  onChange={(value) => setWebBuilderForm((current) => ({ ...current, frontend_framework: value }))}
                  options={['HTML', 'React', 'Next.js']}
                />
                <LabeledSelect
                  label="Backend Framework"
                  value={webBuilderForm.backend_framework}
                  onChange={(value) => setWebBuilderForm((current) => ({ ...current, backend_framework: value }))}
                  options={['FastAPI', 'Node.js', 'Django']}
                />
              </div>

              <div className="field-grid three-up">
                <ToggleField
                  label="Authentication"
                  checked={webBuilderForm.authentication}
                  onChange={(value) => setWebBuilderForm((current) => ({ ...current, authentication: value }))}
                />
                <ToggleField
                  label="Payment Integration"
                  checked={webBuilderForm.payment_integration}
                  onChange={(value) => setWebBuilderForm((current) => ({ ...current, payment_integration: value }))}
                />
                <ToggleField
                  label="Admin Panel"
                  checked={webBuilderForm.admin_panel}
                  onChange={(value) => setWebBuilderForm((current) => ({ ...current, admin_panel: value }))}
                />
              </div>

              <label>
                Pages
                <div className="pill-grid">
                  {['Home', 'About', 'Contact', 'Services', 'Blog', 'Login', 'Dashboard'].map((page) => {
                    const selected = webBuilderForm.pages.includes(page);
                    return (
                      <button
                        key={page}
                        type="button"
                        className={selected ? 'pill-chip selected' : 'pill-chip'}
                        onClick={() =>
                          setWebBuilderForm((current) => ({
                            ...current,
                            pages: selected ? current.pages.filter((item) => item !== page) : [...current.pages, page],
                          }))
                        }
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
              </label>

              <button type="submit" className="primary-button wide-button" disabled={webBuilderBusy}>
                {webBuilderBusy ? 'Building...' : 'Generate & Build'}
              </button>
            </form>

            <div className="result-grid">
              <div className="result-panel">
                <h3>Live Build Stream</h3>
                <pre>{webBuilderLog || 'Build logs will appear here...'}</pre>
              </div>
              <div className="result-panel">
                <h3>Download</h3>
                {latestProjectBlob ? (
                  <a
                    className="primary-button wide-button"
                    href={URL.createObjectURL(latestProjectBlob.blob)}
                    download={latestProjectBlob.filename}
                  >
                    Download Latest ZIP
                  </a>
                ) : (
                  <p>After a successful build, the latest generated zip appears here.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {featureFocus === 'image_generation' && (
          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Image Generation</span>
                <h2>Prompt-led asset creation with saved user history</h2>
              </div>
            </div>

            <form className="tool-form" onSubmit={onImageSubmit}>
              <label>
                Prompt
                <textarea
                  value={imageForm.prompt}
                  onChange={(event) => setImageForm((current) => ({ ...current, prompt: event.target.value }))}
                  placeholder="A futuristic hospital dashboard with cinematic glassmorphism and calm sunrise lighting..."
                  rows={5}
                  required
                />
              </label>
              <div className="field-grid three-up">
                <label>
                  Negative Prompt
                  <input
                    value={imageForm.negative_prompt}
                    onChange={(event) => setImageForm((current) => ({ ...current, negative_prompt: event.target.value }))}
                    placeholder="blurry, low quality"
                  />
                </label>
                <LabeledSelect
                  label="Width"
                  value={String(imageForm.width)}
                  onChange={(value) => setImageForm((current) => ({ ...current, width: Number(value) }))}
                  options={['256', '512', '768']}
                />
                <LabeledSelect
                  label="Height"
                  value={String(imageForm.height)}
                  onChange={(value) => setImageForm((current) => ({ ...current, height: Number(value) }))}
                  options={['256', '512', '768']}
                />
              </div>

              <button type="submit" className="primary-button wide-button" disabled={imageBusy}>
                {imageBusy ? 'Generating...' : 'Generate Image'}
              </button>
            </form>

            <div className="asset-preview">
              {imageResult ? (
                <>
                  <img src={imageResult.url} alt="Generated output" />
                  <a className="ghost-button" href={imageResult.url} download={imageResult.filename}>
                    Download Image
                  </a>
                </>
              ) : (
                <p>Your generated image preview will appear here.</p>
              )}
            </div>
          </section>
        )}

        {featureFocus === 'video_generation' && (
          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Video Generation</span>
                <h2>Animated prompt outputs with cinematic controls</h2>
              </div>
            </div>

            <form className="tool-form" onSubmit={onVideoSubmit}>
              <label>
                Prompt
                <textarea
                  value={videoForm.prompt}
                  onChange={(event) => setVideoForm((current) => ({ ...current, prompt: event.target.value }))}
                  placeholder="A glassy drone fly-through over a futuristic hospital campus at dusk..."
                  rows={5}
                  required
                />
              </label>

              <div className="field-grid four-up">
                <label>
                  Negative Prompt
                  <input
                    value={videoForm.negative_prompt}
                    onChange={(event) => setVideoForm((current) => ({ ...current, negative_prompt: event.target.value }))}
                    placeholder="static, blurry"
                  />
                </label>
                <LabeledSelect
                  label="Frames"
                  value={String(videoForm.num_frames)}
                  onChange={(value) => setVideoForm((current) => ({ ...current, num_frames: Number(value) }))}
                  options={['8', '12', '16', '20', '24']}
                />
                <LabeledSelect
                  label="Width"
                  value={String(videoForm.width)}
                  onChange={(value) => setVideoForm((current) => ({ ...current, width: Number(value) }))}
                  options={['256', '320', '512']}
                />
                <LabeledSelect
                  label="Height"
                  value={String(videoForm.height)}
                  onChange={(value) => setVideoForm((current) => ({ ...current, height: Number(value) }))}
                  options={['256', '320', '512']}
                />
              </div>

              <div className="field-grid three-up">
                <label>
                  Inference Steps
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={videoForm.num_inference_steps}
                    onChange={(event) =>
                      setVideoForm((current) => ({ ...current, num_inference_steps: Number(event.target.value) }))
                    }
                  />
                </label>
                <label>
                  Guidance Scale
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="15"
                    value={videoForm.guidance_scale}
                    onChange={(event) =>
                      setVideoForm((current) => ({ ...current, guidance_scale: Number(event.target.value) }))
                    }
                  />
                </label>
                <label>
                  FPS
                  <input
                    type="number"
                    min="4"
                    max="12"
                    value={videoForm.fps}
                    onChange={(event) => setVideoForm((current) => ({ ...current, fps: Number(event.target.value) }))}
                  />
                </label>
              </div>

              <button type="submit" className="primary-button wide-button" disabled={videoBusy}>
                {videoBusy ? 'Generating...' : 'Generate Video'}
              </button>
            </form>

            <div className="asset-preview">
              {videoResult ? (
                <>
                  <img src={videoResult.url} alt="Generated video preview" />
                  <a className="ghost-button" href={videoResult.url} download={videoResult.filename}>
                    Download GIF
                  </a>
                </>
              ) : (
                <p>Your generated GIF preview will appear here.</p>
              )}
            </div>
          </section>
        )}

        {featureFocus === 'rag_chat' && (
          <section className="panel chat-studio">
            <div className="section-header">
              <div>
                <span className="eyebrow">Document Chat</span>
                <h2>Upload files and chat inside the main Meetrix AI feature workspace</h2>
              </div>
              <div className="chat-actions">
                <label className="ghost-button file-button">
                  {chatUploadBusy ? 'Uploading...' : 'Upload Document'}
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.csv,.json,.py,.js,.ts"
                    onChange={onChatUpload}
                    hidden
                  />
                </label>
                <button type="button" className="ghost-button" onClick={onNewChat}>
                  New Chat
                </button>
              </div>
            </div>

            <div className="chat-layout">
              <aside className="chat-history panel inset-panel">
                <div className="mini-header">
                  <strong>Saved Conversations</strong>
                  <span>{historyBusy ? 'Loading...' : `${historyData.chat_sessions?.length || 0} total`}</span>
                </div>

                <div className="chat-history-list">
                  {(historyData.chat_sessions || []).map((session) => (
                    <button key={session.id} type="button" className="chat-history-card" onClick={() => onOpenConversation(session.id)}>
                      <strong>{session.title}</strong>
                      <span>{session.message_count} messages</span>
                      <em>{formatDate(session.updated_at)}</em>
                    </button>
                  ))}
                  {!historyBusy && historyData.chat_sessions?.length === 0 ? <p>No saved chats yet.</p> : null}
                </div>
              </aside>

              <div className="chat-panel panel inset-panel">
                <div className="chat-thread">
                  {chatMessages.length === 0 ? (
                    <div className="empty-chat">
                      <Bot size={28} />
                      <p>Upload a document, then ask a question to start a saved conversation.</p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                        <strong>{message.role === 'user' ? 'You' : 'Meetrix AI'}</strong>
                        <p>{message.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form className="chat-input-row" onSubmit={onChatSubmit}>
                  <input
                    value={chatPrompt}
                    onChange={(event) => setChatPrompt(event.target.value)}
                    placeholder="Ask anything about your uploaded files..."
                  />
                  <button type="submit" className="primary-button" disabled={chatBusy}>
                    {chatBusy ? 'Thinking...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

function HistoryView({ historyData, loading, onOpenChat }) {
  return (
    <section className="history-stack">
      <div className="panel">
        <div className="section-header">
          <div>
            <span className="eyebrow">Saved Work</span>
            <h2>Your projects, media, and conversation history</h2>
          </div>
        </div>
        {loading ? <p>Loading your saved work...</p> : null}
      </div>

      <div className="history-grid">
        <div className="panel">
          <div className="mini-header">
            <strong>Projects</strong>
            <span>{historyData.projects?.length || 0}</span>
          </div>
          {(historyData.projects || []).length === 0 ? <p>No generated projects yet.</p> : null}
          {(historyData.projects || []).map((project) => (
            <div key={project.id} className="history-item">
              <div>
                <strong>{project.project_name}</strong>
                <span>{formatDate(project.created_at)}</span>
              </div>
              <span className="history-tag">{project.project_slug}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="mini-header">
            <strong>Assets</strong>
            <span>{historyData.assets?.length || 0}</span>
          </div>
          {(historyData.assets || []).length === 0 ? <p>No generated assets yet.</p> : null}
          {(historyData.assets || []).map((asset) => (
            <div key={asset.id} className="history-item">
              <div>
                <strong>{asset.asset_type}</strong>
                <span>{asset.prompt}</span>
              </div>
              <span className="history-tag">{new Date(asset.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="mini-header">
            <strong>Conversations</strong>
            <span>{historyData.chat_sessions?.length || 0}</span>
          </div>
          {(historyData.chat_sessions || []).length === 0 ? <p>No chat sessions yet.</p> : null}
          {(historyData.chat_sessions || []).map((session) => (
            <button key={session.id} type="button" className="history-item history-button" onClick={() => onOpenChat(session.id)}>
              <div>
                <strong>{session.title}</strong>
                <span>{session.message_count} messages</span>
              </div>
              <span className="history-tag">Open</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminView({
  data,
  loading,
  detail,
  detailLoading,
  selectedUserId,
  saving,
  onSelectUser,
  onToggleAdmin,
  onToggleActive,
}) {
  const selectedUser = detail?.user;

  return (
    <section className="admin-stack">
      <div className="panel">
        <div className="section-header">
          <div>
            <span className="eyebrow">Admin Control</span>
            <h2>Manual role management and user activity visibility</h2>
          </div>
          <div className="admin-badge">
            <Shield size={18} />
            Admin only
          </div>
        </div>

        {loading || !data.overview ? (
          <p>Loading admin analytics...</p>
        ) : (
          <div className="stats-grid">
            <StatCard label="Total Users" value={data.overview.total_users} />
            <StatCard label="Admin Users" value={data.overview.admin_users} />
            <StatCard label="Projects" value={data.overview.projects_generated} />
            <StatCard label="Assets" value={data.overview.assets_generated} />
            <StatCard label="Chat Sessions" value={data.overview.chat_sessions} />
            <StatCard label="Chat Messages" value={data.overview.chat_messages} />
          </div>
        )}
      </div>

      <div className="admin-layout">
        <div className="panel">
          <div className="mini-header">
            <strong>User Directory</strong>
            <span>{data.users?.length || 0} users</span>
          </div>

          <div className="admin-user-list">
            {(data.users || []).map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={selectedUserId === entry.id ? 'admin-user-card active' : 'admin-user-card'}
                onClick={() => onSelectUser(entry.id)}
              >
                <div>
                  <strong>{entry.full_name}</strong>
                  <span>{entry.email}</span>
                </div>
                <div className="admin-user-meta">
                  <span className={entry.is_admin ? 'badge accent' : 'badge'}>{entry.is_admin ? 'Admin' : 'User'}</span>
                  <span className={entry.is_active ? 'badge success' : 'badge danger'}>{entry.is_active ? 'Active' : 'Disabled'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          {detailLoading || !selectedUser ? (
            <p>Loading user details...</p>
          ) : (
            <>
              <div className="section-header">
                <div>
                  <span className="eyebrow">Selected User</span>
                  <h2>{selectedUser.full_name}</h2>
                </div>
                <div className="admin-actions">
                  <button type="button" className="ghost-button" disabled={saving} onClick={() => onToggleAdmin(selectedUser)}>
                    {selectedUser.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button type="button" className="ghost-button" disabled={saving} onClick={() => onToggleActive(selectedUser)}>
                    {selectedUser.is_active ? 'Disable User' : 'Enable User'}
                  </button>
                </div>
              </div>

              <div className="detail-grid">
                <DetailCard label="Email" value={selectedUser.email} />
                <DetailCard label="Role" value={selectedUser.is_admin ? 'Admin' : 'Normal user'} />
                <DetailCard label="Status" value={selectedUser.is_active ? 'Active' : 'Disabled'} />
                <DetailCard label="Created" value={formatDate(selectedUser.created_at)} />
                <DetailCard label="Last Login" value={formatDate(selectedUser.last_login_at)} />
                <DetailCard label="Projects" value={String(selectedUser.project_count ?? 0)} />
                <DetailCard label="Assets" value={String(selectedUser.asset_count ?? 0)} />
                <DetailCard label="Chat Sessions" value={String(selectedUser.chat_session_count ?? 0)} />
                <DetailCard label="Chat Messages" value={String(selectedUser.chat_message_count ?? 0)} />
              </div>

              <div className="detail-columns">
                <ActivityList
                  title="Projects"
                  emptyText="No projects created yet."
                  items={(detail.projects || []).map((project) => ({
                    id: project.id,
                    title: project.project_name,
                    meta: formatDate(project.created_at),
                  }))}
                />
                <ActivityList
                  title="Assets"
                  emptyText="No assets generated yet."
                  items={(detail.assets || []).map((asset) => ({
                    id: asset.id,
                    title: asset.asset_type,
                    meta: formatDate(asset.created_at),
                  }))}
                />
                <ActivityList
                  title="Chat Sessions"
                  emptyText="No chat sessions yet."
                  items={(detail.chat_sessions || []).map((session) => ({
                    id: session.id,
                    title: session.title,
                    meta: formatDate(session.updated_at),
                  }))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ActivityList({ title, items, emptyText }) {
  return (
    <div className="activity-card">
      <div className="mini-header">
        <strong>{title}</strong>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? <p>{emptyText}</p> : null}
      {items.map((item) => (
        <div key={item.id} className="activity-item">
          <strong>{item.title}</strong>
          <span>{item.meta}</span>
        </div>
      ))}
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="detail-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LabeledSelect({ label, value, onChange, options }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <button type="button" className={checked ? 'toggle-card active' : 'toggle-card'} onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <strong>{checked ? 'Enabled' : 'Disabled'}</strong>
    </button>
  );
}

function ConfirmDialog({ title, description, confirmLabel, cancelLabel, onCancel, onConfirm }) {
  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal-card panel" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}>
        <button type="button" className="modal-close" onClick={onCancel} aria-label="Close">
          <X size={18} />
        </button>
        <span className="eyebrow">Confirm Action</span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="primary-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ErrorBanner({ error, sticky = false }) {
  return (
    <div className={sticky ? 'error-banner sticky' : 'error-banner'}>
      <strong>{error.title || 'Error'}</strong>
      <p>{error.message}</p>
      {error.suggestion ? <span>Suggestion: {error.suggestion}</span> : null}
    </div>
  );
}

export default App;
