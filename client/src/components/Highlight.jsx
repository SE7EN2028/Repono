import { useMemo, useState } from 'react';
import * as I from './Icons';

const TOKEN_COLORS = {
  keyword: "#7AA2FF",
  type: "#E5C07B",
  string: "#9FE6A0",
  number: "#D19AFF",
  comment: "#5C6878",
  fn: "#6FB4FF",
  punct: "#8B97A8",
  prop: "#E6EDF3",
  tag: "#FF7BB0",
  builtin: "#4FD1C5",
  warn: "#F5B544",
};

const KEYWORDS = new Set([
  "const","let","var","function","return","if","else","for","while","switch","case","break",
  "continue","await","async","new","typeof","instanceof","import","export","from","as","default",
  "class","extends","implements","interface","type","enum","public","private","protected","readonly",
  "true","false","null","undefined","this","void","throw","try","catch","finally","in","of"
]);
const BUILTINS = new Set(["Promise","Array","Object","String","Number","Boolean","Map","Set","JSON","Math","console","Date"]);

function tokenize(src) {
  const out = [];
  let i = 0;
  const n = src.length;
  const push = (type, text) => out.push({ type, text });
  while (i < n) {
    const c = src[i];
    if (c === "/" && src[i+1] === "/") {
      let j = i; while (j < n && src[j] !== "\n") j++;
      push("comment", src.slice(i, j)); i = j; continue;
    }
    if (c === "/" && src[i+1] === "*") {
      let j = i+2; while (j < n && !(src[j] === "*" && src[j+1] === "/")) j++;
      j = Math.min(n, j+2);
      push("comment", src.slice(i, j)); i = j; continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      let j = i+1;
      while (j < n) {
        if (src[j] === "\\") { j += 2; continue; }
        if (src[j] === q) { j++; break; }
        j++;
      }
      push("string", src.slice(i, j)); i = j; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i; while (j < n && /[0-9_.]/.test(src[j])) j++;
      push("number", src.slice(i, j)); i = j; continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      let type = "plain";
      if (KEYWORDS.has(word)) type = "keyword";
      else if (BUILTINS.has(word)) type = "builtin";
      else if (/^[A-Z]/.test(word)) type = "type";
      else if (src[j] === "(") type = "fn";
      else if (src[i-1] === ".") type = "prop";
      push(type, word); i = j; continue;
    }
    if (/\s/.test(c)) {
      let j = i; while (j < n && /\s/.test(src[j])) j++;
      push("ws", src.slice(i, j)); i = j; continue;
    }
    if (c === "⚠") { push("warn", c); i++; continue; }
    push("punct", c); i++;
  }
  return out;
}

export function Highlight({ code }) {
  const tokens = useMemo(() => tokenize(code), [code]);
  return (
    <>
      {tokens.map((t, i) => {
        if (t.type === "ws" || t.type === "plain") return <span key={i}>{t.text}</span>;
        const color = TOKEN_COLORS[t.type] || "inherit";
        return <span key={i} style={{ color }}>{t.text}</span>;
      })}
    </>
  );
}

export function CodeBlock({ code, startLine = 1, highlightLines = [], fileHeader, copyable = true, dense = false }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const hl = new Set(highlightLines);
  return (
    <div className="codeblock">
      {fileHeader && (
        <div className="codeblock-head">
          <div className="codeblock-file mono">{fileHeader}</div>
          {copyable && (
            <button className="icon-btn small" onClick={() => {
              navigator.clipboard?.writeText(code).catch(()=>{});
              setCopied(true); setTimeout(()=>setCopied(false), 1200);
            }}>
              {copied ? <I.Check size={13}/> : <I.Copy size={13}/>}
              <span style={{marginLeft:6, fontSize:11}}>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}
        </div>
      )}
      <div className={"codeblock-body" + (dense ? " dense" : "")}>
        <pre className="mono">
          {lines.map((line, idx) => {
            const ln = startLine + idx;
            const isHl = hl.has(idx + 1) || hl.has(ln);
            return (
              <div key={idx} className={"code-line" + (isHl ? " hl" : "")}>
                <span className="code-ln">{ln}</span>
                <span className="code-src"><Highlight code={line || " "} /></span>
              </div>
            );
          })}
        </pre>
      </div>
      <style>{`
        .codeblock {
          border: 1px solid var(--border);
          border-radius: 12px;
          background: linear-gradient(180deg, #0E141B 0%, #0B1118 100%);
          overflow: hidden;
        }
        .codeblock-head {
          display:flex; align-items:center; justify-content:space-between;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border);
          background: #0C1219;
        }
        .codeblock-file { color: var(--text-muted); font-size: 12px; letter-spacing: 0.01em; }
        .codeblock-body { overflow:auto; max-height: 420px; }
        .codeblock-body.dense { max-height: none; }
        .codeblock-body pre { margin:0; padding: 10px 0; font-size: 12.5px; line-height: 1.6; }
        .code-line {
          display: grid;
          grid-template-columns: 48px 1fr;
          padding: 0 14px 0 0;
          position: relative;
        }
        .code-line.hl {
          background: linear-gradient(90deg, rgba(245,181,68,0.08), rgba(245,181,68,0.02));
          box-shadow: inset 2px 0 0 rgba(245,181,68,0.8);
        }
        .code-ln {
          text-align: right;
          padding-right: 14px;
          color: var(--text-dim);
          user-select: none;
          font-variant-numeric: tabular-nums;
        }
        .code-src { white-space: pre; }
      `}</style>
    </div>
  );
}
