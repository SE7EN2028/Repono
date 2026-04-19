import { Router } from 'express';
import { queryRAG } from '../services/ragPipeline.js';
import { classifyQuery } from '../services/queryClassifier.js';
import { keywordSearch, buildAnswer } from '../services/keywordSearch.js';
import { searchWeb, extractConcept } from '../services/webSearch.js';
import { getRepoPath } from '../services/repoManager.js';

const router = Router();

router.post('/ask', async (req, res) => {
  const { question, repoId } = req.body;

  if (!question || !repoId) {
    return res.status(400).json({ error: 'Question and repoId are required' });
  }

  const classification = classifyQuery(question);

  if (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
    try {
      const result = await queryRAG(repoId, question);
      if (result.answer && !result.answer.includes('not been embedded')) {
        res.json(result);
        return;
      }
    } catch (err) {
      console.log('RAG failed, using keyword search:', err.message.slice(0, 100));
    }
  }

  try {
    const repoPath = await getRepoPath(repoId);

    const results = await keywordSearch(repoPath, question);

    const concept = extractConcept(question) || '';
    const isConceptQuestion = /what (?:is|does|are)|explain|how does|describe|tell me about/i.test(question);
    const isOwnFunction = results.length > 0 && results[0].chunk.metadata.name.toLowerCase() === concept.toLowerCase();

    const needsWebSearch = isConceptQuestion && !isOwnFunction;
    const webResults = needsWebSearch ? await fetchWebContext(question) : [];

    const answer = buildSmartAnswer(question, results, webResults, classification.type);

    const sources = results.map(r => ({
      filePath: r.chunk.metadata.filePath,
      name: r.chunk.metadata.name,
      startLine: r.chunk.metadata.startLine,
      endLine: r.chunk.metadata.endLine,
      score: r.score,
    }));

    res.json({
      answer,
      sources,
      queryType: classification.type,
      confidence: classification.confidence,
      mode: webResults.length > 0 ? 'keyword+web' : 'keyword',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function fetchWebContext(question) {
  const concept = extractConcept(question);
  if (!concept) return [];

  try {
    return await searchWeb(concept);
  } catch {
    return [];
  }
}

function buildSmartAnswer(question, codeResults, webResults, queryType) {
  let answer = '';

  if (webResults.length > 0 && queryType === 'explain') {
    const webInfo = webResults[0];
    if (webInfo.text) {
      answer += `**${webInfo.title || 'Explanation'}:** ${webInfo.text}\n\n`;
    }
  }

  if (codeResults.length > 0) {
    if (webResults.length > 0) {
      answer += `**In your codebase:**\n\n`;
    }
    answer += buildAnswer(question, codeResults);
  }

  if (webResults.length > 1 && queryType === 'explain') {
    answer += '\n\n---\n**Learn more:**\n';
    webResults.slice(0, 3).forEach(w => {
      if (w.text && w.text.length > 20) {
        answer += `- ${w.text.slice(0, 120)}${w.text.length > 120 ? '...' : ''}\n`;
      }
    });
  }

  if (!answer.trim()) {
    return "No matching code found. Try using specific function names, file names, or technical terms.";
  }

  return answer.trim();
}

router.post('/classify', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const classification = classifyQuery(question);
  res.json(classification);
});

export default router;
