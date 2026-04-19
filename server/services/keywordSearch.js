import { parseRepository } from './fileParser.js';
import { chunkRepository } from './chunker.js';

async function keywordSearch(repoPath, question, topK = 6) {
  const files = await parseRepository(repoPath);
  const chunks = chunkRepository(files);

  const words = extractKeywords(question);

  const scored = chunks.map(chunk => {
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

  return scored
    .filter(s => s.score > 0)
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
    return "No matching code found. Try different keywords like function names, file names, or specific terms from the code.";
  }

  const questionLower = question.toLowerCase();
  let answer = '';

  const isExplain = /what does|how does|explain|describe|purpose|mean/.test(questionLower);
  const isLocate = /where is|find|locate|which file|implemented/.test(questionLower);
  const isDebug = /bug|error|fix|issue|wrong|problem/.test(questionLower);

  if (isLocate) {
    answer += `Found in **${results.length}** locations:\n\n`;
    results.forEach((r) => {
      const m = r.chunk.metadata;
      const desc = describeChunk(r.chunk);
      answer += `**${m.filePath}** → \`${m.name}\` (lines ${m.startLine}–${m.endLine})\n`;
      if (desc) answer += `${desc}\n`;
      answer += '\n';
    });
  } else if (isExplain) {
    const top = results[0];
    const m = top.chunk.metadata;
    const desc = describeChunk(top.chunk);
    answer += `**${m.filePath}** → \`${m.name}\`\n\n`;
    if (desc) answer += `${desc}\n\n`;
    answer += formatCodeSnippet(top.chunk, question);
    if (results.length > 1) {
      answer += '\n\n**Also found in:**\n';
      results.slice(1, 4).forEach(r => {
        const d = describeChunk(r.chunk);
        answer += `- \`${r.chunk.metadata.name}\` in **${r.chunk.metadata.filePath}**`;
        if (d) answer += ` — ${d}`;
        answer += '\n';
      });
    }
  } else if (isDebug) {
    answer += `Relevant code for debugging:\n\n`;
    results.slice(0, 3).forEach((r, i) => {
      const m = r.chunk.metadata;
      const desc = describeChunk(r.chunk);
      answer += `**${i + 1}. ${m.filePath}** → \`${m.name}\`\n`;
      if (desc) answer += `${desc}\n`;
      answer += formatCodeSnippet(r.chunk, question);
      answer += '\n\n';
    });
  } else {
    results.slice(0, 4).forEach((r, i) => {
      const m = r.chunk.metadata;
      const desc = describeChunk(r.chunk);
      answer += `**${i + 1}. ${m.filePath}** → \`${m.name}\` (lines ${m.startLine}–${m.endLine})\n`;
      if (desc) answer += `${desc}\n`;
      answer += formatCodeSnippet(r.chunk, question);
      answer += '\n\n';
    });
  }

  return answer.trim();
}

function describeChunk(chunk) {
  const code = chunk.content;
  const lines = code.split('\n');
  const parts = [];

  const asyncMatch = code.match(/async\s+function\s+(\w+)|async\s+(\w+)\s*\(/);
  if (asyncMatch) {
    const name = asyncMatch[1] || asyncMatch[2];
    parts.push(`\`${name}\` is an **async function** (uses await for asynchronous operations)`);
  }

  const awaits = code.match(/await\s+[\w.]+/g);
  if (awaits) {
    const unique = [...new Set(awaits.map(a => a.replace('await ', '')))];
    parts.push(`Awaits: ${unique.map(a => '`' + a + '`').join(', ')}`);
  }

  const imports = code.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
  if (imports && imports.length > 0) {
    parts.push(`Imports from ${imports.length} module(s)`);
  }

  const exports = code.match(/export\s+(default\s+)?(?:function|class|const|let)\s+(\w+)/g);
  if (exports) {
    parts.push(`Exports: ${exports.map(e => '`' + e.split(/\s+/).pop() + '`').join(', ')}`);
  }

  const tryCatch = /try\s*\{/.test(code);
  if (tryCatch) parts.push('Has error handling (try/catch)');

  const returns = code.match(/return\s+.+/g);
  if (returns && returns.length > 0) {
    const lastReturn = returns[returns.length - 1].trim().slice(0, 60);
    parts.push(`Returns: \`${lastReturn}\``);
  }

  return parts.join('. ');
}

function formatCodeSnippet(chunk, question) {
  const keywords = extractKeywords(question);
  const lines = chunk.content.split('\n');

  const relevantLines = [];
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (keywords.some(k => lower.includes(k))) {
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length, i + 3);
      for (let j = start; j < end; j++) {
        if (!relevantLines.includes(j)) relevantLines.push(j);
      }
    }
  }

  if (relevantLines.length === 0) {
    const preview = lines.slice(0, 6).join('\n');
    return '```\n' + preview + '\n```';
  }

  relevantLines.sort((a, b) => a - b);

  let snippet = '';
  let lastLine = -2;
  for (const idx of relevantLines) {
    if (idx - lastLine > 1 && lastLine >= 0) snippet += '  ...\n';
    snippet += lines[idx] + '\n';
    lastLine = idx;
  }

  return '```\n' + snippet.trimEnd() + '\n```';
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
  'does', 'work', 'works', 'code', 'function', 'file',
]);

export { keywordSearch, buildAnswer };
