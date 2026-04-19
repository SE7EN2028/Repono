import * as I from './Icons';

function Toggle({ on, onChange }) {
  return (
    <button className={"toggle" + (on ? " on" : "")} onClick={() => onChange(!on)}>
      <span className="knob"/>
      <style>{`
        .toggle {
          width: 32px; height: 18px; border-radius: 99px;
          background: #1A2330; border: 0;
          position: relative; cursor: pointer;
          transition: background 200ms ease;
          padding: 0;
        }
        .toggle.on { background: var(--accent); box-shadow: 0 0 10px var(--accent-glow); }
        .knob {
          position: absolute; top: 2px; left: 2px;
          width: 14px; height: 14px;
          background: white; border-radius: 50%;
          transition: transform 200ms ease;
        }
        .toggle.on .knob { transform: translateX(14px); }
      `}</style>
    </button>
  );
}

export default function TweaksPanel({ tweaks, setTweak, open, setOpen }) {
  if (!open) {
    return (
      <button className="tweaks-fab" onClick={() => setOpen(true)} title="Open Tweaks">
        <I.Tweaks size={16}/>
        <style>{`
          .tweaks-fab {
            position: fixed; bottom: 20px; right: 20px; z-index: 50;
            width: 40px; height: 40px;
            border-radius: 50%;
            background: linear-gradient(180deg, #121A25, #0D131A);
            border: 1px solid var(--border-2);
            color: var(--accent-2);
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(79,140,255,0.15);
            display:flex; align-items:center; justify-content:center;
            transition: all 200ms ease;
          }
          .tweaks-fab:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.5), 0 0 30px rgba(79,140,255,0.25); }
        `}</style>
      </button>
    );
  }

  const accents = [
    { name: "Electric", hex: "#4F8CFF" },
    { name: "Violet", hex: "#A983FF" },
    { name: "Mint", hex: "#3BD68C" },
    { name: "Amber", hex: "#F5B544" },
    { name: "Rose", hex: "#FF7BB0" },
    { name: "Cyan", hex: "#4FD1C5" },
  ];

  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        <div className="tweaks-title">
          <I.Tweaks size={13}/>
          <span>Tweaks</span>
        </div>
        <button className="icon-btn small" onClick={() => setOpen(false)}><I.Close size={13}/></button>
      </div>

      <div className="tweaks-body">
        <div className="tweak">
          <div className="tweak-label">Accent</div>
          <div className="swatches">
            {accents.map(a => (
              <button
                key={a.hex}
                className={"swatch" + (tweaks.accent === a.hex ? " active" : "")}
                style={{ background: a.hex, boxShadow: tweaks.accent === a.hex ? `0 0 0 2px var(--bg), 0 0 0 4px ${a.hex}` : "none" }}
                onClick={() => setTweak("accent", a.hex)}
                title={a.name}
              />
            ))}
          </div>
        </div>

        <div className="tweak">
          <div className="tweak-label">Density</div>
          <div className="seg">
            {["comfortable", "compact"].map(d => (
              <button
                key={d}
                className={"seg-btn" + (tweaks.density === d ? " active" : "")}
                onClick={() => setTweak("density", d)}
              >{d}</button>
            ))}
          </div>
        </div>

        <div className="tweak">
          <div className="tweak-label">Sidebar</div>
          <div className="seg">
            <button className={"seg-btn" + (!tweaks.sidebarCollapsed ? " active" : "")} onClick={() => setTweak("sidebarCollapsed", false)}>Expanded</button>
            <button className={"seg-btn" + (tweaks.sidebarCollapsed ? " active" : "")} onClick={() => setTweak("sidebarCollapsed", true)}>Collapsed</button>
          </div>
        </div>

        <div className="tweak">
          <div className="tweak-label tweak-row">
            <span>Ambient glow</span>
            <Toggle on={tweaks.showAmbientGlow} onChange={v => setTweak("showAmbientGlow", v)}/>
          </div>
        </div>

        <div className="tweak-note mono">Changes persist across reloads.</div>
      </div>

      <style>{`
        .tweaks-panel {
          position: fixed; bottom: 20px; right: 20px; z-index: 50;
          width: 280px;
          background: rgba(14, 20, 27, 0.92);
          border: 1px solid var(--border-2);
          border-radius: 14px;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          overflow: hidden;
          animation: menu-pop 200ms ease;
        }
        .tweaks-head {
          display:flex; align-items:center; justify-content: space-between;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
        }
        .tweaks-title { display:flex; align-items:center; gap: 8px; font-size: 12.5px; font-weight: 500; }
        .tweaks-title svg { color: var(--accent-2); }
        .tweaks-body { padding: 14px; display:flex; flex-direction: column; gap: 14px; }
        .tweak-label { font-size: 10.5px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
        .tweak-row { display:flex; align-items:center; justify-content: space-between; margin-bottom: 0; }
        .swatches { display:flex; gap: 8px; }
        .swatch {
          width: 22px; height: 22px; border-radius: 50%;
          border: 0; cursor: pointer;
          transition: transform 160ms ease;
        }
        .swatch:hover { transform: scale(1.08); }
        .seg {
          display:flex; background: #0B1118;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 2px;
          gap: 2px;
        }
        .seg-btn {
          flex: 1;
          padding: 5px 8px;
          background: transparent; border: 0;
          color: var(--text-muted);
          font-size: 11.5px;
          border-radius: 6px;
          cursor: pointer;
          text-transform: capitalize;
          transition: all 140ms ease;
        }
        .seg-btn.active { background: #121A25; color: var(--text); box-shadow: 0 1px 0 rgba(255,255,255,0.02); }
        .tweak-note { font-size: 10px; color: var(--text-dim); text-align: center; }
      `}</style>
    </div>
  );
}
