import * as I from './Icons';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">
          <I.Issue size={24}/>
        </div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-msg">{message}</div>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
          <button className="confirm-delete" onClick={onConfirm}>Remove</button>
        </div>
      </div>

      <style>{`
        .confirm-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          animation: menu-pop 120ms ease;
        }
        .confirm-box {
          width: 360px;
          background: linear-gradient(180deg, #0E141B 0%, #0B1118 100%);
          border: 1px solid var(--border-2);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          text-align: center;
        }
        .confirm-icon {
          width: 48px; height: 48px;
          margin: 0 auto 16px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          background: rgba(240,110,110,0.1);
          border: 1px solid rgba(240,110,110,0.2);
          color: var(--danger);
        }
        .confirm-title {
          font-size: 16px; font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }
        .confirm-msg {
          font-size: 13px; color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .confirm-actions {
          display: flex; gap: 10px;
          justify-content: center;
        }
        .confirm-cancel {
          flex: 1;
          padding: 9px 16px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          transition: all 160ms ease;
        }
        .confirm-cancel:hover {
          color: var(--text);
          border-color: var(--border-2);
          background: #111823;
        }
        .confirm-delete {
          flex: 1;
          padding: 9px 16px;
          background: rgba(240,110,110,0.15);
          border: 1px solid rgba(240,110,110,0.3);
          border-radius: 10px;
          color: var(--danger);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 160ms ease;
        }
        .confirm-delete:hover {
          background: rgba(240,110,110,0.25);
          border-color: rgba(240,110,110,0.5);
        }
      `}</style>
    </div>
  );
}
