import { useState, useEffect, useRef } from 'react';
import * as I from './Icons';
import { GRAPH } from '../data/mockData';

const GROUP_COLORS = {
  app: "#6FA3FF",
  svc: "#A983FF",
  pkg: "#3BD68C",
  infra: "#F5B544",
};

export default function CodeMap() {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(null);
  const [dragging, setDragging] = useState(null);
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({ w: 1000, h: 700 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onMouseDown = (e) => setDragging({ sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y });
  const onMouseMove = (e) => {
    if (dragging) setOffset({ x: dragging.ox + (e.clientX - dragging.sx), y: dragging.oy + (e.clientY - dragging.sy) });
  };
  const onMouseUp = () => setDragging(null);

  const nodeById = Object.fromEntries(GRAPH.nodes.map(n => [n.id, n]));
  const hoverNode = hover ? nodeById[hover] : null;
  const nodeXY = (n) => ({ x: n.x * dims.w, y: n.y * dims.h });

  return (
    <div className="codemap">
      <div className="cm-head">
        <div className="cm-title">
          <I.Map size={14}/>
          <span>Code Map</span>
          <span className="cm-count mono">{GRAPH.nodes.length} modules · {GRAPH.edges.length} edges</span>
        </div>
        <div className="cm-legend">
          {Object.entries({ "App": "app", "Service": "svc", "Package": "pkg", "Infra": "infra" }).map(([label, k]) => (
            <div key={k} className="legend-item">
              <span className="legend-dot" style={{ background: GROUP_COLORS[k] }}/>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="cm-controls">
          <button className="icon-btn small" onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}>−</button>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", width: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button className="icon-btn small" onClick={() => setZoom(z => Math.min(2, z + 0.15))}>+</button>
          <button className="icon-btn small" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>Reset</button>
        </div>
      </div>

      <div
        className="cm-canvas"
        ref={wrapRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        <div className="cm-grid"/>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(79,140,255,0.05)"/>
              <stop offset="1" stopColor="rgba(79,140,255,0.35)"/>
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
            {GRAPH.edges.map(([a, b], i) => {
              const na = nodeXY(nodeById[a]);
              const nb = nodeXY(nodeById[b]);
              const midX = (na.x + nb.x) / 2;
              const midY = (na.y + nb.y) / 2 - 24;
              const active = hover === a || hover === b;
              return (
                <path
                  key={i}
                  d={`M ${na.x} ${na.y} Q ${midX} ${midY} ${nb.x} ${nb.y}`}
                  stroke={active ? "var(--accent-2)" : "url(#edgeGrad)"}
                  strokeWidth={active ? 1.5 : 1}
                  fill="none"
                  opacity={hover && !active ? 0.2 : 1}
                  style={{ transition: "all 160ms ease" }}
                />
              );
            })}
            {GRAPH.nodes.map(n => {
              const { x, y } = nodeXY(n);
              const active = hover === n.id;
              const color = GROUP_COLORS[n.group];
              return (
                <g
                  key={n.id}
                  transform={`translate(${x} ${y})`}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}
                >
                  {active && <circle r={n.size + 8} fill={color} opacity="0.15" filter="url(#glow)"/>}
                  <circle r={n.size} fill={`${color}1A`} stroke={color} strokeWidth={active ? 2 : 1.3} style={{ transition: "all 160ms ease" }}/>
                  <circle r={n.size - 4} fill="#0B0F14"/>
                  <text
                    y={n.size + 14}
                    textAnchor="middle"
                    fill={active ? "var(--text)" : "var(--text-muted)"}
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    style={{ transition: "all 160ms ease", pointerEvents: "none" }}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {hoverNode && (
          <div
            className="cm-tooltip"
            style={{
              left: nodeXY(hoverNode).x * zoom + offset.x + 24,
              top: nodeXY(hoverNode).y * zoom + offset.y - 8,
            }}
          >
            <div className="cm-tt-head">
              <span className="cm-tt-label mono">{hoverNode.label}</span>
              <span className="cm-tt-group" style={{ color: GROUP_COLORS[hoverNode.group] }}>{hoverNode.group}</span>
            </div>
            <div className="cm-tt-body">{hoverNode.summary}</div>
            <div className="cm-tt-foot mono">
              {GRAPH.edges.filter(([a, b]) => a === hoverNode.id || b === hoverNode.id).length} edges
            </div>
          </div>
        )}
      </div>

      <style>{`
        .codemap { grid-area: main / main / ctx / ctx; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
        .cm-head {
          display:flex; align-items:center; gap: 16px;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
        }
        .cm-title { display:flex; align-items:center; gap: 8px; font-size: 13px; }
        .cm-title svg { color: var(--accent-2); }
        .cm-count { font-size: 11px; color: var(--text-dim); }
        .cm-legend { display:flex; gap: 14px; margin-left: auto; }
        .legend-item { display:flex; align-items:center; gap:6px; font-size: 11px; color: var(--text-muted); }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .cm-controls { display:flex; gap: 4px; align-items: center; }
        .cm-controls .icon-btn { padding: 2px 8px; font-size: 12px; min-width: 24px; }
        .cm-canvas { flex: 1; position: relative; overflow: hidden; background: #0A0E13; user-select: none; }
        .cm-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
        }
        .cm-tooltip {
          position: absolute;
          background: rgba(14, 20, 27, 0.95);
          border: 1px solid var(--border-2);
          border-radius: 10px;
          padding: 10px 12px;
          min-width: 220px; max-width: 280px;
          backdrop-filter: blur(8px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          pointer-events: none;
          z-index: 10;
        }
        .cm-tt-head { display:flex; align-items:center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .cm-tt-label { font-size: 12px; color: var(--text); }
        .cm-tt-group { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
        .cm-tt-body { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
        .cm-tt-foot { font-size: 10.5px; color: var(--text-dim); margin-top: 8px; border-top: 1px solid var(--border); padding-top: 6px; }
      `}</style>
    </div>
  );
}
