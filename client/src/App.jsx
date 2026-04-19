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
import { askQuestion, listRepos } from './api';

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
  const [chatsByRepo, setChatsByRepo] = useState({});
  const [streaming, setStreaming] = useState(false);
  const [lastSources, setLastSources] = useState([]);

  const messages = chatsByRepo[repoId] || [];
  const setMessages = (updater) => {
    setChatsByRepo(prev => {
      const current = prev[repoId] || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [repoId]: next };
    });
  };
  const [showConnect, setShowConnect] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    listRepos().then(savedRepos => {
      if (savedRepos && savedRepos.length > 0) {
        const mapped = savedRepos.map(r => ({
          id: r.repoId,
          name: r.owner + '/' + r.name,
          branch: 'main',
          lang: 'Mixed',
          files: r.fileCount || 0,
          status: r.embedded ? 'indexed' : 'parsed',
        }));
        setRepos(mapped);
        setRepoId(mapped[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLastSources([]);
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
    root.style.setProperty("--accent", tweaks.accent);
    const hex = tweaks.accent.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    root.style.setProperty("--accent-2", `rgb(${Math.min(255, r + 32)}, ${Math.min(255, g + 32)}, ${Math.min(255, b + 32)})`);
    root.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.14)`);
    root.style.setProperty("--accent-glow", `rgba(${r}, ${g}, ${b}, 0.35)`);
    document.body.style.setProperty("--top-h", tweaks.density === "compact" ? "46px" : "52px");
  }, [tweaks]);

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
    const userMsg = {
      id: "u" + Date.now(),
      role: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const aid = "a" + Date.now();
    setMessages(m => [...m, userMsg]);
    setStreaming(true);

    if (!repoId) {
      setMessages(m => [...m, {
        id: aid,
        role: "assistant",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        blocks: [
          { type: "callout", kind: "warn", text: "No repository connected yet. Click **Add repository** in the sidebar to connect a GitHub repo first." }
        ],
      }]);
      setStreaming(false);
      return;
    }

    try {
      const result = await askQuestion(repoId, text);

      if (result.sources && result.sources.length > 0) {
        setLastSources(result.sources);
      }

      const blocks = [
        { type: "text", text: result.answer },
      ];

      if (result.sources && result.sources.length > 0) {
        blocks.push({
          type: "refs",
          items: result.sources.map(s => ({
            file: s.filePath,
            lines: `${s.startLine}-${s.endLine}`,
            why: s.name,
          })),
        });
      }

      blocks.push({
        type: "callout",
        kind: "info",
        text: `Query type: **${result.queryType}** · Confidence: **${Math.round((result.confidence || 0) * 100)}%**`,
      });

      setMessages(m => [...m, {
        id: aid,
        role: "assistant",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        blocks,
      }]);
    } catch (err) {
      setMessages(m => [...m, {
        id: aid,
        role: "assistant",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        blocks: [
          { type: "callout", kind: "warn", text: `Error: ${err.message}` }
        ],
      }]);
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
      />
      <TopBar repo={repo} onOpenSearch={() => setShowSearch(true)}/>

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
