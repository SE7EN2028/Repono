import Groq from 'groq-sdk';
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
  summarize: `You are a codebase analyst. You are given code snippets from a repository. Provide a high-level overview of the architecture, key components, and how they interact.`,
  trace: `You are a code flow analyst. You are given code snippets from a repository. Trace the execution flow across files. Explain the sequence of function calls step by step.`,
  dependency: `You are a dependency analyst. You are given code snippets from a repository. Analyze imports, dependencies, and relationships between modules.`,
};

async function queryWithGroq(repoId, question, options = {}) {
  const classification = classifyQuery(question);
  const repoPath = await getRepoPath(repoId);
  const topK = options.maxResults || 8;
  const geminiKey = options.geminiKey || process.env.GEMINI_API_KEY;

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
      } catch (err) {
        console.log('Semantic search failed, falling back to keyword:', err.message.slice(0, 80));
      }
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

  const context = results.map((r, i) => {
    const m = r.chunk.metadata;
    return `--- File: ${m.filePath} | Function: ${m.name} | Lines: ${m.startLine}-${m.endLine} ---\n${r.chunk.content}`;
  }).join('\n\n');

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
