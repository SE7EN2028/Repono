import { Router } from 'express';
import { classifyQuery } from '../services/queryClassifier.js';
import { queryWithGroq } from '../services/ragPipeline.js';

const router = Router();

router.post('/ask', async (req, res) => {
  const { question, repoId } = req.body;

  if (!question || !repoId) {
    return res.status(400).json({ error: 'Question and repoId are required' });
  }

  try {
    const result = await queryWithGroq(repoId, question);
    res.json(result);
  } catch (err) {
    console.log('Query error:', err.message.slice(0, 150));
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
