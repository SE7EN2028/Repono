import { useState, useEffect, useMemo } from 'react';
import * as I from './Icons';
import { getApiFlow } from '../api';

const METHOD_COLORS = {
  GET: 'var(--success)',
  POST: 'var(--accent)',
  PUT: 'var(--warn)',
  PATCH: 'var(--purple)',
  DELETE: 'var(--danger)',
  ALL: 'var(--text-muted)',
  USE: 'var(--text-muted)',
};

const STEP_STYLES = {
  auth:       { color: 'var(--warn)',    bg: 'rgba(245,181,68,0.10)',  border: 'rgba(245,181,68,0.35)',  label: 'AUTH' },
  validation: { color: 'var(--purple)',  bg: 'rgba(169,131,255,0.10)', border: 'rgba(169,131,255,0.35)', label: 'VALIDATE' },
  logging:    { color: 'var(--text-muted)', bg: '#0F1620',             border: 'var(--border)',          label: 'LOG' },
  security:   { color: 'var(--danger)',  bg: 'rgba(240,110,110,0.10)', border: 'rgba(240,110,110,0.35)', label: 'SECURITY' },
  parsing:    { color: 'var(--accent-2)', bg: 'var(--accent-soft)',    border: 'rgba(79,140,255,0.35)',  label: 'PARSE' },
  middleware: { color: 'var(--text)',    bg: '#121A25',                border: 'var(--border-2)',        label: 'MIDDLEWARE' },
  handler:    { color: 'var(--success)', bg: 'rgba(59,214,140,0.10)',  border: 'rgba(59,214,140,0.35)',  label: 'HANDLER' },
};

const DB_COLORS = {
  mongo:    '#3BD68C',
  prisma:   '#A983FF',
  sql:      '#F5B544',
  postgres: '#6FA3FF',
  redis:    '#FF7BB0',
};

function MethodBadge({ method }) {
  const color = METHOD_COLORS[method] || 'var(--text-muted)';
  return (
    <span className="method-badge mono" style={{ color, borderColor: color }}>
      {method}
    </span>
  );
}

function StepBox({ step, onClick, last }) {
  const style = STEP_STYLES[step.type] || STEP_STYLES.middleware;
  return (
    <>
      <button
        className="step-box"
        onClick={onClick}
        style={{
          background: style.bg,
          borderColor: style.border,
          color: style.color,
        }}
        title={step.name}
      >
        <span className="step-tag mono">{style.label}</span>
        <span className="step-name mono">{step.name}</span>
        {step.db && step.db.length > 0 && (
          <span className="step-db-row">
            {step.db.map(d => (
              <span key={d} className="step-db mono" style={{ background: DB_COLORS[d] || 'var(--accent-2)' }}>
                {d}
              </span>
            ))}
          </span>
        )}
      </button>
      {!last && <span className="step-arrow">→</span>}
    </>
  );
}

function RouteRow({ route, open, onToggle, onOpenStep }) {
  return (
    <div className={'route-row' + (open ? ' open' : '')}>
      <button className="route-head" onClick={onToggle}>
        <MethodBadge method={route.method}/>
        <span className="route-path mono">{route.path}</span>
        <span className="route-steps-count mono">{route.steps.length} step{route.steps.length === 1 ? '' : 's'}</span>
        <span className="route-file mono">{route.file}:{route.line}</span>
        <I.Chevron size={14} style={{ transition: 'transform 180ms', transform: open ? 'rotate(180deg)' : 'none', color: 'var(--text-dim)' }}/>
      </button>
      {open && (
        <div className="route-flow">
          <div className="flow-pipeline">
            <div className="flow-start mono">REQUEST</div>
            <span className="step-arrow">→</span>
            {route.steps.map((s, i) => (
              <StepBox
                key={i}
                step={s}
                last={i === route.steps.length - 1}
                onClick={() => onOpenStep(route, s, i)}
              />
            ))}
            <span className="step-arrow">→</span>
            <div className="flow-end mono">RESPONSE</div>
          </div>
          <pre className="route-snippet mono">{route.code}</pre>
        </div>
      )}
    </div>
  );
}

