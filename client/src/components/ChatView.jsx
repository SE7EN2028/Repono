import { useState, useEffect, useRef } from 'react';
import * as I from './Icons';
import { CodeBlock } from './Highlight';

function renderInline(t) {
  return t
    .replace(/`([^`]+)`/g, '<code class="mono" style="font-size: 0.9em; padding: 1px 5px; background: #121923; border: 1px solid var(--border); border-radius: 4px; color: var(--accent-2);">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: var(--text); font-weight: 600;">$1</strong>');
}

function renderMarkdown(text) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      return <CodeBlock key={i} code={code} startLine={1}/>;
    }
    const lines = part.split('\n').filter(l => l.trim());
    return lines.map((line, j) => {
      if (line.startsWith('- ')) {
        return <div key={`${i}-${j}`} className="block-text" style={{paddingLeft: 12}} dangerouslySetInnerHTML={{ __html: '• ' + renderInline(line.slice(2)) }}/>;
      }
      return <div key={`${i}-${j}`} className="block-text" dangerouslySetInnerHTML={{ __html: renderInline(line) }}/>;
    });
  });
}

function Block({ block, onOpenRef }) {
  if (block.type === "text") {
    return <div className="block-text-wrap">{renderMarkdown(block.text)}</div>;
  }
  if (block.type === "code") {
    return <CodeBlock code={block.code} startLine={block.startLine} fileHeader={block.file}/>;
  }
  if (block.type === "refs") {
    return (
      <div className="block-refs">
        <div className="refs-head">
          <I.Layers size={12}/>
          <span>Referenced {block.items.length} files</span>
        </div>
        {block.items.map((it, i) => (
          <button key={i} className="ref-item" onClick={() => onOpenRef && onOpenRef(it.file)}>
            <div className="ref-path mono">{it.file}</div>
            <div className="ref-lines mono">L{it.lines}</div>
            <div className="ref-why">{it.why}</div>
            <I.ChevronRight size={13} className="ref-chev"/>
          </button>
        ))}
      </div>
    );
  }
  if (block.type === "list") {
    return (
      <ul className="block-list">
        {block.items.map((t, i) => <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(t) }}/>)}
      </ul>
    );
  }
  if (block.type === "callout") {
    const color = block.kind === "info" ? "var(--accent)" : block.kind === "warn" ? "var(--warn)" : "var(--success)";
    return (
      <div className="block-callout" style={{ "--c": color }}>
        <I.Sparkle size={13}/>
        <div dangerouslySetInnerHTML={{ __html: renderInline(block.text) }}/>
      </div>
    );
  }
  return null;
}

function Message({ m, onOpenRef }) {
  if (m.role === "user") {
    return (
      <div className="msg user">
        <div className="msg-bubble">{m.text}</div>
        <div className="msg-meta mono">You · {m.time}</div>
      </div>
    );
  }
  return (
    <div className="msg assistant">
      <div className="assistant-head">
        <div className="assistant-av"><I.Sparkle size={12}/></div>
        <div className="assistant-name">Repono</div>
        <div className="msg-meta mono">· {m.time}</div>
      </div>
      <div className="msg-body">
        {(m.blocks || []).map((b, i) => <Block key={i} block={b} onOpenRef={onOpenRef}/>)}
        <div className="msg-actions">
          <button><I.Copy size={12}/> Copy</button>
          <button><I.Check size={12}/> Good</button>
          <button><I.Close size={12}/> Bad</button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="typing">
      <div className="assistant-av"><I.Sparkle size={12}/></div>
      <div className="dots"><span/><span/><span/></div>
      <span className="thinking mono">searching codebase…</span>
    </div>
  );
}

export function streamText(full, onUpdate, onDone, speed = 8) {
  let i = 0;
  const step = () => {
    if (i >= full.length) { onDone && onDone(); return; }
    const chunk = Math.min(speed + Math.floor(Math.random() * 4), full.length - i);
    i += chunk;
    onUpdate(full.slice(0, i));
    setTimeout(step, 22 + Math.random() * 30);
  };
  step();
}

export default function ChatView({ messages, onSend, streaming, onOpenRef, repoConnected }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const submit = () => {
    if (!input.trim() || streaming) return;
    onSend(input.trim());
    setInput("");
  };

  const suggestions = repoConnected ? [
    "Explain the main entry point",
    "Where is authentication handled?",
    "Find potential bugs in this codebase",
    "Give me a high-level overview",
  ] : [
    "Connect a repository first to start asking questions",
  ];

  return (
    <div className="chat">
      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-inner">
          {messages.length === 0 && !streaming && (
            <div className="chat-welcome">
              <div className="welcome-icon"><I.Sparkle size={28}/></div>
              <h2>Repono</h2>
              <p>{repoConnected ? 'Ask anything about your codebase' : 'Connect a repository to get started'}</p>
            </div>
          )}
          {messages.map(m => <Message key={m.id} m={m} onOpenRef={onOpenRef}/>)}
          {streaming && <TypingIndicator/>}
        </div>
      </div>

      <div className="composer-wrap">
        {messages.length === 0 && (
          <div className="suggest">
            {suggestions.map(s => (
              <button key={s} className="suggest-pill" onClick={() => setInput(s)}>
                <I.Sparkle size={11}/>
                <span>{s}</span>
              </button>
            ))}
          </div>
        )}
        <div className="composer">
          <div className="ctx-chips">
            <span className="ctx-chip"><I.Files size={11}/> services/checkout <I.Close size={10}/></span>
            <span className="ctx-chip"><I.GitBranch size={11}/> main@a41c9d2 <I.Close size={10}/></span>
            <button className="ctx-add"><I.Plus size={11}/> Add context</button>
          </div>
          <textarea
            placeholder="Ask about your codebase…"
            value={input}
            rows={2}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
          />
          <div className="composer-foot">
            <div className="composer-tools">
              <button className="tool-btn"><I.Attach size={14}/></button>
              <button className="tool-btn"><I.Terminal size={14}/></button>
              <div className="model-pill">
                <I.Sparkle size={11}/>
                <span>Repono · Deep</span>
                <I.Chevron size={11}/>
              </div>
            </div>
            <button className={"send-btn" + (input.trim() ? " active" : "")} onClick={submit} disabled={!input.trim() || streaming}>
              <I.Send size={13}/>
              <span>Send</span>
              <kbd className="mono">↵</kbd>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .chat { grid-area: main; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
        .chat-scroll { flex: 1; overflow: auto; }
        .chat-inner { max-width: 820px; margin: 0 auto; padding: 32px 28px 24px; display: flex; flex-direction: column; gap: 22px; min-height: 100%; }
        .chat-welcome { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 8px; padding: 60px 0; }
        .chat-welcome .welcome-icon { color: var(--accent-2); margin-bottom: 8px; }
        .chat-welcome h2 { font-size: 24px; font-weight: 600; color: var(--text); margin: 0; }
        .chat-welcome p { font-size: 14px; color: var(--text-muted); margin: 0; }
        .block-text-wrap { display: flex; flex-direction: column; gap: 8px; }
        .composer-wrap { padding: 10px 28px 20px; }
        .composer-wrap > * { max-width: 820px; margin-left: auto; margin-right: auto; }
        .suggest { display:flex; flex-wrap: wrap; gap: 6px; padding: 0 0 10px; }
        .suggest-pill {
          display:flex; align-items:center; gap:6px;
          padding: 6px 10px;
          background: #101721;
          border: 1px solid var(--border);
          border-radius: 99px;
          color: var(--text-muted);
          font-size: 12px;
          cursor: pointer;
          transition: all 160ms ease;
        }
        .suggest-pill:hover { color: var(--text); border-color: var(--border-2); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
        .suggest-pill svg { color: var(--accent-2); }
        .composer {
          background: linear-gradient(180deg, #101721 0%, #0D131A 100%);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 10px 12px 8px;
          transition: all 200ms ease;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .composer:focus-within {
          border-color: rgba(79,140,255,0.4);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3), 0 0 0 4px var(--accent-soft);
        }
        .ctx-chips { display:flex; flex-wrap:wrap; gap: 6px; padding: 2px 2px 8px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
        .ctx-chip {
          display:inline-flex; align-items:center; gap: 5px;
          padding: 3px 8px;
          background: rgba(79,140,255,0.08);
          color: var(--accent-2);
          border: 1px solid rgba(79,140,255,0.2);
          border-radius: 6px;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
        }
        .ctx-chip svg:last-child { color: var(--text-dim); cursor: pointer; margin-left: 2px; }
        .ctx-chip svg:last-child:hover { color: var(--text); }
        .ctx-add {
          display:inline-flex; align-items:center; gap: 4px;
          padding: 3px 8px;
          background: transparent;
          border: 1px dashed var(--border-2);
          color: var(--text-muted);
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
        }
        .ctx-add:hover { color: var(--text); border-color: var(--text-dim); }
        .composer textarea {
          width: 100%;
          background: transparent;
          border: 0; outline: none;
          resize: none;
          color: var(--text);
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          padding: 4px 2px 8px;
        }
        .composer textarea::placeholder { color: var(--text-dim); }
        .composer-foot { display:flex; align-items:center; justify-content:space-between; }
        .composer-tools { display:flex; align-items:center; gap: 4px; }
        .tool-btn {
          display:inline-flex; align-items:center; justify-content:center;
          width: 28px; height: 28px;
          background: transparent; border: 0;
          color: var(--text-dim); border-radius: 6px;
          cursor: pointer;
          transition: all 140ms ease;
        }
        .tool-btn:hover { color: var(--text); background: #141C27; }
        .model-pill {
          display:inline-flex; align-items:center; gap: 5px;
          padding: 4px 8px;
          background: #0B1118;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 11.5px;
          cursor: pointer;
          margin-left: 4px;
        }
        .model-pill svg:first-child { color: var(--accent-2); }
        .model-pill:hover { color: var(--text); border-color: var(--border-2); }
        .send-btn {
          display:inline-flex; align-items:center; gap: 6px;
          padding: 6px 10px 6px 12px;
          background: #0B1118;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 12.5px; font-weight: 500;
          cursor: pointer;
          transition: all 160ms ease;
        }
        .send-btn.active {
          background: linear-gradient(180deg, var(--accent) 0%, #3A78F0 100%);
          color: white;
          border-color: rgba(79,140,255,0.5);
          box-shadow: 0 4px 14px rgba(79,140,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .send-btn.active:hover { filter: brightness(1.05); transform: translateY(-1px); }
        .send-btn:disabled { opacity: 0.8; cursor: not-allowed; }
        .send-btn kbd { font-size: 10px; background: rgba(255,255,255,0.1); padding: 0 5px; border-radius: 3px; }
        .send-btn:not(.active) kbd { background: #131B26; }
        .msg { display:flex; flex-direction: column; }
        .msg.user { align-items: flex-end; }
        .msg.user .msg-bubble {
          background: linear-gradient(180deg, #121A25 0%, #0F1721 100%);
          border: 1px solid var(--border);
          padding: 12px 14px;
          border-radius: 14px 14px 4px 14px;
          max-width: 80%;
          color: var(--text);
          font-size: 13.5px;
          line-height: 1.55;
          text-wrap: pretty;
        }
        .msg-meta { font-size: 10.5px; color: var(--text-dim); margin-top: 6px; }
        .assistant-head { display:flex; align-items:center; gap: 8px; margin-bottom: 8px; }
        .assistant-av {
          width: 22px; height: 22px;
          display:flex; align-items:center; justify-content:center;
          border-radius: 6px;
          background: radial-gradient(circle at 30% 20%, rgba(79,140,255,0.3), rgba(79,140,255,0.08) 70%);
          border: 1px solid rgba(79,140,255,0.3);
          color: var(--accent-2);
          box-shadow: 0 0 14px rgba(79,140,255,0.2);
        }
        .assistant-name { font-size: 13px; font-weight: 500; }
        .msg-body { display:flex; flex-direction: column; gap: 12px; padding-left: 30px; max-width: 100%; }
        .msg-actions { display:flex; gap: 4px; margin-top: 4px; }
        .msg-actions button {
          display:inline-flex; align-items:center; gap: 5px;
          padding: 3px 8px; background: transparent; border: 1px solid transparent;
          color: var(--text-dim); border-radius: 6px;
          font-size: 11px; cursor: pointer;
          transition: all 140ms ease;
        }
        .msg-actions button:hover { color: var(--text); border-color: var(--border); background: #101721; }
        .block-text { font-size: 13.5px; line-height: 1.6; color: var(--text); text-wrap: pretty; }
        .block-refs { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: #0E141B; }
        .refs-head { display:flex; align-items:center; gap: 6px; padding: 8px 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 11.5px; background: #0C1219; }
        .refs-head svg { color: var(--accent-2); }
        .ref-item {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto 14px;
          row-gap: 2px; column-gap: 10px;
          align-items: center;
          width: 100%;
          padding: 10px 12px;
          background: transparent; border: 0;
          color: var(--text); cursor: pointer;
          text-align: left;
          border-bottom: 1px solid var(--border);
          transition: background 140ms ease;
        }
        .ref-item:last-child { border-bottom: 0; }
        .ref-item:hover { background: #111823; }
        .ref-path { font-size: 12px; color: var(--text); }
        .ref-lines { font-size: 11px; color: var(--accent-2); }
        .ref-why { grid-column: 1 / span 2; color: var(--text-muted); font-size: 11.5px; }
        .ref-chev { grid-row: 1 / span 2; grid-column: 3; color: var(--text-dim); }
        .block-list { margin: 0; padding-left: 18px; color: var(--text); font-size: 13.5px; line-height: 1.6; }
        .block-list li::marker { color: var(--accent-2); }
        .block-callout {
          display: grid; grid-template-columns: 16px 1fr; gap: 10px;
          padding: 10px 14px;
          border: 1px solid color-mix(in oklab, var(--c) 30%, var(--border));
          background: color-mix(in oklab, var(--c) 6%, transparent);
          border-radius: 10px;
          color: var(--text);
          font-size: 13px; line-height: 1.5;
        }
        .block-callout > svg { color: var(--c); margin-top: 3px; }
        .typing { display:flex; align-items:center; gap: 10px; color: var(--text-muted); font-size: 12px; }
        .dots { display:flex; gap: 4px; }
        .dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); opacity: 0.5; animation: bounce 1.2s infinite; }
        .dots span:nth-child(2) { animation-delay: 0.15s; }
        .dots span:nth-child(3) { animation-delay: 0.3s; }
        .thinking { color: var(--text-dim); font-size: 11px; }
      `}</style>
    </div>
  );
}
