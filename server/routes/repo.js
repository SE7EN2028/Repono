import { Router } from 'express';
import { cloneRepo, getRepoPath } from '../services/repoManager.js';
import { parseRepository } from '../services/fileParser.js';

const router = Router();
const repoStatus = new Map();

router.post('/connect', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  try {
    repoStatus.set(repoUrl, { status: 'cloning', progress: 0 });
    const repo = await cloneRepo(repoUrl);

    repoStatus.set(repoUrl, { status: 'parsing', progress: 30 });
    const files = await parseRepository(repo.repoPath);

    repoStatus.set(repoUrl, {
      status: 'parsed',
      progress: 50,
      fileCount: files.length
    });

    res.json({
      repoId: repo.repoId,
      owner: repo.owner,
      name: repo.name,
      fileCount: files.length,
      status: 'parsed'
    });
  } catch (err) {
    repoStatus.set(repoUrl, { status: 'error', error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:repoId', async (req, res) => {
  const { repoId } = req.params;
  try {
    const repoPath = await getRepoPath(repoId);
    res.json({ repoId, status: 'ready', path: repoPath });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/list', async (req, res) => {
  const repos = Array.from(repoStatus.entries()).map(([url, status]) => ({
    url,
    ...status
  }));
  res.json({ repositories: repos });
});

export default router;
