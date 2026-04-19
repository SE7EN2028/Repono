import { useState, useEffect } from 'react';
import * as I from './Icons';
import { getRepoInsights } from '../api';

function Card({ title, icon, span = 1, children }) {
  const Ico = I[icon];
  return (
    <div className="card" style={{ gridColumn: `span ${span}` }}>
      <div className="card-head">
        <Ico size={13}/>
        <span>{title}</span>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

export default function InsightsView({ repoId, repoName }) {
  const [data, setData] = useState({ summary: '', stack: [], frameworks: [], entries: [], issues: [], hotspots: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    getRepoInsights(repoId)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [repoId]);

  const name = repoName || 'repository';

  return (
    <div className="insights">
      <div className="ins-scroll">
        <div className="ins-hero">
          <div className="ins-hero-label">
            <I.Sparkle size={12}/>
            <span>Repo overview</span>
          </div>
          <h1>{name}</h1>
          <p className="ins-hero-sub">{data.summary}</p>
          <div className="ins-hero-meta mono">
            <span>{data.fileCount || 0} files</span><span>·</span>
            <span>{(data.totalLines || 0).toLocaleString()} LOC</span>
            {loading && <><span>·</span><span>loading...</span></>}
          </div>
        </div>

        <div className="ins-grid">
          <Card title="Tech stack" icon="Layers" span={2}>
            <div className="stack-bar">
              {(data.stack || []).map((s, i) => (
                <div key={i} className="stack-seg" style={{ width: `${s.share}%`, background: s.color }} title={`${s.name} · ${s.share}%`}/>
              ))}
            </div>
            <div className="stack-legend">
              {(data.stack || []).map(s => (
                <div key={s.name} className="stack-legend-item">
                  <span className="legend-dot" style={{ background: s.color }}/>
                  <span>{s.name}</span>
                  <span className="mono muted">{s.share}%</span>
                </div>
              ))}
            </div>
            {data.frameworks && data.frameworks.length > 0 && (
              <div className="fw-row">
                {data.frameworks.map(f => <span key={f} className="fw-pill">{f}</span>)}
              </div>
            )}
          </Card>

          <Card title="Entry points" icon="Entry">
            <div className="entry-list">
              {(data.entries || []).map((e, i) => (
                <div key={i} className="entry-item">
                  <div className="entry-role">{e.role}</div>
                  <div className="entry-file mono">{e.file}</div>
                </div>
              ))}
              {(!data.entries || data.entries.length === 0) && (
                <div style={{color: 'var(--text-dim)', fontSize: 12}}>No entry points detected</div>
              )}
            </div>
          </Card>

          <Card title="Potential issues" icon="Issue" span={2}>
            <div className="issue-list">
              {(data.issues || []).map((it, i) => (
                <div key={i} className={"issue issue-" + it.level}>
                  <div className="issue-dot"/>
                  <div className="issue-body">
                    <div className="issue-title">{it.title}</div>
                    <div className="issue-file mono">{it.file}:{it.line}</div>
                  </div>
                </div>
              ))}
              {(!data.issues || data.issues.length === 0) && (
                <div style={{color: 'var(--text-dim)', fontSize: 12}}>No issues found</div>
              )}
            </div>
          </Card>

          {data.hotspots && data.hotspots.length > 0 && (
            <Card title="Hotspots" icon="Zap">
              <div className="hot-list">
                {data.hotspots.map((h, i) => {
                  const w = Math.min(100, (h.changes / 40) * 100);
                  return (
                    <div key={i} className="hot-row">
                      <div className="hot-file mono">{h.file}</div>
                      <div className="hot-bar"><div style={{ width: `${w}%` }}/></div>
                      <div className="hot-meta mono">{h.changes} · {h.contributors}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      <style>{`
        .insights { grid-column: 2 / -1; grid-row: 2; display:flex; min-width: 0; min-height: 0; }
        .ins-scroll { flex: 1; overflow: auto; padding: 28px 40px 40px; }
        .ins-hero { max-width: 1100px; margin: 0 auto 28px; }
        .ins-hero-label {
          display:inline-flex; align-items:center; gap: 6px;
          font-size: 11px; color: var(--accent-2);
          background: rgba(79,140,255,0.08);
          border: 1px solid rgba(79,140,255,0.25);
          padding: 3px 10px; border-radius: 99px;
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .ins-hero h1 { font-size: 30px; letter-spacing: -0.02em; margin: 14px 0 10px; font-weight: 600; color: var(--text); }
        .ins-hero-sub { font-size: 15px; color: var(--text-muted); line-height: 1.55; max-width: 720px; text-wrap: pretty; margin: 0; }
        .ins-hero-meta { display:flex; gap: 10px; font-size: 11.5px; color: var(--text-dim); margin-top: 14px; }
        .ins-grid {
          max-width: 1100px; margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .card {
          background: linear-gradient(180deg, #0E141B 0%, #0B1118 100%);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
        }
        .card:hover { border-color: var(--border-2); transform: translateY(-1px); box-shadow: 0 12px 28px rgba(0,0,0,0.3); }
        .card-head {
          display:flex; align-items:center; gap: 8px;
          font-size: 11px; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 14px;
        }
        .card-head svg { color: var(--accent-2); }
        .stack-bar { height: 10px; border-radius: 99px; overflow: hidden; display:flex; background: #131B26; margin-bottom: 12px; }
        .stack-seg { height: 100%; }
        .stack-legend { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-bottom: 14px; }
        .stack-legend-item { display:flex; align-items:center; gap: 6px; font-size: 12px; }
        .stack-legend-item .muted { color: var(--text-dim); margin-left: auto; font-size: 11px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .fw-row { display:flex; flex-wrap: wrap; gap: 6px; padding-top: 12px; border-top: 1px solid var(--border); }
        .fw-pill {
          font-size: 11px; font-family: 'JetBrains Mono', monospace;
          padding: 3px 8px; border-radius: 6px;
          background: #0C1219; border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .entry-list { display:flex; flex-direction: column; gap: 8px; }
        .entry-item { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; background: #0C1219; }
        .entry-role { font-size: 12px; color: var(--text); }
        .entry-file { font-size: 11px; color: var(--accent-2); margin-top: 2px; }
        .issue-list { display:flex; flex-direction: column; gap: 2px; }
        .issue {
          display: grid;
          grid-template-columns: 10px 1fr;
          gap: 12px; align-items: center;
          padding: 10px 12px;
          border-radius: 10px;
          transition: background 140ms ease;
        }
        .issue:hover { background: #111823; }
        .issue-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; }
        .issue-warn .issue-dot { background: var(--warn); box-shadow: 0 0 8px rgba(245,181,68,0.5); }
        .issue-info .issue-dot { background: var(--accent-2); box-shadow: 0 0 8px rgba(79,140,255,0.5); }
        .issue-danger .issue-dot { background: var(--danger); box-shadow: 0 0 8px rgba(240,110,110,0.5); }
        .issue-title { font-size: 13px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .issue-file { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
        .hot-list { display:flex; flex-direction: column; gap: 10px; }
        .hot-row { display: grid; grid-template-columns: 1fr 80px auto; gap: 10px; align-items: center; }
        .hot-file { font-size: 11px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hot-bar { height: 4px; background: #131B26; border-radius: 99px; overflow: hidden; }
        .hot-bar > div { height: 100%; background: linear-gradient(90deg, var(--accent), var(--purple)); }
        .hot-meta { font-size: 10.5px; color: var(--text-dim); }
      `}</style>
    </div>
  );
}
