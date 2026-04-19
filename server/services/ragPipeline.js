import OpenAI from 'openai';
import { VectorStore } from './vectorStore.js';
import { generateEmbedding } from './embeddings.js';
import { classifyQuery } from './queryClassifier.js';

let openai;
function getClient() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

const SYSTEM_PROMPTS = {
  explain: `You are a code explanation expert. Given code snippets from a repository, explain the code clearly and concisely. Reference specific functions, variables, and logic. Always mention which file the code is from.`,

  locate: `You are a code search assistant. Given code snippets from a repository, help the user find where specific functionality is implemented. Point to exact file paths, function names, and line numbers.`,

  debug: `You are a debugging expert. Given code snippets from a repository, identify potential bugs, issues, or improvements. Explain the root cause and suggest specific fixes with code examples.`,

  summarize: `You are a codebase analyst. Given code snippets from a repository, provide a high-level overview of the architecture, key components, and how they interact.`,

  trace: `You are a code flow analyst. Given code snippets from a repository, trace the execution flow across files. Explain the sequence of function calls and data transformations step by step.`,

  dependency: `You are a dependency analyst. Given code snippets from a repository, analyze imports, dependencies, and relationships between modules. Explain how components are connected.`
};

async function queryRAG(repoId, question, topK = 8) {
  const classification = classifyQuery(question);

  const store = new VectorStore(repoId);
  try {
    await store.load();
  } catch (err) {
    return {
      answer: 'This repository has not been embedded yet. The OpenAI API key may be missing or the embedding step failed. Please check your API key and try reconnecting the repository.',
      sources: [],
      queryType: classification.type,
      confidence: classification.confidence,
    };
  }

  const queryEmbedding = await generateEmbedding(question);
  const results = store.search(queryEmbedding, topK);

  if (results.length === 0) {
    return {
      answer: 'No relevant code found in the repository for this query.',
      sources: [],
      queryType: classification.type
    };
  }

  const context = results.map((r, i) => {
    const m = r.chunk.metadata;
    return `--- Source ${i + 1}: ${m.filePath} (${m.name}, lines ${m.startLine}-${m.endLine}) ---\n${r.chunk.content}`;
  }).join('\n\n');

  const systemPrompt = SYSTEM_PROMPTS[classification.type] || SYSTEM_PROMPTS.explain;

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Question: ${question}\n\nRelevant code from the repository:\n\n${context}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  const sources = results.map(r => ({
    filePath: r.chunk.metadata.filePath,
    name: r.chunk.metadata.name,
    startLine: r.chunk.metadata.startLine,
    endLine: r.chunk.metadata.endLine,
    score: r.score
  }));

  return {
    answer: response.choices[0].message.content,
    sources,
    queryType: classification.type,
    confidence: classification.confidence
  };
}

export { queryRAG };
