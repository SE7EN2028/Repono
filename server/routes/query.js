import { Router } from 'express';
import { queryRAG } from '../services/ragPipeline.js';
import { classifyQuery } from '../services/queryClassifier.js';
import { keywordSearch, buildAnswer } from '../services/keywordSearch.js';
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
    const answer = buildAnswer(question, results);

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
      mode: 'keyword',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/classify', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const classification = classifyQuery(question);
  res.json(classification);
});

export default router;
