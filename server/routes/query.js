import { Router } from 'express';

const router = Router();

router.post('/ask', async (req, res) => {
  const { question, repoId } = req.body;

  if (!question || !repoId) {
    return res.status(400).json({ error: 'Question and repoId are required' });
  }

  try {
    res.json({
      answer: 'RAG pipeline not yet connected',
      sources: [],
      queryType: 'unknown'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/classify', async (req, res) => {
  const { question } = req.body;
  res.json({ type: 'explain', confidence: 0 });
});

export default router;
