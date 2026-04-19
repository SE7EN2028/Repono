import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { cloneRepo, getRepoPath } from '../services/repoManager.js';
import { indexRepository } from '../services/indexer.js';
import { parseRepository } from '../services/fileParser.js';
import { generateInsights } from '../services/insightGenerator.js';

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

    repoStatus.set(repoUrl, { status: 'indexing', progress: 20 });

    const result = await indexRepository(repo.repoId, repo.repoPath, (status, progress) => {
      repoStatus.set(repoUrl, { status, progress, repoId: repo.repoId });
    });

    res.json({
      repoId: repo.repoId,
      owner: repo.owner,
      name: repo.name,
      fileCount: result.fileCount,
      chunkCount: result.chunkCount,
      embedded: result.embedded,
      status: result.embedded ? 'indexed' : 'parsed'
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

router.get('/insights/:repoId', async (req, res) => {
  const { repoId } = req.params;
  try {
    const repoPath = await getRepoPath(repoId);
    const insights = await generateInsights(repoPath);
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/files/:repoId', async (req, res) => {
  const { repoId } = req.params;
  try {
    const repoPath = await getRepoPath(repoId);
    const files = await parseRepository(repoPath);
    const tree = buildTree(files);
    res.json({ tree, fileCount: files.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/file/:repoId', async (req, res) => {
  const { repoId } = req.params;
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'path query param required' });

  try {
    const repoPath = await getRepoPath(repoId);
    const fullPath = path.join(repoPath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ path: filePath, content });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

function buildTree(files) {
  const root = [];
  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      if (isFile) {
        current.push({
          type: 'file',
          name,
          size: formatSize(file.size),
          language: file.language,
        });
      } else {
        let dir = current.find(n => n.type === 'dir' && n.name === name);
        if (!dir) {
          dir = { type: 'dir', name, children: [] };
          current.push(dir);
        }
        current = dir.children;
      }
    }
  }
  return root;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}

export default router;
