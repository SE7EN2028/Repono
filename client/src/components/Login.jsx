import { useState, useEffect, useRef } from 'react';

const FAKE_LOG = [
  { hash: 'a91f3c2', msg: 'embed: chunk by AST boundary' },
  { hash: '6663e96', msg: 'add dockerfile for deployment' },
  { hash: '6775ddd', msg: 'clean up console logs' },
  { hash: 'f10c648', msg: 'remove redundant limitation' },
  { hash: '61115b6', msg: 'send api keys in headers' },
  { hash: '9eb1c21', msg: 'block path traversal in file endpoint' },
  { hash: 'b2e7d40', msg: 'vector store: cosine sim batched' },
  { hash: '4c8a1bd', msg: 'parse: skip binaries early' },
  { hash: 'd57e2f1', msg: 'router: scope by repoId' },
];

export default function Login({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [tickerIdx, setTickerIdx] = useState(0);
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTickerIdx(i => (i + 1) % FAKE_LOG.length), 2400);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!email || !password) {
      setErr('Both fields required.');
      return;
    }
    setLoading(true);
    try {
      if (onSubmit) await onSubmit({ email, password });
      else await new Promise(r => setTimeout(r, 700));
    } catch (e2) {
      setErr(e2.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return (
    <div className="login-root">
      <div className="grain" />

      <aside className="left">
        <div className="brandline">
          <span className="brand-mark">◐</span>
          <span className="brand-name mono">repono</span>
          <span className="brand-ver mono">v0.1.0</span>
        </div>

        <div className="hero">
          <div className="kicker mono">// retrieval · embeddings · code intelligence</div>
          <h1 className="title">
            Ask your <em>codebase</em>
            <br />anything you<br />
            wish you knew.
          </h1>
          <p className="lede">
            Index a repo. Trace symbols across files. Surface the
            three lines that matter without grepping for an hour.
          </p>
        </div>

        <div className="ticker">
          <div className="ticker-head mono">
            <span className="dot" /> log&nbsp;·&nbsp;main
          </div>
          <div className="ticker-body">
            {[0, 1, 2].map(off => {
              const item = FAKE_LOG[(tickerIdx + off) % FAKE_LOG.length];
              return (
                <div key={off} className={`tick t${off}`}>
                  <span className="hash mono">{item.hash}</span>
                  <span className="msg">{item.msg}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="foot mono">
          <span>{tz}</span>
          <span className="sep">·</span>
          <span>{now.toLocaleDateString('en-CA')}</span>
          <span className="sep">·</span>
          <span className="status"><i className="led" /> services nominal</span>
        </div>
      </aside>

      <main className="right">
        <div className="panel">
          <div className="crosshair tl" />
          <div className="crosshair tr" />
          <div className="crosshair bl" />
          <div className="crosshair br" />

          <header className="panel-head">
            <div className="panel-label mono">[ 01 ] sign in</div>
            <div className="panel-sub">Welcome back.</div>
          </header>

          <button type="button" className="oauth">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span>Continue with GitHub</span>
            <span className="kbd mono">↵</span>
          </button>

          <div className="divider">
            <span className="mono">or with email</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span className="lbl mono">email</span>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@workshop.dev"
                autoComplete="email"
                spellCheck={false}
              />
            </label>

            <label className="field">
              <span className="lbl mono">
                password
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setShowPw(s => !s)}
                  tabIndex={-1}
                >
                  {showPw ? 'hide' : 'show'}
                </button>
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
            </label>

            <div className="row">
              <label className="check">
                <input type="checkbox" defaultChecked />
                <span>Keep me signed in</span>
              </label>
              <a className="link" href="#forgot">Forgot?</a>
            </div>

            {err && <div className="err mono">! {err}</div>}

            <button type="submit" className="submit" disabled={loading}>
              <span>{loading ? 'authenticating…' : 'Sign in'}</span>
              <span className="arrow">{loading ? '◐' : '→'}</span>
            </button>
          </form>

          <footer className="panel-foot">
            <span>New here?</span>
            <a className="link strong" href="#signup">Create an account</a>
          </footer>
        </div>

        <div className="legal mono">
          <span>© 2026 repono</span>
          <span>terms</span>
          <span>privacy</span>
          <span>status</span>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,400&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .login-root {
          --bg: #0A0E13;
          --ink: #ECE7DC;
          --ink-2: #B6AE9D;
          --ink-3: #6D6557;
          --line: #1F2630;
          --line-2: #2B3340;
          --accent: #E4FF4C;
          --accent-ink: #14180B;
          --paper: #11161D;
          --paper-2: #0E1218;
          --warn: #FF8C5A;
          position: fixed;
          inset: 0;
          background: var(--bg);
          color: var(--ink);
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          overflow: hidden;
          font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
        }

        .grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.55;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.9  0 0 0 0 0.88  0 0 0 0 0.82  0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
          z-index: 2;
        }

        /* LEFT  ----------------------------------------------------- */
        .left {
          position: relative;
          padding: 36px 56px 28px;
          display: grid;
          grid-template-rows: auto 1fr auto auto;
          border-right: 1px solid var(--line);
          background:
            radial-gradient(720px 380px at 8% 0%, rgba(228, 255, 76, 0.06), transparent 60%),
            radial-gradient(620px 520px at 105% 100%, rgba(228, 255, 76, 0.04), transparent 60%),
            linear-gradient(180deg, #0A0E13 0%, #0B1017 100%);
          overflow: hidden;
        }

        .left::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--line) 1px, transparent 1px),
            linear-gradient(90deg, var(--line) 1px, transparent 1px);
          background-size: 56px 56px;
          opacity: 0.18;
          mask-image: radial-gradient(900px 700px at 30% 40%, black, transparent 80%);
        }

        .brandline {
          display: flex;
          align-items: baseline;
          gap: 10px;
          z-index: 1;
          animation: rise 700ms cubic-bezier(.2,.7,.2,1) both;
        }
        .brand-mark {
          font-size: 22px;
          color: var(--accent);
          transform: translateY(2px);
          line-height: 1;
        }
        .brand-name {
          font-size: 15px;
          letter-spacing: 0.04em;
          font-weight: 600;
        }
        .brand-ver {
          font-size: 11px;
          color: var(--ink-3);
          letter-spacing: 0.06em;
        }

        .hero {
          align-self: center;
          max-width: 620px;
          z-index: 1;
        }

        .kicker {
          font-size: 11px;
          color: var(--ink-3);
          letter-spacing: 0.08em;
          margin-bottom: 22px;
          animation: rise 700ms 80ms cubic-bezier(.2,.7,.2,1) both;
        }

        .title {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: clamp(48px, 5.6vw, 78px);
          line-height: 0.96;
          letter-spacing: -0.025em;
          margin: 0 0 28px;
          color: var(--ink);
          animation: rise 800ms 140ms cubic-bezier(.2,.7,.2,1) both;
        }
        .title em {
          font-style: italic;
          font-weight: 400;
          color: var(--accent);
          font-variation-settings: "SOFT" 100, "opsz" 144;
        }

        .lede {
          font-size: 16.5px;
          line-height: 1.55;
          color: var(--ink-2);
          max-width: 460px;
          margin: 0;
          animation: rise 800ms 220ms cubic-bezier(.2,.7,.2,1) both;
        }

        .ticker {
          z-index: 1;
          border: 1px solid var(--line);
          border-radius: 4px;
          background: rgba(17, 22, 29, 0.6);
          backdrop-filter: blur(6px);
          padding: 14px 16px 16px;
          animation: rise 800ms 320ms cubic-bezier(.2,.7,.2,1) both;
        }
        .ticker-head {
          font-size: 10.5px;
          color: var(--ink-3);
          letter-spacing: 0.08em;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .ticker-head .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          animation: blink 1.8s ease-in-out infinite;
        }
        .ticker-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tick {
          display: grid;
          grid-template-columns: 88px 1fr;
          gap: 14px;
          font-size: 13px;
          transition: opacity 400ms ease;
        }
        .tick .hash {
          color: var(--accent);
          font-size: 11.5px;
          letter-spacing: 0.04em;
          align-self: center;
        }
        .tick .msg {
          color: var(--ink-2);
        }
        .tick.t0 { opacity: 1; }
        .tick.t1 { opacity: 0.55; }
        .tick.t2 { opacity: 0.25; }

        .foot {
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          color: var(--ink-3);
          letter-spacing: 0.05em;
          margin-top: 24px;
          animation: rise 700ms 420ms cubic-bezier(.2,.7,.2,1) both;
        }
        .foot .sep { color: var(--line-2); }
        .foot .status { display: inline-flex; align-items: center; gap: 6px; }
        .foot .led {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4be58a;
          box-shadow: 0 0 6px #4be58a;
        }

        /* RIGHT ----------------------------------------------------- */
        .right {
          position: relative;
          display: grid;
          grid-template-rows: 1fr auto;
          align-items: center;
          justify-items: center;
          padding: 40px;
          background: var(--paper-2);
        }
        .right::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(420px 320px at 50% 25%, rgba(228, 255, 76, 0.05), transparent 60%);
          pointer-events: none;
        }

        .panel {
          position: relative;
          width: min(420px, 100%);
          align-self: center;
          padding: 38px 38px 30px;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 2px;
          animation: rise 900ms 200ms cubic-bezier(.2,.7,.2,1) both;
        }

        .crosshair {
          position: absolute;
          width: 14px;
          height: 14px;
          border-color: var(--accent);
          border-style: solid;
          border-width: 0;
        }
        .crosshair.tl { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
        .crosshair.tr { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; }
        .crosshair.bl { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; }
        .crosshair.br { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }

        .panel-head { margin-bottom: 22px; }
        .panel-label {
          font-size: 10.5px;
          letter-spacing: 0.12em;
          color: var(--accent);
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .panel-sub {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 28px;
          letter-spacing: -0.015em;
          color: var(--ink);
        }

        .oauth {
          width: 100%;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: transparent;
          border: 1px solid var(--line-2);
          color: var(--ink);
          font-size: 13.5px;
          font-weight: 500;
          font-family: inherit;
          border-radius: 2px;
          cursor: pointer;
          transition: all 180ms ease;
        }
        .oauth:hover {
          border-color: var(--ink-2);
          background: rgba(255, 255, 255, 0.02);
        }
        .oauth svg { transform: translateY(0); }
        .oauth .kbd {
          font-size: 10.5px;
          color: var(--ink-3);
          border: 1px solid var(--line-2);
          padding: 1px 6px;
          border-radius: 3px;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 18px;
          color: var(--ink-3);
          font-size: 10.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--line);
        }

        .field {
          display: block;
          margin-bottom: 14px;
        }
        .lbl {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 6px;
        }
        .ghost {
          background: none;
          border: none;
          color: var(--ink-3);
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 10.5px;
          letter-spacing: 0.08em;
          cursor: pointer;
          padding: 0;
        }
        .ghost:hover { color: var(--accent); }

        .field input {
          width: 100%;
          padding: 11px 0;
          background: transparent;
          border: 0;
          border-bottom: 1px solid var(--line-2);
          color: var(--ink);
          font-size: 15px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          letter-spacing: 0.01em;
          outline: none;
          transition: border-color 220ms ease, box-shadow 220ms ease;
        }
        .field input::placeholder {
          color: var(--ink-3);
          font-family: 'Instrument Sans', sans-serif;
          font-style: italic;
        }
        .field input:focus {
          border-bottom-color: var(--accent);
          box-shadow: 0 1px 0 0 var(--accent);
        }

        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 18px 0 18px;
          font-size: 13px;
        }
        .check {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--ink-2);
          cursor: pointer;
          user-select: none;
        }
        .check input {
          appearance: none;
          width: 14px;
          height: 14px;
          border: 1px solid var(--line-2);
          border-radius: 2px;
          background: transparent;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: all 160ms ease;
        }
        .check input:checked {
          background: var(--accent);
          border-color: var(--accent);
        }
        .check input:checked::after {
          content: "✓";
          color: var(--accent-ink);
          font-size: 10px;
          font-weight: 700;
        }

        .link {
          color: var(--ink-2);
          text-decoration: none;
          font-size: 13px;
          border-bottom: 1px dotted var(--line-2);
          padding-bottom: 1px;
          transition: color 160ms ease, border-color 160ms ease;
        }
        .link:hover {
          color: var(--accent);
          border-color: var(--accent);
        }
        .link.strong {
          color: var(--ink);
          border-bottom-style: solid;
        }

        .err {
          font-size: 12px;
          color: var(--warn);
          margin: -6px 0 12px;
          letter-spacing: 0.04em;
        }

        .submit {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: var(--accent);
          color: var(--accent-ink);
          border: 0;
          border-radius: 2px;
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 220ms ease, opacity 160ms ease;
          box-shadow: 0 0 0 0 rgba(228, 255, 76, 0);
        }
        .submit:hover:not(:disabled) {
          box-shadow: 0 10px 28px -10px rgba(228, 255, 76, 0.55);
          transform: translateY(-1px);
        }
        .submit:active:not(:disabled) { transform: translateY(0); }
        .submit:disabled { opacity: 0.75; cursor: progress; }
        .submit .arrow { font-size: 18px; line-height: 1; }
        .submit:disabled .arrow { animation: spin 1.2s linear infinite; }

        .panel-foot {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px dashed var(--line);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--ink-3);
        }

        .legal {
          align-self: end;
          display: flex;
          gap: 18px;
          font-size: 10.5px;
          color: var(--ink-3);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 28px;
        }

        @keyframes rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 920px) {
          .login-root { grid-template-columns: 1fr; }
          .left { display: none; }
          .right { padding: 24px; }
        }
      `}</style>
    </div>
  );
}
