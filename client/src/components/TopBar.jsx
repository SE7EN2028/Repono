import * as I from './Icons';
import ProfileDropdown from './ProfileDropdown';

function IndexStatus({ status, progress, files }) {
  if (status === "processing") {
    return (
      <div className="idx idx-proc">
        <span className="idx-spinner"/>
        <span>Processing · {progress}%</span>
      </div>
    );
  }
  if (!files) return null;
  return (
    <div className="idx idx-ok">
      <span className="idx-dot"/>
      <span>{status === 'indexed' ? 'Indexed' : 'Parsed'}</span>
      <span className="idx-sep">·</span>
      <span className="mono">{files.toLocaleString()} files</span>
    </div>
  );
}

export default function TopBar({ repo, onOpenSearch, onOpenSettings, profile, setProfile }) {
  return (
    <header className="topbar">
      <div className="tb-left">
        <div className="crumb">
          <I.GitBranch size={13}/>
          <span className="mono">{repo.name}</span>
          <span className="crumb-sep">/</span>
          <span className="mono crumb-branch">{repo.branch}</span>
        </div>
        <IndexStatus status={repo.status} progress={repo.progress} files={repo.files}/>
      </div>

      <button className="search" onClick={onOpenSearch}>
        <I.Search size={14}/>
        <span>Search code, symbols, or ask a question…</span>
        <kbd className="mono">⌘K</kbd>
      </button>

      <div className="tb-right">
        <button className="icon-btn" onClick={onOpenSettings} title="Settings">
          <I.Settings size={15}/>
        </button>
        <ProfileDropdown profile={profile} setProfile={setProfile}/>
      </div>

      <style>{`
        .topbar {
          grid-area: top;
          display: grid;
          grid-template-columns: auto minmax(280px, 520px) auto;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 0 16px;
          height: var(--top-h);
          border-bottom: 1px solid var(--border);
          background: rgba(11, 15, 20, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 5;
        }
        .tb-left { display:flex; align-items:center; gap: 14px; min-width: max-content; flex-shrink: 0; }
        .tb-right { display:flex; align-items:center; gap: 10px; justify-content: flex-end; flex-shrink: 0; }
        .crumb {
          display:flex; align-items:center; gap: 8px;
          font-size: 13px; color: var(--text);
          white-space: nowrap; flex-shrink: 0;
        }
        .crumb-sep { color: var(--text-dim); }
        .crumb-branch { color: var(--accent-2); font-size: 12px; }
        .search {
          display:flex; align-items:center; gap: 10px;
          padding: 8px 12px;
          background: #0E141B;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 12.5px;
          transition: all 180ms ease;
          width: 100%;
        }
        .search span { flex: 1; text-align: left; }
        .search:hover { border-color: var(--border-2); background: #111823; color: var(--text); }
        .search kbd {
          font-size: 10.5px; color: var(--text-dim);
          border: 1px solid var(--border);
          padding: 1px 5px; border-radius: 4px;
          background: #0B0F14;
        }
        .idx { display:flex; align-items:center; gap:6px; font-size: 11.5px; padding: 4px 10px; border-radius: 99px; border: 1px solid; white-space: nowrap; flex-shrink: 0; }
        .idx-proc { color: var(--warn); border-color: rgba(245,181,68,0.25); background: rgba(245,181,68,0.06); }
        .idx-spinner { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid rgba(245,181,68,0.3); border-top-color: var(--warn); animation: spin 900ms linear infinite; }
        .idx-ok { color: var(--success); border-color: rgba(59,214,140,0.22); background: rgba(59,214,140,0.06); }
        .idx-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); box-shadow: 0 0 8px rgba(59,214,140,0.6); }
        .idx-sep { color: var(--text-dim); }
      `}</style>
    </header>
  );
}
