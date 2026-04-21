import { useState, useEffect } from 'react';
import * as I from './Icons';

export default function SettingsPanel({ settings, setSettings, onClose }) {
  const [activeTab, setActiveTab] = useState('general');
  const [lightModeMsg, setLightModeMsg] = useState(false);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'api', label: 'API Keys' },
    { id: 'appearance', label: 'Appearance' },
  ];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-head">
          <div className="settings-title">
            <I.Settings size={15}/>
            <span>Settings</span>
          </div>
          <button className="icon-btn small" onClick={onClose}><I.Close size={13}/></button>
        </div>

        <div className="settings-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={"settings-tab" + (activeTab === t.id ? " active" : "")}
              onClick={() => setActiveTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        <div className="settings-body">
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-label">Model</div>
                <select
                  className="setting-select mono"
                  value={settings.model || 'llama-3.3-70b-versatile'}
                  onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B (faster)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-label">Max results per query</div>
                <select
                  className="setting-select mono"
                  value={settings.maxResults || 8}
                  onChange={e => setSettings(s => ({ ...s, maxResults: Number(e.target.value) }))}
                >
                  <option value={4}>4 chunks</option>
                  <option value={8}>8 chunks</option>
                  <option value={12}>12 chunks</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-label">Clone depth</div>
                <select
                  className="setting-select mono"
                  value={settings.cloneDepth || 1}
                  onChange={e => setSettings(s => ({ ...s, cloneDepth: Number(e.target.value) }))}
                >
                  <option value={1}>Shallow (depth 1)</option>
                  <option value={0}>Full history</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-label">Groq API Key</div>
                <input
                  type="password"
                  className="setting-input mono"
                  placeholder="gsk_..."
                  value={settings.groqKey || ''}
                  onChange={e => setSettings(s => ({ ...s, groqKey: e.target.value }))}
                />
                <div className="setting-hint">Free at console.groq.com/keys</div>
              </div>

              <div className="setting-item">
                <div className="setting-label">GitHub Token (for private repos)</div>
                <input
                  type="password"
                  className="setting-input mono"
                  placeholder="ghp_..."
                  value={settings.githubToken || ''}
                  onChange={e => setSettings(s => ({ ...s, githubToken: e.target.value }))}
                />
                <div className="setting-hint">Optional — only needed for private repositories</div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-label">Accent Color</div>
                <div className="color-swatches">
                  {['#4F8CFF', '#A983FF', '#3BD68C', '#F5B544', '#FF7BB0', '#4FD1C5'].map(c => (
                    <button
                      key={c}
                      className={"color-swatch" + (settings.accent === c ? " active" : "")}
                      style={{ background: c }}
                      onClick={() => setSettings(s => ({ ...s, accent: c }))}
                    />
                  ))}
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-label">Font Size</div>
                <select
                  className="setting-select mono"
                  value={settings.fontSize || '14'}
                  onChange={e => setSettings(s => ({ ...s, fontSize: e.target.value }))}
                >
                  <option value="12">Small (12px)</option>
                  <option value="14">Default (14px)</option>
                  <option value="16">Large (16px)</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-label">Theme</div>
                <div className="theme-toggle">
                  <button
                    className={"theme-btn active"}
                    onClick={() => {}}
                  >
                    <I.Sparkle size={12}/> Dark
                  </button>
                  <button
                    className="theme-btn"
                    onClick={() => setLightModeMsg(true)}
                  >
                    <I.Zap size={12}/> Light
                  </button>
                </div>
              </div>

              {lightModeMsg && (
                <div className="light-mode-toast">
                  <div className="toast-icon">
                    <I.Issue size={20}/>
                  </div>
                  <div className="toast-text">
                    <div className="toast-title">Nice try</div>
                    <div className="toast-msg">Real devs don't use light mode. Your eyes will thank you later.</div>
                  </div>
                  <button className="toast-close" onClick={() => setLightModeMsg(false)}>
                    <I.Close size={12}/>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <style>{`
          .settings-overlay {
            position: fixed; inset: 0; z-index: 100;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            animation: menu-pop 150ms ease;
          }
          .settings-panel {
            width: 480px;
            background: linear-gradient(180deg, #0E141B 0%, #0B1118 100%);
            border: 1px solid var(--border-2);
            border-radius: 16px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.6);
            overflow: hidden;
          }
          .settings-head {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
          }
          .settings-title { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; }
          .settings-title svg { color: var(--accent-2); }
          .settings-tabs {
            display: flex; gap: 0;
            border-bottom: 1px solid var(--border);
          }
          .settings-tab {
            flex: 1; padding: 10px;
            background: transparent; border: 0;
            color: var(--text-muted); font-size: 12.5px;
            cursor: pointer; transition: all 140ms ease;
            border-bottom: 2px solid transparent;
          }
          .settings-tab:hover { color: var(--text); background: #111823; }
          .settings-tab.active {
            color: var(--accent-2);
            border-bottom-color: var(--accent);
          }
          .settings-body { padding: 16px; }
          .settings-section { display: flex; flex-direction: column; gap: 16px; }
          .setting-item { display: flex; flex-direction: column; gap: 6px; }
          .setting-label {
            font-size: 11px; color: var(--text-dim);
            text-transform: uppercase; letter-spacing: 0.1em;
          }
          .setting-select, .setting-input {
            width: 100%; padding: 9px 12px;
            background: #0B0F14; border: 1px solid var(--border);
            border-radius: 8px; color: var(--text);
            font-size: 12.5px; outline: none;
            transition: border-color 180ms ease;
          }
          .setting-select:focus, .setting-input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-soft);
          }
          .setting-select option { background: #0B0F14; color: var(--text); }
          .setting-hint { font-size: 11px; color: var(--text-dim); }
          .color-swatches { display: flex; gap: 10px; }
          .color-swatch {
            width: 28px; height: 28px; border-radius: 50%;
            border: 2px solid transparent; cursor: pointer;
            transition: transform 160ms ease;
          }
          .color-swatch:hover { transform: scale(1.1); }
          .color-swatch.active { border-color: var(--text); box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px currentColor; }
          .theme-toggle { display: flex; gap: 6px; }
          .theme-btn {
            flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
            padding: 8px 12px;
            background: #0B0F14; border: 1px solid var(--border);
            border-radius: 8px; color: var(--text-muted);
            font-size: 12.5px; cursor: pointer;
            transition: all 160ms ease;
          }
          .theme-btn:hover { border-color: var(--border-2); color: var(--text); }
          .theme-btn.active {
            background: var(--accent-soft);
            border-color: var(--accent);
            color: var(--accent-2);
          }
          .theme-btn.active svg { color: var(--accent-2); }
          @keyframes toast-slide {
            from { opacity: 0; transform: translateY(8px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .light-mode-toast {
            display: flex; align-items: flex-start; gap: 10px;
            padding: 12px;
            background: linear-gradient(135deg, rgba(240,110,110,0.1), rgba(245,181,68,0.08));
            border: 1px solid rgba(240,110,110,0.25);
            border-radius: 10px;
            animation: toast-slide 0.3s ease-out;
          }
          .toast-icon { color: var(--warn); flex-shrink: 0; margin-top: 2px; }
          .toast-text { flex: 1; }
          .toast-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
          .toast-msg { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
          .toast-close {
            background: transparent; border: 0;
            color: var(--text-dim); cursor: pointer;
            padding: 2px; border-radius: 4px;
          }
          .toast-close:hover { color: var(--text); }
        `}</style>
      </div>
    </div>
  );
}
