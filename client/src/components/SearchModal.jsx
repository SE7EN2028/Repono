import { useState, useRef, useEffect } from 'react';
import * as I from './Icons';

export default function SearchModal({ onClose, onAsk, onNavigate }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const quickActions = [
    { label: 'Ask a question', icon: 'Sparkle', action: () => { onAsk(query); onClose(); } },
    { label: 'Go to Chat', icon: 'Chat', action: () => { onNavigate('chat'); onClose(); } },
    { label: 'Open Code Map', icon: 'Map', action: () => { onNavigate('map'); onClose(); } },
    { label: 'Browse Files', icon: 'Files', action: () => { onNavigate('files'); onClose(); } },
    { label: 'View Insights', icon: 'Insights', action: () => { onNavigate('insights'); onClose(); } },
  ];

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrap">
          <I.Search size={16}/>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search code, symbols, or ask a question..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && query.trim()) {
                onAsk(query.trim());
                onClose();
              }
            }}
          />
          <kbd className="mono">ESC</kbd>
        </div>

        <div className="search-actions">
          {quickActions.map((a, i) => {
            const Ico = I[a.icon];
            return (
              <button key={i} className="search-action" onClick={a.action}>
                <Ico size={14}/>
                <span>{a.label}</span>
                {i === 0 && query.trim() && <span className="search-hint mono">↵</span>}
              </button>
            );
          })}
        </div>

        <style>{`
          .search-overlay {
            position: fixed; inset: 0; z-index: 100;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex; align-items: flex-start; justify-content: center;
            padding-top: 120px;
            animation: menu-pop 120ms ease;
          }
          .search-modal {
            width: 560px;
            background: linear-gradient(180deg, #0E141B 0%, #0B1118 100%);
            border: 1px solid var(--border-2);
            border-radius: 14px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
            overflow: hidden;
          }
          .search-input-wrap {
            display: flex; align-items: center; gap: 12px;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
          }
          .search-input-wrap svg { color: var(--text-dim); flex-shrink: 0; }
          .search-input {
            flex: 1;
            background: transparent; border: 0; outline: none;
            color: var(--text); font-family: inherit; font-size: 15px;
          }
          .search-input::placeholder { color: var(--text-dim); }
          .search-input-wrap kbd {
            font-size: 10px; color: var(--text-dim);
            border: 1px solid var(--border); padding: 2px 6px; border-radius: 4px;
          }
          .search-actions { padding: 6px; }
          .search-action {
            width: 100%;
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px;
            background: transparent; border: 0;
            color: var(--text-muted);
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            transition: all 140ms ease;
            text-align: left;
          }
          .search-action:hover { background: #111823; color: var(--text); }
          .search-action svg { color: var(--accent-2); }
          .search-hint {
            margin-left: auto;
            font-size: 10px; color: var(--text-dim);
            background: #131B26; padding: 2px 6px; border-radius: 4px;
          }
        `}</style>
      </div>
    </div>
  );
}