function StepModal({ route, step, onClose }) {
  if (!step) return null;
  const style = STEP_STYLES[step.type] || STEP_STYLES.middleware;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="step-tag mono" style={{ background: style.bg, color: style.color, borderColor: style.border }}>
            {style.label}
          </span>
          <span className="modal-title mono">{step.name}</span>
          <button className="icon-btn" onClick={onClose}><I.Close size={14}/></button>
        </div>
        <div className="modal-meta mono">
          <MethodBadge method={route.method}/>
          <span>{route.path}</span>
          <span className="dot-sep">·</span>
          <span className="muted">{route.file}:{route.line}</span>
        </div>
        <pre className="modal-code mono">{route.code}</pre>
        {step.db && step.db.length > 0 && (
          <div className="modal-db">
            <span className="muted mono">Database calls:</span>
            {step.db.map(d => (
              <span key={d} className="step-db mono" style={{ background: DB_COLORS[d] || 'var(--accent-2)' }}>{d}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApiFlow({ repoId }) {
  const [data, setData] = useState({ routes: [], summary: { total: 0, byMethod: {}, filesScanned: 0, topMiddleware: [] } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [modalStep, setModalStep] = useState(null);
  const [modalRoute, setModalRoute] = useState(null);

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    setError('');
    getApiFlow(repoId)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [repoId]);

  const filtered = useMemo(() => {
    return (data.routes || []).filter(r => {
      if (filter !== 'ALL' && r.method !== filter) return false;
      if (query && !r.path.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [data.routes, filter, query]);

  const methods = useMemo(() => ['ALL', ...Object.keys(data.summary?.byMethod || {})], [data.summary]);

  return (
    <div className="api-flow">
      <div className="af-scroll">
        <div className="af-hero">
          <div className="af-hero-label">
            <I.Flow size={12}/>
            <span>API Flow</span>
          </div>
          <h1>Request flow visualizer</h1>
          <p className="af-hero-sub">
            Auto-detected Express routes with middleware chains and database hits.
            Click any step to inspect the code.
          </p>
          <div className="af-hero-meta mono">
            <span>{data.summary?.total || 0} routes</span>
            <span>·</span>
            <span>{data.summary?.filesScanned || 0} files scanned</span>
            {loading && <><span>·</span><span>parsing...</span></>}
            {error && <><span>·</span><span style={{ color: 'var(--danger)' }}>{error}</span></>}
          </div>
        </div>

        <div className="af-controls">
          <div className="af-filters">
            {methods.map(m => (
              <button
                key={m}
                className={'af-chip' + (filter === m ? ' active' : '')}
                onClick={() => setFilter(m)}
                style={filter === m && m !== 'ALL' ? { borderColor: METHOD_COLORS[m], color: METHOD_COLORS[m] } : {}}
              >
                <span className="mono">{m}</span>
                {m !== 'ALL' && <span className="af-chip-count mono">{data.summary?.byMethod?.[m] || 0}</span>}
                {m === 'ALL' && <span className="af-chip-count mono">{data.summary?.total || 0}</span>}
              </button>
            ))}
          </div>
          <div className="af-search">
            <I.Search size={12}/>
            <input
              type="text"
              placeholder="Filter by path..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {data.summary?.topMiddleware?.length > 0 && (
          <div className="af-mw-strip">
            <span className="af-mw-label">Most-used middleware</span>
            {data.summary.topMiddleware.map(m => (
              <span key={m.name} className="af-mw-pill mono">
                {m.name}
                <span className="af-mw-count">{m.count}</span>
              </span>
            ))}
          </div>
        )}

        <div className="af-list">
          {filtered.length === 0 && !loading && (
            <div className="af-empty">
              {data.routes?.length === 0
                ? 'No Express routes found in this repo. The parser looks for app.get/post/use and router.get/post/use patterns.'
                : 'No routes match the current filter.'}
            </div>
          )}
          {filtered.map(r => (
            <RouteRow
              key={r.id}
              route={r}
              open={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              onOpenStep={(route, step) => { setModalRoute(route); setModalStep(step); }}
            />
          ))}
        </div>
      </div>

      {modalStep && <StepModal route={modalRoute} step={modalStep} onClose={() => setModalStep(null)}/>}

      <style>{`
        .api-flow { grid-column: 2 / -1; grid-row: 2; display:flex; min-width: 0; min-height: 0; }
        .af-scroll { flex: 1; overflow: auto; padding: 28px 40px 40px; }

        .af-hero { max-width: 1100px; margin: 0 auto 22px; }
        .af-hero-label {
          display:inline-flex; align-items:center; gap: 6px;
          font-size: 11px; color: var(--accent-2);
          background: rgba(79,140,255,0.08);
          border: 1px solid rgba(79,140,255,0.25);
          padding: 3px 10px; border-radius: 99px;
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .af-hero h1 { font-size: 30px; letter-spacing: -0.02em; margin: 14px 0 10px; font-weight: 600; color: var(--text); }
        .af-hero-sub { font-size: 15px; color: var(--text-muted); line-height: 1.55; max-width: 720px; margin: 0; }
        .af-hero-meta { display:flex; gap: 10px; font-size: 11.5px; color: var(--text-dim); margin-top: 14px; }

        .af-controls {
          max-width: 1100px; margin: 0 auto 14px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
        }
        .af-filters { display:flex; flex-wrap: wrap; gap: 6px; }
        .af-chip {
          display:inline-flex; align-items:center; gap: 6px;
          padding: 5px 10px; border-radius: 99px;
          background: transparent; border: 1px solid var(--border);
          color: var(--text-muted); cursor: pointer;
          font-size: 11px; transition: all 140ms ease;
        }
        .af-chip:hover { color: var(--text); border-color: var(--border-2); }
        .af-chip.active { color: var(--text); border-color: var(--accent); background: var(--accent-soft); }
        .af-chip-count {
          font-size: 10px; padding: 0 5px;
          background: rgba(255,255,255,0.04);
          border-radius: 6px; color: var(--text-dim);
        }

        .af-search {
          display:inline-flex; align-items:center; gap: 8px;
          padding: 6px 10px; background: #0F151D;
          border: 1px solid var(--border); border-radius: 8px;
          color: var(--text-muted);
        }
        .af-search input {
          background: transparent; border: 0; outline: none;
          color: var(--text); font-family: inherit; font-size: 12px;
          width: 180px;
        }

        .af-mw-strip {
          max-width: 1100px; margin: 0 auto 18px;
          display:flex; flex-wrap: wrap; align-items:center; gap: 6px;
          padding: 10px 12px;
          background: linear-gradient(180deg, #0E141B 0%, #0B1118 100%);
          border: 1px solid var(--border); border-radius: 12px;
        }
        .af-mw-label {
          font-size: 10.5px; color: var(--text-dim);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-right: 4px;
        }
        .af-mw-pill {
          display:inline-flex; align-items:center; gap: 6px;
          font-size: 11px; padding: 3px 8px;
          border-radius: 6px;
          background: #0C1219; border: 1px solid var(--border);
          color: var(--text);
        }
        .af-mw-count { color: var(--accent-2); font-size: 10px; }

        .af-list { max-width: 1100px; margin: 0 auto; display:flex; flex-direction: column; gap: 8px; }
        .af-empty {
          padding: 28px; text-align: center;
          color: var(--text-dim); font-size: 13px;
          background: #0C1219; border: 1px dashed var(--border);
          border-radius: 12px;
        }

        .route-row {
          background: linear-gradient(180deg, #0E141B 0%, #0B1118 100%);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
          overflow: hidden;
        }
        .route-row:hover { border-color: var(--border-2); }
        .route-row.open { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent-soft), 0 12px 28px rgba(0,0,0,0.3); }

        .route-head {
          display: grid;
          grid-template-columns: auto 1fr auto auto auto;
          gap: 14px; align-items: center;
          width: 100%; padding: 12px 16px;
          background: transparent; border: 0;
          color: var(--text); cursor: pointer;
          text-align: left; font-family: inherit;
        }
        .route-head:hover { background: rgba(255,255,255,0.02); }

        .method-badge {
          font-size: 10.5px; font-weight: 600;
          padding: 3px 7px; border-radius: 5px;
          border: 1px solid;
          min-width: 50px; text-align: center;
          background: rgba(255,255,255,0.02);
        }
        .route-path { font-size: 13.5px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .route-steps-count { font-size: 10.5px; color: var(--text-dim); }
        .route-file { font-size: 10.5px; color: var(--accent-2); opacity: 0.8; }

        .route-flow {
          border-top: 1px solid var(--border);
          padding: 18px 16px;
          background: #0A0F15;
        }
        .flow-pipeline {
          display:flex; flex-wrap: wrap; align-items: center; gap: 6px;
          margin-bottom: 14px;
        }
        .flow-start, .flow-end {
          font-size: 10px; padding: 6px 10px;
          border-radius: 6px;
          background: #0F151D; border: 1px solid var(--border);
          color: var(--text-dim);
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .flow-end { color: var(--accent-2); border-color: rgba(79,140,255,0.3); background: var(--accent-soft); }

        .step-arrow {
          font-size: 14px;
          color: var(--text-dim);
          padding: 0 2px;
        }

        .step-box {
          display:flex; flex-direction: column; align-items: flex-start; gap: 3px;
          padding: 8px 12px;
          border: 1px solid;
          border-radius: 8px;
          cursor: pointer; font-family: inherit;
          min-width: 90px;
          transition: transform 140ms ease, box-shadow 140ms ease;
        }
        .step-box:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.3); }
        .step-tag { font-size: 9px; letter-spacing: 0.1em; opacity: 0.85; }
        .step-name { font-size: 12px; }
        .step-db-row { display:flex; gap: 3px; margin-top: 3px; }
        .step-db {
          font-size: 8.5px; padding: 1px 5px;
          border-radius: 4px;
          color: #0B0F14; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        .route-snippet {
          margin: 0;
          padding: 10px 12px;
          background: #07090D;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 11.5px;
          color: var(--text-muted);
          overflow-x: auto;
          white-space: pre;
          line-height: 1.5;
        }

        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
          animation: menu-pop 160ms ease;
        }
        .modal {
          width: min(680px, 92vw);
          max-height: 80vh; overflow: auto;
          background: linear-gradient(180deg, #0E141B 0%, #0B1118 100%);
          border: 1px solid var(--border-2);
          border-radius: 14px;
          padding: 18px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.7);
        }
        .modal-head { display:flex; align-items:center; gap: 10px; margin-bottom: 12px; }
        .step-tag {
          font-size: 10px; padding: 3px 7px;
          border-radius: 5px;
          border: 1px solid;
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .modal-title { font-size: 14px; color: var(--text); flex: 1; }
        .modal-meta {
          display:flex; align-items: center; gap: 8px;
          font-size: 11.5px; color: var(--text-muted);
          margin-bottom: 12px;
        }
        .modal-meta .muted { color: var(--text-dim); }
        .modal-code {
          margin: 0;
          padding: 12px 14px;
          background: #07090D;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 12px;
          color: var(--text);
          line-height: 1.55;
          overflow-x: auto;
          white-space: pre;
        }
        .modal-db { display:flex; align-items:center; gap: 6px; margin-top: 12px; }
        .modal-db .muted { color: var(--text-dim); margin-right: 4px; }
      `}</style>
    </div>
  );
}
