import Groq from 'groq-sdk';
import fs from 'fs/promises';
import path from 'path';
import { classifyQuery } from './queryClassifier.js';
import { keywordSearch } from './keywordSearch.js';
import { getRepoPath } from './repoManager.js';
import { parseRepository } from './fileParser.js';
import { chunkRepository } from './chunker.js';
import { VectorStore } from './vectorStore.js';
import { generateEmbedding } from './embeddings.js';

let groq;
function getClient(apiKey) {
  if (apiKey) return new Groq({ apiKey });
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

const SYSTEM_PROMPTS = {
  explain: `You are a code explanation expert. You are given code snippets from a repository. Explain the code clearly. Reference specific functions, variables, and logic. Always mention which file the code is from. Be concise but thorough.`,
  locate: `You are a code search assistant. You are given code snippets from a repository. Help the user find where specific functionality is implemented. Point to exact file paths and function names.`,
  debug: `You are a debugging expert. You are given code snippets from a repository. Identify potential bugs, issues, or improvements. Explain the root cause and suggest specific fixes.`,
  summarize: `You are a codebase analyst giving a project-wide overview. You are given the README, package.json, file tree, and a sample of code chunks from across the repository. Produce a holistic summary covering: the project's purpose, the tech stack, top-level architecture (frontend/backend/services), key directories and what they contain, main data flow, and notable features. DO NOT zoom into one file or treat any single chunk as the whole project. The chunks are samples, not the entire codebase. Structure the answer with clear headings.`,
  trace: `You are a code flow analyst. You are given code snippets from a repository. Trace the execution flow across files. Explain the sequence of function calls step by step.`,
  dependency: `You are a dependency analyst. You are given code snippets from a repository. Analyze imports, dependencies, and relationships between modules.`,
};

const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', '__pycache__', '.venv', 'venv', '.cache', 'dist', 'build', 'repos']);

async function readSafe(p, max = 6000) {
  try {
    const c = await fs.readFile(p, 'utf-8');
    return c.length > max ? c.slice(0, max) + '\n... [truncated]' : c;
  } catch {
    return null;
  }
}

async function buildFileTree(repoPath, maxEntries = 80) {
  const entries = [];
  async function walk(dir, depth, prefix) {
    if (depth > 2 || entries.length >= maxEntries) return;
    let items;
    try { items = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    items.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const it of items) {
      if (entries.length >= maxEntries) return;
      if (it.name.startsWith('.')) continue;
      if (it.isDirectory() && SKIP_DIRS.has(it.name)) continue;
      const rel = prefix ? `${prefix}/${it.name}` : it.name;
      entries.push(it.isDirectory() ? `${rel}/` : rel);
      if (it.isDirectory()) await walk(path.join(dir, it.name), depth + 1, rel);
    }
  }
  await walk(repoPath, 0, '');
  return entries.join('\n');
}

async function buildOverviewContext(repoPath, repoId) {
  const parts = [];

  const readme = await readSafe(path.join(repoPath, 'README.md'))
    || await readSafe(path.join(repoPath, 'readme.md'))
    || await readSafe(path.join(repoPath, 'Readme.md'));
  if (readme) parts.push(`--- README.md ---\n${readme}`);

  const pkg = await readSafe(path.join(repoPath, 'package.json'), 3000);
  if (pkg) parts.push(`--- package.json ---\n${pkg}`);

  for (const sub of ['client', 'server', 'frontend', 'backend', 'app', 'src']) {
    const subPkg = await readSafe(path.join(repoPath, sub, 'package.json'), 2000);
    if (subPkg) parts.push(`--- ${sub}/package.json ---\n${subPkg}`);
  }

  const tree = await buildFileTree(repoPath);
  if (tree) parts.push(`--- File tree (top-level) ---\n${tree}`);

  try {
    const files = await parseRepository(repoPath);
    const chunks = chunkRepository(files);
    const seenFiles = new Set();
    const sample = [];
    for (const c of chunks) {
      const fp = c.metadata.filePath;
      if (seenFiles.has(fp)) continue;
      seenFiles.add(fp);
      sample.push(c);
      if (sample.length >= 12) break;
    }
    if (sample.length > 0) {
      const blocks = sample.map(c => {
        const m = c.metadata;
        const body = c.content.length > 600 ? c.content.slice(0, 600) + '\n... [truncated]' : c.content;
        return `--- ${m.filePath} | ${m.name} (L${m.startLine}-${m.endLine}) ---\n${body}`;
      });
      parts.push(`--- Sample chunks across repo ---\n${blocks.join('\n\n')}`);
    }
  } catch {}

  return parts.join('\n\n');
}

async function queryWithGroq(repoId, question, options = {}) {
  const classification = classifyQuery(question);
  const repoPath = await getRepoPath(repoId);
  const topK = options.maxResults || 8;
  const geminiKey = options.geminiKey || process.env.GEMINI_API_KEY;

  if (classification.type === 'summarize') {
    const overviewContext = await buildOverviewContext(repoPath, repoId);
    const systemPrompt = SYSTEM_PROMPTS.summarize;

    const response = await getClient(options.groqKey).chat.completions.create({
      model: options.model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Question: ${question}\n\nProject context (README, package.json, file tree, code samples):\n\n${overviewContext}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return {
      answer: response.choices[0].message.content,
      sources: [],
      queryType: classification.type,
      confidence: classification.confidence,
      searchMode: 'overview',
    };
  }

  let results = [];
  let searchMode = 'keyword';

  if (geminiKey) {
    const store = new VectorStore(repoId);
    const hasEmbeddings = await store.exists();

    if (hasEmbeddings) {
      try {
        await store.load();
        const queryVec = await generateEmbedding(question, geminiKey);
        results = store.search(queryVec, topK);
        searchMode = 'semantic';
      } catch {}
    }
  }

  if (results.length === 0) {
    results = await keywordSearch(repoPath, question, topK);
    searchMode = 'keyword';
  }

  if (results.length === 0) {
    const files = await parseRepository(repoPath);
    const chunks = chunkRepository(files);
    const seen = new Set();
    for (const chunk of chunks) {
      const file = chunk.metadata.filePath;
      if (seen.has(file)) continue;
      seen.add(file);
      results.push({ chunk, score: 0 });
      if (results.length >= topK) break;
    }
    searchMode = 'full-scan';
  }

  const sources = results.map(r => ({
    filePath: r.chunk.metadata.filePath,
    name: r.chunk.metadata.name,
    startLine: r.chunk.metadata.startLine,
    endLine: r.chunk.metadata.endLine,
    score: r.score,
  }));

  const PER_CHUNK_CHAR_LIMIT = 1800;
  const TOTAL_CONTEXT_CHAR_LIMIT = 24000;

  const trimmed = [];
  let used = 0;
  for (const r of results) {
    const m = r.chunk.metadata;
    let body = r.chunk.content;
    if (body.length > PER_CHUNK_CHAR_LIMIT) {
      body = body.slice(0, PER_CHUNK_CHAR_LIMIT) + '\n... [truncated]';
    }
    const block = `--- File: ${m.filePath} | Function: ${m.name} | Lines: ${m.startLine}-${m.endLine} ---\n${body}`;
    if (used + block.length > TOTAL_CONTEXT_CHAR_LIMIT) break;
    trimmed.push(block);
    used += block.length;
  }
  const context = trimmed.join('\n\n');

  const systemPrompt = SYSTEM_PROMPTS[classification.type] || SYSTEM_PROMPTS.explain;

  const response = await getClient(options.groqKey).chat.completions.create({
    model: options.model || 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Question: ${question}\n\nRelevant code from the repository:\n\n${context}` },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  return {
    answer: response.choices[0].message.content,
    sources,
    queryType: classification.type,
    confidence: classification.confidence,
    searchMode,
  };
}

export { queryWithGroq };
