import { parseRepository } from './fileParser.js';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all', 'use'];

const AUTH_WORDS = ['auth', 'jwt', 'verify', 'protect', 'requireauth', 'isauth', 'authenticate', 'authorize', 'token'];
const VALIDATE_WORDS = ['validate', 'check', 'sanitize', 'schema'];
const LOG_WORDS = ['log', 'morgan'];
const SECURITY_WORDS = ['cors', 'helmet', 'rate', 'limit', 'throttle'];
const PARSE_WORDS = ['parse', 'body', 'cookie', 'multer', 'upload'];

const DB_HINTS = [
  { match: /\bmongoose\b|\.findOne\(|\.findById\(|\bSchema\(/i, kind: 'mongo' },
  { match: /\bprisma\b/i, kind: 'prisma' },
  { match: /\bsequelize\b/i, kind: 'sql' },
  { match: /\bpg\b|\bPool\(/i, kind: 'postgres' },
  { match: /\bredis\b/i, kind: 'redis' },
  { match: /\bknex\b/i, kind: 'sql' },
];

function classifyHandler(name, isLast) {
  const lower = name.toLowerCase();
  if (AUTH_WORDS.some(w => lower.includes(w))) return 'auth';
  if (VALIDATE_WORDS.some(w => lower.includes(w))) return 'validation';
  if (LOG_WORDS.some(w => lower.includes(w))) return 'logging';
  if (SECURITY_WORDS.some(w => lower.includes(w))) return 'security';
  if (PARSE_WORDS.some(w => lower.includes(w))) return 'parsing';
  return isLast ? 'handler' : 'middleware';
}

function detectDb(content) {
  const hits = [];
  for (const h of DB_HINTS) {
    if (h.match.test(content)) hits.push(h.kind);
  }
  return [...new Set(hits)];
}

function findMatchingParen(text, openIdx) {
  let depth = 0;
  let inStr = null;
  let inTpl = false;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    const prev = text[i - 1];
    if (inStr) {
      if (ch === inStr && prev !== '\\') inStr = null;
      continue;
    }
    if (inTpl) {
      if (ch === '`' && prev !== '\\') inTpl = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = ch; continue; }
    if (ch === '`') { inTpl = true; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitArgs(argsText) {
  const parts = [];
  let depth = 0;
  let inStr = null;
  let inTpl = false;
  let buf = '';
  for (let i = 0; i < argsText.length; i++) {
    const ch = argsText[i];
    const prev = argsText[i - 1];
    if (inStr) {
      buf += ch;
      if (ch === inStr && prev !== '\\') inStr = null;
      continue;
    }
    if (inTpl) {
      buf += ch;
      if (ch === '`' && prev !== '\\') inTpl = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = ch; buf += ch; continue; }
    if (ch === '`') { inTpl = true; buf += ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) { parts.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function nameFromArg(arg) {
  const trimmed = arg.trim();
  if (/^['"`]/.test(trimmed)) return null;
  if (/^(async\s*)?\(?\s*\w*\s*\)?\s*=>/.test(trimmed)) return 'anonymous';
  if (/^(async\s+)?function\b/.test(trimmed)) return 'anonymous';
  const callMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s*\(/);
  if (callMatch) return callMatch[1];
  const dotMatch = trimmed.match(/^([A-Za-z_$][\w$.]*)/);
  if (dotMatch) {
    const parts = dotMatch[1].split('.');
    return parts[parts.length - 1];
  }
  return 'anonymous';
}

function snippet(content, startIdx, endIdx) {
  const before = content.lastIndexOf('\n', startIdx);
  const after = content.indexOf('\n', endIdx);
  const start = before === -1 ? 0 : before + 1;
  const stop = after === -1 ? content.length : after;
  return content.slice(start, stop).trim();
}

function lineOf(content, idx) {
  let line = 1;
  for (let i = 0; i < idx && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

function parseFile(file) {
  const routes = [];
  const content = file.content;
  const dbKinds = detectDb(content);

  const callRegex = /\b(\w+)\.(get|post|put|patch|delete|all|use)\s*\(/g;
  let match;
  while ((match = callRegex.exec(content)) !== null) {
    const method = match[2];
    const openIdx = match.index + match[0].length - 1;
    const closeIdx = findMatchingParen(content, openIdx);
    if (closeIdx === -1) continue;

    const argsText = content.slice(openIdx + 1, closeIdx);
    const args = splitArgs(argsText);
    if (args.length < 2) continue;

    const pathArg = args[0];
    const pathMatch = pathArg.match(/^['"`]([^'"`]*)['"`]$/);
    if (!pathMatch) continue;
    const routePath = pathMatch[1];
    if (!routePath.startsWith('/')) continue;

    const handlerArgs = args.slice(1);
    const steps = handlerArgs.map((a, i) => {
      const name = nameFromArg(a) || 'anonymous';
      const isLast = i === handlerArgs.length - 1;
      return {
        type: classifyHandler(name, isLast),
        name,
      };
    });

    if (steps.length > 0 && dbKinds.length > 0) {
      steps[steps.length - 1].db = dbKinds;
    }

    routes.push({
      id: `${file.path}:${match.index}`,
      method: method.toUpperCase(),
      path: routePath,
      file: file.path,
      line: lineOf(content, match.index),
      code: snippet(content, match.index, closeIdx),
      steps,
    });
  }

  return routes;
}

async function parseApiFlow(repoPath) {
  const files = await parseRepository(repoPath);
  const jsFiles = files.filter(f =>
    f.language === 'javascript' || f.language === 'typescript'
  );

  const allRoutes = [];
  for (const file of jsFiles) {
    const found = parseFile(file);
    allRoutes.push(...found);
  }

  const byMethod = {};
  for (const r of allRoutes) {
    byMethod[r.method] = (byMethod[r.method] || 0) + 1;
  }

  const middlewareCount = {};
  for (const r of allRoutes) {
    for (const s of r.steps) {
      if (s.type !== 'handler') {
        middlewareCount[s.name] = (middlewareCount[s.name] || 0) + 1;
      }
    }
  }

  return {
    routes: allRoutes,
    summary: {
      total: allRoutes.length,
      byMethod,
      filesScanned: jsFiles.length,
      topMiddleware: Object.entries(middlewareCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    },
  };
}

export { parseApiFlow };
