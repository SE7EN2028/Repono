import { Router } from 'express';
import { queryRAG } from '../services/ragPipeline.js';
import { classifyQuery } from '../services/queryClassifier.js';

const router = Router();

router.post('/ask', async (req, res) => {
  const { question, repoId } = req.body;

  if (!question || !repoId) {
    return res.status(400).json({ error: 'Question and repoId are required' });
  }

  try {
    const result = await queryRAG(repoId, question);
    res.json(result);
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
