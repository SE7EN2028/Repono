import { parseRepository } from './fileParser.js';
import { chunkRepository } from './chunker.js';

const JUNK_FILES = new Set([
  'package.json', 'package-lock.json', 'tsconfig.json',
  'readme.md', 'changelog.md', 'license', 'license.md',
  '.gitignore', '.eslintrc', '.prettierrc', 'yarn.lock',
  'pnpm-lock.yaml', '.babelrc', 'jest.config.js',
]);

const JUNK_EXTENSIONS = new Set([
  '.json', '.md', '.txt', '.yml', '.yaml', '.toml',
  '.xml', '.lock', '.css', '.scss', '.svg',
]);

function isCodeFile(filePath) {
  const name = filePath.split('/').pop().toLowerCase();
  if (JUNK_FILES.has(name)) return false;
  const ext = '.' + name.split('.').pop();
  if (JUNK_EXTENSIONS.has(ext)) return false;
  return true;
}

async function keywordSearch(repoPath, question, topK = 6) {
  const files = await parseRepository(repoPath);
  const chunks = chunkRepository(files);
  const words = extractKeywords(question);

  const scored = chunks
    .filter(chunk => isCodeFile(chunk.metadata.filePath))
    .map(chunk => {
      const text = chunk.content.toLowerCase();
      const path = chunk.metadata.filePath.toLowerCase();
      const name = chunk.metadata.name.toLowerCase();
      let score = 0;

      for (const word of words) {
        if (name === word) score += 10;
        else if (name.includes(word)) score += 5;
        if (path.includes(word)) score += 3;

        const lines = text.split('\n');
        for (const line of lines) {
          if (line.includes(word)) score += 1;
        }
      }

      if (chunk.metadata.tokenEstimate > 500) score *= 0.7;
      if (chunk.metadata.tokenEstimate < 50) score *= 0.5;

      return { chunk, score };
    });

  const filtered = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  const byFile = {};
  for (const item of filtered) {
    const file = item.chunk.metadata.filePath;
    if (!byFile[file]) {
      byFile[file] = item;
    } else if (item.chunk.metadata.tokenEstimate > byFile[file].chunk.metadata.tokenEstimate) {
      byFile[file] = { ...item, score: Math.max(item.score, byFile[file].score) };
    }
  }

  return Object.values(byFile)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function extractKeywords(question) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9_.\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !STOP_WORDS.has(w));
}

function buildAnswer(question, results) {
  if (results.length === 0) {
    return "No matching code found. Try using specific function names, file names, or technical terms.";
  }

  let answer = '';

  results.slice(0, 4).forEach((r, i) => {
    const m = r.chunk.metadata;
    const analysis = analyzeCode(r.chunk);

    answer += `### ${m.filePath}\n`;
    answer += `**\`${m.name}\`** (lines ${m.startLine}–${m.endLine})\n\n`;

    if (analysis.length > 0) {
      answer += analysis.join('\n') + '\n\n';
    }

    const snippet = getRelevantSnippet(r.chunk, question);
    if (snippet) {
      answer += '```\n' + snippet + '\n```\n\n';
    }
  });

  return answer.trim();
}

function analyzeCode(chunk) {
  const code = chunk.content;
  const points = [];

  const funcMatch = code.match(/(?:async\s+)?function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
  if (funcMatch) {
    const name = funcMatch[1] || funcMatch[2];
    const isAsync = /async/.test(code.slice(0, code.indexOf(name)));
    points.push(`Defines ${isAsync ? 'async ' : ''}function **\`${name}\`**`);
  }

  const params = code.match(/function\s+\w+\s*\(([^)]*)\)|=>\s*\{|(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)/);
  if (params) {
    const paramStr = params[1] || params[3];
    if (paramStr && paramStr.trim()) {
      points.push(`Parameters: \`${paramStr.trim()}\``);
    }
  }

  const awaits = code.match(/await\s+([\w.]+(?:\([^)]*\))?)/g);
  if (awaits) {
    const calls = [...new Set(awaits.map(a => a.replace('await ', '').replace(/\(.*/, '()')))];
    points.push(`Awaits: ${calls.map(c => '`' + c + '`').join(', ')}`);
  }

  const conditions = (code.match(/if\s*\(/g) || []).length;
  if (conditions > 0) points.push(`${conditions} conditional branch${conditions > 1 ? 'es' : ''}`);

  const tryCatch = /try\s*\{/.test(code);
  if (tryCatch) points.push('Has error handling (try/catch)');

  const returnMatch = code.match(/return\s+(\{[^}]+\}|[\w.]+(?:\([^)]*\))?)/);
  if (returnMatch) {
    const ret = returnMatch[1].slice(0, 50);
    points.push(`Returns: \`${ret}\``);
  }

  const imports = code.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
  if (imports) {
    const deps = imports.map(i => i.match(/from\s+['"]([^'"]+)['"]/)[1]);
    points.push(`Depends on: ${deps.map(d => '`' + d + '`').join(', ')}`);
  }

  return points;
}

function getRelevantSnippet(chunk, question) {
  const keywords = extractKeywords(question);
  const lines = chunk.content.split('\n');

  const matchedLines = [];
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (keywords.some(k => lower.includes(k))) {
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length, i + 3);
      for (let j = start; j < end; j++) {
        if (!matchedLines.includes(j)) matchedLines.push(j);
      }
    }
  }

  if (matchedLines.length === 0) {
    return lines.slice(0, 12).join('\n');
  }

  matchedLines.sort((a, b) => a - b);

  let snippet = '';
  let lastLine = -2;
  for (const idx of matchedLines) {
    if (idx - lastLine > 1 && lastLine >= 0) snippet += '  ...\n';
    snippet += lines[idx] + '\n';
    lastLine = idx;
  }

  return snippet.trimEnd();
}

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
  'in', 'with', 'to', 'for', 'of', 'not', 'no', 'can', 'had', 'has',
  'was', 'were', 'been', 'being', 'have', 'are', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'this',
  'that', 'these', 'those', 'what', 'how', 'why', 'where', 'when',
  'who', 'whom', 'its', 'it', 'they', 'them', 'their', 'you', 'your',
  'from', 'about', 'into', 'through', 'during', 'before', 'after',
  'tell', 'me', 'show', 'give', 'get', 'use', 'used', 'using',
  'does', 'work', 'works', 'please', 'entire', 'everything',
]);

export { keywordSearch, buildAnswer };
