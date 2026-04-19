import { useState } from 'react';
import * as I from './Icons';
import { LangDot } from './ContextViewer';
import { CodeBlock } from './Highlight';
import { TREE, CONTEXT_FILES } from '../data/mockData';

function TreeNode({ node, depth, q, selected, onSelect, path }) {
  const [open, setOpen] = useState(!!node.open || depth < 1);
  const fullPath = path ? `${path}/${node.name}` : node.name;
  const pad = 10 + depth * 14;

  if (node.type === "dir") {
    const matches = !q || JSON.stringify(node).toLowerCase().includes(q.toLowerCase());
    if (!matches) return null;
    return (
      <>
        <div className="tree-row" style={{ paddingLeft: pad }} onClick={() => setOpen(!open)}>
          <I.ChevronRight size={10} className={"tree-chev" + (open ? " open" : "")}/>
          <I.Files size={13} className="tree-icon"/>
          <span className="tree-name">{node.name}</span>
        </div>
        {open && node.children.map((c, i) => (
          <TreeNode key={i} node={c} depth={depth + 1} q={q} selected={selected} onSelect={onSelect} path={fullPath}/>
        ))}
      </>
    );
  }

  const isSel = selected === fullPath || selected.endsWith("/" + node.name);
  if (q && !node.name.toLowerCase().includes(q.toLowerCase())) return null;
  return (
    <div className={"tree-row" + (isSel ? " active" : "")} style={{ paddingLeft: pad + 16 }} onClick={() => onSelect(fullPath)}>
      <LangDot lang={node.name.split(".").pop()}/>
      <span className="tree-name">{node.name}</span>
      {node.hot && <span className="tree-hot" title="Recently changed"/>}
      <span className="tree-meta">{node.updated}</span>
    </div>
  );
}

function Tree({ nodes, depth, q, selected, onSelect, path }) {
  return (
    <div className="tree">
      {nodes.map((n, i) => <TreeNode key={i} node={n} depth={depth} q={q} selected={selected} onSelect={onSelect} path={path}/>)}
    </div>
  );
}

function Stat({ label, val, tone }) {
  return (
    <div className="stat">
      <div className="stat-val" data-tone={tone}>{val}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function FilePreview({ path }) {
  const idem = CONTEXT_FILES[0];
  return (
    <div className="file-preview">
      <div className="fp-head">
        <div className="fp-path mono">{path}</div>
        <div className="fp-actions">
          <button className="icon-btn small"><I.Chat size={12}/> <span style={{marginLeft:6, fontSize:11}}>Ask about</span></button>
          <button className="icon-btn small"><I.Map size={12}/> <span style={{marginLeft:6, fontSize:11}}>Show in map</span></button>
        </div>
      </div>
      <div className="fp-stats">
        <Stat label="Lines" val="98"/>
        <Stat label="Functions" val="3"/>
        <Stat label="Callers" val="12"/>
        <Stat label="Last change" val="1h ago"/>
        <Stat label="Complexity" val="Low" tone="ok"/>
      </div>
      <div className="fp-summary">
        <div className="fp-summary-head"><I.Sparkle size={12}/> <span>AI summary</span></div>
        <p>Implements response-caching middleware keyed by an idempotency string. The <span className="mono">withIdempotency</span> helper is used by the checkout service to dedupe payment confirmation requests, but it currently caches non-2xx results — which is the source of the sporadic retry 500s in production.</p>
      </div>
      <div className="fp-code">
        <CodeBlock
          code={idem.lines.join("\n")}
          startLine={idem.startLine}
          highlightLines={idem.highlight}
          fileHeader={path}
          dense
        />
      </div>
    </div>
  );
}

export default function FilesView() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState("services/checkout/idempotency.ts");

  return (
    <div className="files">
      <div className="files-head">
        <div className="files-search">
          <I.Search size={13}/>
          <input placeholder="Filter files…" value={q} onChange={e => setQ(e.target.value)}/>
          <kbd className="mono">⌘P</kbd>
        </div>
        <div className="files-meta mono">1,247 files · 186 dirs</div>
      </div>
      <div className="files-body">
        <div className="tree-scroll">
          <Tree nodes={TREE} depth={0} q={q} selected={selected} onSelect={setSelected} path=""/>
        </div>
        <FilePreview path={selected}/>
      </div>

      <style>{`
        .files { grid-area: main / main / ctx / ctx; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
        .files-head {
          display:flex; align-items:center; gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border);
        }
        .files-search {
          flex: 1;
          display:flex; align-items:center; gap: 8px;
          padding: 7px 12px;
          background: #0E141B;
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        .files-search svg { color: var(--text-dim); }
        .files-search input {
          flex: 1; background: transparent; border: 0; outline: none;
          color: var(--text); font-family: inherit; font-size: 12.5px;
        }
        .files-search input::placeholder { color: var(--text-dim); }
        .files-search kbd {
          font-size: 10px; color: var(--text-dim);
          border: 1px solid var(--border); padding: 1px 5px; border-radius: 4px;
        }
        .files-meta { font-size: 11px; color: var(--text-dim); }
        .files-body {
          flex: 1;
          display: grid;
          grid-template-columns: 320px 1fr;
          min-height: 0;
        }
        .tree-scroll { overflow: auto; padding: 8px 6px; border-right: 1px solid var(--border); }
        .tree-row {
          display:flex; align-items:center; gap: 6px;
          padding: 4px 8px;
          font-size: 12.5px;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 6px;
          border: 1px solid transparent;
          position: relative;
          font-family: 'JetBrains Mono', monospace;
        }
        .tree-row:hover { background: #111823; color: var(--text); }
        .tree-row.active { background: linear-gradient(90deg, var(--accent-soft), transparent 80%); color: var(--text); }
        .tree-row.active::before {
          content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 2px;
          background: var(--accent); border-radius: 2px; box-shadow: 0 0 6px var(--accent-glow);
        }
        .tree-chev { width: 12px; color: var(--text-dim); transition: transform 160ms ease; }
        .tree-chev.open { transform: rotate(90deg); }
        .tree-icon { color: var(--text-dim); }
        .tree-row.active .tree-icon { color: var(--accent-2); }
        .tree-name { flex: 1; }
        .tree-meta { font-size: 10px; color: var(--text-dim); }
        .tree-hot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--warn); box-shadow: 0 0 6px rgba(245,181,68,0.5);
        }
        .file-preview { overflow: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
        .fp-head { display:flex; align-items:center; justify-content: space-between; gap: 12px; }
        .fp-path { font-size: 12px; color: var(--text); }
        .fp-actions { display:flex; gap: 6px; }
        .fp-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .stat { padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; background: #0E141B; }
        .stat-val { font-size: 15px; font-weight: 600; color: var(--text); }
        .stat-val[data-tone="ok"] { color: var(--success); }
        .stat-label { font-size: 10.5px; color: var(--text-dim); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.08em; }
        .fp-summary {
          border: 1px solid var(--border); border-radius: 12px;
          padding: 14px; background: #0E141B;
        }
        .fp-summary-head { display:flex; align-items:center; gap: 6px; color: var(--accent-2); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .fp-summary p { margin: 0; font-size: 13px; color: var(--text-muted); line-height: 1.6; text-wrap: pretty; }
        .fp-summary .mono { color: var(--accent-2); }
      `}</style>
    </div>
  );
}
