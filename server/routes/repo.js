import { Router } from 'express';

const router = Router();

router.post('/connect', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  try {
    res.json({ message: 'Repository connected', repoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:repoId', async (req, res) => {
  const { repoId } = req.params;
  res.json({ repoId, status: 'pending', indexed: false });
});

router.get('/list', async (req, res) => {
  res.json({ repositories: [] });
});

export default router;
