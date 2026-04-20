import { useState, useRef, useEffect } from 'react';
import * as I from './Icons';

export default function ProfileDropdown({ profile, setProfile }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name || '');
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = (profile.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSave = () => {
    setProfile(p => ({ ...p, name: name.trim() || 'User' }));
    setEditing(false);
  };

  return (
    <div className="profile-wrap" ref={ref}>
      <div className="avatar" onClick={() => setOpen(!open)}>
        <span>{initials}</span>
        <span className="avatar-status"/>
      </div>

      {open && (
        <div className="profile-menu">
          <div className="profile-info">
            <div className="profile-avatar-lg">
              <span>{initials}</span>
            </div>
            {editing ? (
              <div className="profile-edit">
                <input
                  className="profile-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <button className="profile-save" onClick={handleSave}>Save</button>
              </div>
            ) : (
              <>
                <div className="profile-name">{profile.name || 'User'}</div>
                <div className="profile-role">{profile.role || 'Developer'}</div>
              </>
            )}
          </div>

          <div className="profile-actions">
            <button className="profile-action" onClick={() => { setEditing(!editing); setName(profile.name || ''); }}>
              <I.User size={13}/>
              <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
            <button className="profile-action" onClick={() => {
              setProfile(p => ({
                ...p,
                role: p.role === 'Developer' ? 'Student' : p.role === 'Student' ? 'Team Lead' : 'Developer'
              }));
            }}>
              <I.Sparkle size={13}/>
              <span>Switch Role: {profile.role || 'Developer'}</span>
            </button>
          </div>

          <div className="profile-footer">
            <div className="profile-stat">
              <span className="profile-stat-val mono">{profile.queries || 0}</span>
              <span className="profile-stat-label">Queries</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-val mono">{profile.repos || 0}</span>
              <span className="profile-stat-label">Repos</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-wrap { position: relative; }
        .avatar {
          width: 30px; height: 30px; position: relative;
          border-radius: 50%;
          background: linear-gradient(135deg, #7AA2FF, #A983FF);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: #0B0F14;
          cursor: pointer;
          transition: transform 160ms ease;
        }
        .avatar:hover { transform: scale(1.05); }
        .avatar-status {
          position: absolute; bottom: -1px; right: -1px;
          width: 9px; height: 9px; border-radius: 50%;
          background: var(--success);
          border: 2px solid var(--bg);
        }
        .profile-menu {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 240px;
          background: #0F151D;
          border: 1px solid var(--border-2);
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          overflow: hidden;
          animation: menu-pop 150ms ease;
          z-index: 50;
        }
        .profile-info {
          padding: 16px;
          display: flex; flex-direction: column; align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--border);
        }
        .profile-avatar-lg {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7AA2FF, #A983FF);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 600; color: #0B0F14;
        }
        .profile-name { font-size: 14px; font-weight: 500; color: var(--text); }
        .profile-role { font-size: 11px; color: var(--accent-2); }
        .profile-edit { display: flex; gap: 6px; width: 100%; }
        .profile-input {
          flex: 1; padding: 6px 10px;
          background: #0B0F14; border: 1px solid var(--border);
          border-radius: 6px; color: var(--text);
          font-size: 12.5px; outline: none;
        }
        .profile-input:focus { border-color: var(--accent); }
        .profile-save {
          padding: 6px 12px;
          background: var(--accent); border: 0;
          border-radius: 6px; color: white;
          font-size: 11px; cursor: pointer;
        }
        .profile-actions {
          padding: 6px;
        }
        .profile-action {
          width: 100%;
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          background: transparent; border: 0;
          color: var(--text-muted); font-size: 12.5px;
          cursor: pointer; border-radius: 8px;
          transition: all 140ms ease;
          text-align: left;
        }
        .profile-action:hover { background: #141C27; color: var(--text); }
        .profile-action svg { color: var(--accent-2); }
        .profile-footer {
          display: flex; border-top: 1px solid var(--border);
          padding: 12px;
          gap: 12px;
        }
        .profile-stat {
          flex: 1; text-align: center;
          display: flex; flex-direction: column; gap: 2px;
        }
        .profile-stat-val { font-size: 16px; font-weight: 600; color: var(--text); }
        .profile-stat-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.08em; }
      `}</style>
    </div>
  );
}
