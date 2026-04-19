import * as I from './Icons';
import { CodeBlock } from './Highlight';

function LangDot({ lang }) {
  const map = { ts: "#3178C6", tsx: "#3178C6", js: "#F7DF1E", go: "#00ADD8", py: "#3776AB", rs: "#CE412B" };
  return <span style={{ width: 8, height: 8, borderRadius: 2, background: map[lang] || "#8B97A8", display: "inline-block" }}/>;
}

export default function ContextViewer({ files, activePath, setActivePath }) {
  const active = files.find(f => f.path === activePath) || files[0];
  return (
    <aside className="ctx">
      <div className="ctx-head">
        <div className="ctx-title">
          <I.Layers size={13}/>
          <span>Context</span>
          <span className="ctx-count mono">{files.length}</span>
        </div>
        <button className="icon-btn small"><I.Close size={13}/></button>
      </div>

      <div className="ctx-tabs">
        {files.map(f => {
          const parts = f.path.split("/");
          const name = parts[parts.length - 1];
          return (
            <button
              key={f.path}
              className={"ctx-tab" + (f.path === active.path ? " active" : "")}
              onClick={() => setActivePath(f.path)}
              title={f.path}
            >
              <LangDot lang={f.lang}/>
              <span className="ctx-tab-name mono">{name}</span>
              <span className="ctx-tab-close"><I.Close size={10}/></span>
            </button>
          );
        })}
      </div>

      <div className="ctx-path mono">
        {active.path.split("/").map((p, i, arr) => (
          <span key={i}>
            <span className={i === arr.length - 1 ? "leaf" : "dir"}>{p}</span>
            {i < arr.length - 1 && <span className="sep">/</span>}
          </span>
        ))}
      </div>

      <div className="ctx-scroll">
        <CodeBlock
          code={active.lines.join("\n")}
          startLine={active.startLine}
          highlightLines={active.highlight || []}
          dense
        />
        <div className="ctx-related">
          <div className="ctx-related-head">Why this file was retrieved</div>
          <div className="ctx-reason">
            Semantic match on <span className="mono">"idempotency cache on declined"</span> — 0.87 similarity.
            Also cross-referenced from <span className="mono">charge.ts</span>.
          </div>
          <div className="ctx-refs">
            <div className="ctx-ref"><I.Function size={11}/><span className="mono">withIdempotency()</span><span className="ctx-ref-meta">defined here · 4 callers</span></div>
            <div className="ctx-ref"><I.Function size={11}/><span className="mono">keyFor()</span><span className="ctx-ref-meta">defined here · 2 callers</span></div>
          </div>
        </div>
      </div>

      <style>{`
        .ctx {
          grid-area: ctx;
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--border);
          background: linear-gradient(180deg, #0C1219 0%, #0B0F14 100%);
          width: var(--right-w);
          min-width: var(--right-w);
          min-height: 0;
        }
        .ctx-head {
          display:flex; align-items:center; justify-content:space-between;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
        }
        .ctx-title { display:flex; align-items:center; gap: 8px; font-size: 13px; }
        .ctx-title svg { color: var(--accent-2); }
        .ctx-count {
          font-size: 10.5px; color: var(--text-dim);
          background: #131B26; padding: 1px 6px; border-radius: 99px;
          border: 1px solid var(--border);
        }
        .ctx-tabs {
          display:flex; gap: 2px; padding: 6px 8px 0;
          overflow-x: auto;
          border-bottom: 1px solid var(--border);
        }
        .ctx-tab {
          display:inline-flex; align-items:center; gap: 6px;
          padding: 7px 10px;
          background: transparent; border: 1px solid transparent;
          border-bottom: 0;
          border-radius: 8px 8px 0 0;
          color: var(--text-muted);
          font-size: 11.5px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 140ms ease;
          position: relative; bottom: -1px;
        }
        .ctx-tab:hover { color: var(--text); background: #111823; }
        .ctx-tab.active {
          color: var(--text);
          background: var(--bg);
          border-color: var(--border);
          border-bottom-color: var(--bg);
        }
        .ctx-tab.active::after {
          content: ""; position: absolute; left: 8px; right: 8px; top: 0;
          height: 2px; background: linear-gradient(90deg, var(--accent), var(--accent-2));
          border-radius: 2px;
          box-shadow: 0 0 6px var(--accent-glow);
        }
        .ctx-tab-close { opacity: 0; color: var(--text-dim); transition: opacity 140ms; }
        .ctx-tab:hover .ctx-tab-close { opacity: 1; }
        .ctx-path {
          padding: 8px 14px;
          font-size: 11px;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          white-space: nowrap;
        }
        .ctx-path .dir { color: var(--text-dim); }
        .ctx-path .leaf { color: var(--text); }
        .ctx-path .sep { color: var(--text-dim); margin: 0 4px; }
        .ctx-scroll { flex: 1; overflow: auto; padding: 14px; display: flex; flex-direction: column; gap: 16px; }
        .ctx-related {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          background: #0E141B;
        }
        .ctx-related-head {
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .ctx-reason { font-size: 12.5px; color: var(--text); line-height: 1.55; }
        .ctx-reason .mono { color: var(--accent-2); font-size: 11.5px; }
        .ctx-refs { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
        .ctx-ref {
          display:grid; grid-template-columns: 12px auto 1fr;
          gap: 8px; align-items: center;
          padding: 6px 8px;
          background: #0B1118;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 12px;
        }
        .ctx-ref .mono { color: var(--accent-2); font-size: 11.5px; }
        .ctx-ref svg { color: var(--purple); }
        .ctx-ref-meta { color: var(--text-dim); font-size: 11px; justify-self: end; }
      `}</style>
    </aside>
  );
}

export { LangDot };
