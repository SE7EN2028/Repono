import { useState } from 'react';
import * as I from './Icons';
import { NAV, RECENT_THREADS } from '../data/mockData';

function StatusDot({ status, progress }) {
  if (status === "processing") {
    return (
      <div className="status-chip processing">
        <span className="pulse-dot"/>
        <span className="mono">{progress ?? 0}%</span>
      </div>
    );
  }
  return (
    <div className="status-chip indexed">
      <span className="static-dot"/>
      <span>Indexed</span>
    </div>
  );
}

export default function Sidebar({ collapsed, setCollapsed, view, setView, repo, repos, setRepoId, onAddRepo, onRemoveRepo }) {
  const [repoOpen, setRepoOpen] = useState(false);
  return (
    <aside className={"sidebar" + (collapsed ? " collapsed" : "")}>
      <div className="sidebar-top">
        <div className="brand" onClick={() => setCollapsed(!collapsed)}>
          <div className="brand-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="bg-r" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="var(--accent-2)" />
                  <stop offset="1" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#bg-r)" opacity="0.18"/>
              <path d="M7 17V7h5.5a3.5 3.5 0 0 1 1.2 6.8L17 17h-3l-3-4.5H10V17H7zm3-6.3h2.3a1.3 1.3 0 0 0 0-2.6H10v2.6z"
                    fill="url(#bg-r)"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="brand-text">
              <div className="brand-name">Repono</div>
              <div className="brand-sub mono">codebase intelligence</div>
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="repo-picker-wrap">
          <button
            className={"repo-picker" + (repoOpen ? " open" : "")}
            onClick={() => setRepoOpen(!repoOpen)}
          >
            <I.GitBranch size={14}/>
            <div className="repo-info">
              <div className="repo-name mono">{repo.name}</div>
              <div className="repo-meta">
                <span className="branch mono">{repo.branch}</span>
                <span className="dot-sep">·</span>
                <span>{repo.lang}</span>
              </div>
            </div>
            <I.Chevron size={14} style={{ transition: "transform 180ms", transform: repoOpen ? "rotate(180deg)" : "none" }}/>
          </button>
          {repoOpen && (
            <div className="repo-menu">
              {(repos || []).map(r => (
                <button
                  key={r.id}
                  className={"repo-item" + (r.id === repo.id ? " active" : "")}
                  onClick={() => { setRepoId(r.id); setRepoOpen(false); }}
                >
                  <div className="repo-item-left">
                    <div className="repo-name mono">{r.name}</div>
                    <div className="repo-meta mono">{r.branch} · {r.files.toLocaleString()} files</div>
                  </div>
                  <span
                    className="repo-remove"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemoveRepo && onRemoveRepo(r.id); }}
                  >
                    Remove
                  </span>
                </button>
              ))}
              <div className="repo-menu-foot">
                <button className="ghost-btn" onClick={() => onAddRepo && onAddRepo()}><I.Plus size={13}/> Add repository</button>
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="nav">
        {NAV.map(item => {
          const Ico = I[item.icon];
          const active = view === item.id;
          return (
            <button
              key={item.id}
              className={"nav-item" + (active ? " active" : "")}
              onClick={() => setView(item.id)}
              title={collapsed ? item.label : ""}
            >
              <span className="nav-icon"><Ico size={16}/></span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {!collapsed && item.count != null && (
                <span className="nav-count mono">{item.count}</span>
              )}
              {active && <span className="nav-bar"/>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="threads">
          <div className="threads-head">
            <span>Recent threads</span>
            <button className="icon-btn small"><I.Plus size={12}/></button>
          </div>
          <div className="threads-list">
            {RECENT_THREADS.map(t => (
              <button key={t.id} className={"thread" + (t.active ? " active" : "")}>
                <div className="thread-title">{t.title}</div>
                <div className="thread-meta mono">{t.when}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-foot">
        {!collapsed && (
          <div className="usage">
            <div className="usage-row">
              <span className="usage-label">Context used</span>
              <span className="usage-val mono">41%</span>
            </div>
            <div className="usage-bar"><div style={{ width: "41%" }}/></div>
          </div>
        )}
        <button className="icon-btn" onClick={() => setCollapsed(!collapsed)} title="Collapse sidebar">
          <I.Collapse size={15}/>
          {!collapsed && <span style={{marginLeft:8, fontSize:12}}>Collapse</span>}
        </button>
      </div>

      <style>{`
        .sidebar {
          grid-area: side;
          display:flex; flex-direction:column;
          border-right: 1px solid var(--border);
          background: linear-gradient(180deg, #0C1219 0%, #0B0F14 100%);
          width: var(--sidebar-w);
          min-width: var(--sidebar-w);
          transition: width 220ms ease, min-width 220ms ease;
          position: relative;
          overflow: hidden;
        }
        .sidebar.collapsed { width: var(--sidebar-w-collapsed); min-width: var(--sidebar-w-collapsed); }
        .sidebar-top { padding: 14px 14px 8px; }
        .brand {
          display:flex; align-items:center; gap:10px;
          cursor: pointer; user-select:none;
          padding: 4px; border-radius: 10px;
        }
        .brand-mark {
          width: 30px; height: 30px;
          display:flex; align-items:center; justify-content:center;
          border-radius: 8px;
          background: radial-gradient(circle at 30% 20%, rgba(79,140,255,0.25), rgba(79,140,255,0.05) 70%);
          border: 1px solid rgba(79,140,255,0.25);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 20px rgba(79,140,255,0.15);
          flex-shrink: 0;
        }
        .brand-text { line-height: 1.1; }
        .brand-name { font-weight: 600; font-size: 15px; letter-spacing: -0.01em; }
        .brand-sub { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.12em; margin-top: 2px; }
        .repo-picker-wrap { padding: 4px 10px; position: relative; }
        .repo-picker {
          width: 100%;
          display: grid;
          grid-template-columns: 14px 1fr 14px;
          gap: 10px;
          align-items: center;
          padding: 9px 11px;
          background: #0F151D;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          cursor: pointer;
          text-align: left;
          transition: all 160ms ease;
        }
        .repo-picker:hover { border-color: var(--border-2); background: #121923; }
        .repo-picker.open { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .repo-info { min-width: 0; }
        .repo-name { font-size: 12.5px; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
        .repo-meta { font-size: 10.5px; color: var(--text-muted); display:flex; align-items:center; gap:6px; margin-top: 2px; }
        .repo-meta .branch { color: var(--accent-2); }
        .dot-sep { color: var(--text-dim); }
        .repo-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 10px; right: 10px;
          background: #0F151D;
          border: 1px solid var(--border-2);
          border-radius: 12px;
          padding: 6px;
          z-index: 40;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02);
          animation: menu-pop 160ms ease;
        }
        .repo-item {
          width: 100%;
          display:flex; align-items:center; justify-content:space-between;
          gap: 8px; padding: 8px 10px;
          background: transparent;
          border: 0; border-radius: 8px;
          color: var(--text); cursor: pointer;
          text-align: left;
          transition: background 140ms ease;
        }
        .repo-item:hover { background: #141C27; }
        .repo-item.active { background: linear-gradient(90deg, var(--accent-soft), transparent); }
        .repo-remove {
          display: flex; align-items:center; justify-content:center;
          padding: 3px 8px;
          background: rgba(240,110,110,0.08);
          border: 1px solid rgba(240,110,110,0.2);
          color: var(--danger); cursor: pointer;
          border-radius: 6px;
          font-size: 10px;
          white-space: nowrap;
          transition: all 140ms ease;
        }
        .repo-remove:hover { background: rgba(240,110,110,0.2); border-color: rgba(240,110,110,0.4); }
        .repo-menu-foot { border-top: 1px solid var(--border); margin-top: 4px; padding-top: 4px; }
        .ghost-btn {
          width: 100%;
          display:flex; align-items:center; gap:8px;
          padding: 8px 10px; background: transparent; border: 0; border-radius: 8px;
          color: var(--text-muted); cursor: pointer; font-size: 12.5px;
        }
        .ghost-btn:hover { color: var(--text); background: #141C27; }
        .nav { padding: 14px 10px 4px; display: flex; flex-direction: column; gap: 2px; }
        .nav-item {
          position: relative;
          display: grid;
          grid-template-columns: 22px 1fr auto;
          gap: 10px; align-items: center;
          padding: 8px 10px;
          background: transparent; border: 0;
          color: var(--text-muted); cursor: pointer;
          border-radius: 8px;
          font-size: 13px; font-weight: 450;
          transition: all 140ms ease;
          text-align: left;
        }
        .sidebar.collapsed .nav-item { grid-template-columns: 1fr; justify-items: center; padding: 10px; }
        .nav-item:hover { color: var(--text); background: #111823; }
        .nav-item.active { color: var(--text); background: linear-gradient(90deg, var(--accent-soft), transparent 80%); }
        .nav-item.active .nav-icon { color: var(--accent-2); }
        .nav-bar {
          position: absolute; left: 0; top: 8px; bottom: 8px;
          width: 2px; background: var(--accent);
          border-radius: 2px;
          box-shadow: 0 0 8px var(--accent-glow);
        }
        .nav-icon { display:flex; align-items:center; }
        .nav-count {
          font-size: 10.5px; color: var(--text-dim);
          background: #131B26; padding: 1px 6px; border-radius: 99px;
          border: 1px solid var(--border);
        }
        .threads { padding: 14px 14px 6px; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
        .threads-head {
          display:flex; align-items:center; justify-content:space-between;
          color: var(--text-dim); font-size: 10.5px; letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 8px;
        }
        .threads-list { overflow: auto; flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .thread {
          padding: 7px 8px; background: transparent; border: 0; border-radius: 8px;
          color: var(--text-muted); cursor: pointer; text-align:left;
          transition: all 140ms ease;
        }
        .thread:hover { background: #111823; color: var(--text); }
        .thread.active { background: #121B27; color: var(--text); }
        .thread-title { font-size: 12.5px; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
        .thread-meta { font-size: 10px; color: var(--text-dim); margin-top: 3px; }
        .sidebar-foot {
          border-top: 1px solid var(--border);
          padding: 10px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .usage-row { display:flex; justify-content:space-between; font-size: 11px; color: var(--text-muted); }
        .usage-val { color: var(--text); }
        .usage-bar { height: 3px; background: #131B26; border-radius: 99px; overflow: hidden; margin-top: 6px; }
        .usage-bar > div {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          box-shadow: 0 0 8px var(--accent-glow);
        }
        .status-chip.processing {
          display:flex; align-items:center; gap:5px;
          font-size: 10px; color: var(--warn);
          background: rgba(245,181,68,0.08);
          border: 1px solid rgba(245,181,68,0.2);
          padding: 2px 6px; border-radius: 99px;
        }
        .pulse-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--warn);
          animation: pulse 1.6s infinite;
        }
        .status-chip.indexed {
          display:flex; align-items:center; gap:5px;
          font-size: 10px; color: var(--success);
          background: rgba(59,214,140,0.08);
          border: 1px solid rgba(59,214,140,0.2);
          padding: 2px 6px; border-radius: 99px;
        }
        .static-dot { width:6px; height:6px; border-radius:50%; background: var(--success); box-shadow: 0 0 6px rgba(59,214,140,0.6); }
      `}</style>
    </aside>
  );
}
