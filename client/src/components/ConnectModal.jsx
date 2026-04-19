import { useState } from 'react';
import * as I from './Icons';
import { connectRepo } from '../api';

export default function ConnectModal({ onClose, onConnected }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setProgress('Cloning repository...');

    try {
      setProgress('Cloning and indexing... this may take a minute');
      const result = await connectRepo(url.trim());
      setProgress('Done!');
      onConnected(result);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            <I.GitBranch size={16}/>
            <span>Connect Repository</span>
          </div>
          <button className="icon-btn small" onClick={onClose}>
            <I.Close size={14}/>
          </button>
        </div>

        <div className="modal-body">
          <label className="modal-label">GitHub Repository URL</label>
          <input
            className="modal-input mono"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
          />

          {error && <div className="modal-error">{error}</div>}
          {progress && <div className="modal-progress">{progress}</div>}
        </div>

        <div className="modal-foot">
          <button className="modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={"modal-submit" + (url.trim() ? " active" : "")}
            onClick={handleSubmit}
            disabled={!url.trim() || loading}
          >
            {loading ? 'Connecting...' : 'Connect & Index'}
          </button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed; inset: 0; z-index: 100;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            animation: menu-pop 150ms ease;
          }
          .modal {
            width: 480px;
            background: linear-gradient(180deg, #0E141B 0%, #0B1118 100%);
            border: 1px solid var(--border-2);
            border-radius: 16px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
            overflow: hidden;
          }
          .modal-head {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
          }
          .modal-title { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; }
          .modal-title svg { color: var(--accent-2); }
          .modal-body { padding: 20px 16px; }
          .modal-label {
            display: block;
            font-size: 11px; color: var(--text-dim);
            text-transform: uppercase; letter-spacing: 0.1em;
            margin-bottom: 8px;
          }
          .modal-input {
            width: 100%;
            padding: 10px 12px;
            background: #0B0F14;
            border: 1px solid var(--border);
            border-radius: 10px;
            color: var(--text);
            font-size: 13px;
            outline: none;
            transition: border-color 180ms ease;
          }
          .modal-input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-soft);
          }
          .modal-input::placeholder { color: var(--text-dim); }
          .modal-error {
            margin-top: 10px; padding: 8px 12px;
            background: rgba(240, 110, 110, 0.08);
            border: 1px solid rgba(240, 110, 110, 0.25);
            border-radius: 8px;
            color: var(--danger); font-size: 12.5px;
          }
          .modal-progress {
            margin-top: 10px; padding: 8px 12px;
            background: rgba(79, 140, 255, 0.08);
            border: 1px solid rgba(79, 140, 255, 0.25);
            border-radius: 8px;
            color: var(--accent-2); font-size: 12.5px;
          }
          .modal-foot {
            display: flex; justify-content: flex-end; gap: 8px;
            padding: 12px 16px;
            border-top: 1px solid var(--border);
          }
          .modal-cancel {
            padding: 8px 14px;
            background: transparent;
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 13px;
            transition: all 140ms ease;
          }
          .modal-cancel:hover { color: var(--text); border-color: var(--border-2); }
          .modal-submit {
            padding: 8px 16px;
            background: #0B1118;
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 160ms ease;
          }
          .modal-submit.active {
            background: linear-gradient(180deg, var(--accent) 0%, #3A78F0 100%);
            color: white;
            border-color: rgba(79, 140, 255, 0.5);
            box-shadow: 0 4px 14px rgba(79, 140, 255, 0.35);
          }
          .modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        `}</style>
      </div>
    </div>
  );
}
