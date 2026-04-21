import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ChatView from './components/ChatView';
import ContextViewer from './components/ContextViewer';
import CodeMap from './components/CodeMap';
import FilesView from './components/FilesView';
import InsightsView from './components/InsightsView';
import TweaksPanel from './components/TweaksPanel';
import ConnectModal from './components/ConnectModal';
import SearchModal from './components/SearchModal';
import ConfirmDialog from './components/ConfirmDialog';
import SettingsPanel from './components/SettingsPanel';
import { askQuestion, listRepos, removeRepo } from './api';

const DEFAULT_TWEAKS = {
  accent: "#4F8CFF",
  density: "comfortable",
  sidebarCollapsed: false,
  showAmbientGlow: true,
};

export default function App() {
  const [tweaks, setTweaks] = useState(DEFAULT_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [view, setView] = useState("chat");
  const [repoId, setRepoId] = useState(null);
  const [repos, setRepos] = useState([]);
  const [threadsByRepo, setThreadsByRepo] = useState({});
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [lastSources, setLastSources] = useState([]);

  const repoThreads = (threadsByRepo[repoId] || []);
  const activeThread = repoThreads.find(t => t.id === activeThreadId);
  const messages = activeThread ? activeThread.messages : [];

  const setMessages = (updater) => {
    setThreadsByRepo(prev => {
      const threads = prev[repoId] || [];
      return {
        ...prev,
        [repoId]: threads.map(t =>
          t.id === activeThreadId
            ? { ...t, messages: typeof updater === 'function' ? updater(t.messages) : updater }
            : t
        ),
      };
    });
  };

  const createThread = (firstMessage) => {
    const id = 't' + Date.now();
    const title = firstMessage.length > 40 ? firstMessage.slice(0, 40) + '...' : firstMessage;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const thread = { id, title, time, messages: [] };
    setThreadsByRepo(prev => ({
      ...prev,
      [repoId]: [thread, ...(prev[repoId] || [])],
    }));
    setActiveThreadId(id);
    return id;
  };

  const handleNewThread = () => {
    const id = createThread('New conversation');
    setView('chat');
  };

  const handleSwitchThread = (threadId) => {
    setActiveThreadId(threadId);
    setLastSources([]);
    setView('chat');
  };
  const [showConnect, setShowConnect] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ model: 'llama-3.3-70b-versatile', maxResults: 8, accent: '#4F8CFF' });
  const [profile, setProfile] = useState({ name: 'User', role: 'Developer', queries: 0, repos: 0 });
  const GROQ_DAILY_LIMIT = 14400;
  const GROQ_MINUTE_LIMIT = 30;
  const [groqUsage, setGroqUsage] = useState({ daily: 0, minute: 0, lastReset: Date.now() });

  useEffect(() => {
    const interval = setInterval(() => {
      setGroqUsage(prev => ({ ...prev, minute: 0 }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setProfile(p => ({ ...p, repos: repos.length }));
  }, [repos]);

  useEffect(() => {
    listRepos().then(savedRepos => {
      if (savedRepos && savedRepos.length > 0) {
        const seen = new Set();
        const mapped = [];
        for (const r of savedRepos) {
          if (seen.has(r.repoId)) continue;
          seen.add(r.repoId);
          mapped.push({
            id: r.repoId,
            name: r.owner + '/' + r.name,
            branch: 'main',
            lang: 'Mixed',
            files: r.fileCount || 0,
            status: r.embedded ? 'indexed' : 'parsed',
          });
        }
        setRepos(mapped);
        setRepoId(mapped[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLastSources([]);
    const threads = threadsByRepo[repoId] || [];
    if (threads.length > 0) setActiveThreadId(threads[0].id);
    else setActiveThreadId(null);
  }, [repoId]);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const accentColor = settings.accent || tweaks.accent;
    root.style.setProperty("--accent", accentColor);
    const hex = accentColor.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    root.style.setProperty("--accent-2", `rgb(${Math.min(255, r + 32)}, ${Math.min(255, g + 32)}, ${Math.min(255, b + 32)})`);
    root.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.14)`);
    root.style.setProperty("--accent-glow", `rgba(${r}, ${g}, ${b}, 0.35)`);
    document.body.style.setProperty("--top-h", tweaks.density === "compact" ? "46px" : "52px");
    document.documentElement.style.fontSize = (settings.fontSize || '14') + 'px';
  }, [tweaks, settings.accent, settings.fontSize]);

  useEffect(() => {
    if (tweaks.showAmbientGlow) document.body.style.setProperty("--ambient-opacity", "1");
    else document.body.style.setProperty("--ambient-opacity", "0");
    const style = document.createElement("style");
    style.textContent = "body::before { opacity: var(--ambient-opacity, 1); }";
    document.head.appendChild(style);
    return () => style.remove();
  }, [tweaks.showAmbientGlow]);

  const setTweak = (key, value) => {
    setTweaks(prev => ({ ...prev, [key]: value }));
  };

  const repo = repos.find(r => r.id === repoId) || repos[0] || { id: null, name: 'No repo', branch: '-', lang: '-', files: 0, status: 'none' };

  const handleSend = async (text) => {
    let threadId = activeThreadId;

    if (!threadId || !repoThreads.find(t => t.id === threadId)) {
      threadId = 't' + Date.now();
      const title = text.length > 40 ? text.slice(0, 40) + '...' : text;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setThreadsByRepo(prev => ({
        ...prev,
        [repoId]: [{ id: threadId, title, time, messages: [] }, ...(prev[repoId] || [])],
      }));
      setActiveThreadId(threadId);
    } else {
      setThreadsByRepo(prev => ({
        ...prev,
        [repoId]: (prev[repoId] || []).map(t =>
          t.id === threadId && t.title === 'New conversation'
            ? { ...t, title: text.length > 40 ? text.slice(0, 40) + '...' : text }
            : t
        ),
      }));
    }

    const addMsg = (msg) => {
      setThreadsByRepo(prev => ({
        ...prev,
        [repoId]: (prev[repoId] || []).map(t =>
          t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t
        ),
      }));
    };

    const updateLastMsg = (updater) => {
      setThreadsByRepo(prev => ({
        ...prev,
        [repoId]: (prev[repoId] || []).map(t => {
          if (t.id !== threadId) return t;
          const msgs = [...t.messages];
          msgs[msgs.length - 1] = updater(msgs[msgs.length - 1]);
          return { ...t, messages: msgs };
        }),
      }));
    };

    const userMsg = {
      id: "u" + Date.now(),
      role: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const aid = "a" + Date.now();
    addMsg(userMsg);
    setStreaming(true);

    if (!repoId) {
      addMsg({
        id: aid,
        role: "assistant",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        blocks: [
          { type: "callout", kind: "warn", text: "No repository connected yet. Click **Add repository** in the sidebar to connect a GitHub repo first." }
        ],
      });
      setStreaming(false);
      return;
    }

    try {
      setProfile(p => ({ ...p, queries: (p.queries || 0) + 1 }));
      setGroqUsage(prev => ({ ...prev, daily: prev.daily + 1, minute: prev.minute + 1 }));
      const result = await askQuestion(repoId, text, settings);

      if (result.sources && result.sources.length > 0) {
        setLastSources(result.sources);
      }

      addMsg({
        id: aid,
        role: "assistant",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        blocks: [{ type: "text", text: "" }],
        streaming: true,
      });

      const fullText = result.answer;
      const words = fullText.split(/(\s+)/);
      let shown = '';

      for (let i = 0; i < words.length; i += 3) {
        shown += words.slice(i, i + 3).join('');
        const partial = shown;
        updateLastMsg(m => ({ ...m, blocks: [{ type: "text", text: partial }] }));
        await new Promise(r => setTimeout(r, 20));
      }

      const finalBlocks = [{ type: "text", text: fullText }];

      if (result.sources && result.sources.length > 0) {
        finalBlocks.push({
          type: "refs",
          items: result.sources.slice(0, 4).map(s => ({
            file: s.filePath,
            lines: `${s.startLine}-${s.endLine}`,
            why: s.name,
          })),
        });
      }

      updateLastMsg(m => ({ ...m, blocks: finalBlocks, streaming: false }));
    } catch (err) {
      addMsg({
        id: aid,
        role: "assistant",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        blocks: [
          { type: "callout", kind: "warn", text: `Error: ${err.message}` }
        ],
      });
    }

    setStreaming(false);
  };

  const handleRepoConnected = (result) => {
    setShowConnect(false);
    const newRepo = {
      id: result.repoId,
      name: result.owner + '/' + result.name,
      branch: 'main',
      lang: 'Mixed',
      files: result.fileCount,
      status: result.embedded ? 'indexed' : 'parsed',
    };
    setRepos(prev => [...prev.filter(r => r.id !== result.repoId), newRepo]);
    setRepoId(result.repoId);
    setView('chat');
  };

  const handleRemoveRepo = (id) => {
    setRemoveTarget(id);
  };

  const confirmRemove = async () => {
    const id = removeTarget;
    setRemoveTarget(null);
    try {
      await removeRepo(id);
      setRepos(prev => prev.filter(r => r.id !== id));
      if (repoId === id) {
        const remaining = repos.filter(r => r.id !== id);
        setRepoId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.log('Remove failed:', err.message);
    }
  };

  const openRef = () => {};

  return (
    <div className={"shell view-" + view}>
      <Sidebar
        collapsed={tweaks.sidebarCollapsed}
        setCollapsed={(v) => setTweak("sidebarCollapsed", v)}
        view={view}
        setView={setView}
        repo={repo}
        repos={repos}
        setRepoId={setRepoId}
        onAddRepo={() => setShowConnect(true)}
        onRemoveRepo={handleRemoveRepo}
        threads={repoThreads}
        activeThread={activeThreadId}
        onSwitchThread={handleSwitchThread}
        onNewThread={handleNewThread}
        usage={{
          queries: groqUsage.daily,
          limit: GROQ_DAILY_LIMIT,
          percent: Math.min(100, Math.round((groqUsage.daily / GROQ_DAILY_LIMIT) * 100)),
          resetLabel: `${GROQ_MINUTE_LIMIT - groqUsage.minute} req/min left`,
        }}
      />
      <TopBar repo={repo} onOpenSearch={() => setShowSearch(true)} onOpenSettings={() => setShowSettings(true)} profile={profile} setProfile={setProfile}/>

      {view === "chat" && (
        <>
          <ChatView messages={messages} onSend={handleSend} streaming={streaming} onOpenRef={openRef} repoConnected={!!repoId}/>
          <ContextViewer sources={lastSources} repoId={repoId}/>
        </>
      )}
      {view === "map" && <CodeMap repoId={repoId}/>}
      {view === "files" && <FilesView repoId={repoId}/>}
      {view === "insights" && <InsightsView repoId={repoId} repoName={repo?.name}/>}

      <TweaksPanel tweaks={tweaks} setTweak={setTweak} open={tweaksOpen} setOpen={setTweaksOpen}/>

      {showConnect && (
        <ConnectModal
          onClose={() => setShowConnect(false)}
          onConnected={handleRepoConnected}
        />
      )}

      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onAsk={(q) => { setView('chat'); handleSend(q); }}
          onNavigate={setView}
        />
      )}

      {showSettings && (
        <SettingsPanel settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)}/>
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Remove Repository"
          message={`This will delete all indexed data for "${(repos.find(r => r.id === removeTarget) || {}).name || removeTarget}". This action cannot be undone.`}
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      <style>{`
        .shell {
          display: grid;
          grid-template-areas:
            "side top  top"
            "side main ctx";
          grid-template-columns: auto 1fr auto;
          grid-template-rows: var(--top-h) 1fr;
          height: 100vh;
          width: 100vw;
        }
        .shell.view-map .codemap,
        .shell.view-files .files,
        .shell.view-insights .insights {
          grid-column: 2 / -1;
          grid-row: 2;
        }
      `}</style>
    </div>
  );
}
