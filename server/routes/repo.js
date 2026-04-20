import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { cloneRepo, getRepoPath } from '../services/repoManager.js';
import { indexRepository } from '../services/indexer.js';
import { parseRepository } from '../services/fileParser.js';
import { generateInsights } from '../services/insightGenerator.js';
import { analyzeDependencies } from '../services/dependencyAnalyzer.js';

const router = Router();
const repoStatus = new Map();

const REPOS_FILE = path.resolve('repos.json');

async function loadSavedRepos() {
  try {
    const data = await fs.readFile(REPOS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveRepo(repo) {
  const repos = await loadSavedRepos();
  const existing = repos.findIndex(r => r.repoId === repo.repoId);
  if (existing >= 0) repos[existing] = repo;
  else repos.push(repo);
  await fs.writeFile(REPOS_FILE, JSON.stringify(repos, null, 2));
}

router.post('/connect', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  try {
    repoStatus.set(repoUrl, { status: 'cloning', progress: 0 });
    const repo = await cloneRepo(repoUrl);

    repoStatus.set(repoUrl, { status: 'parsing', progress: 50 });
    const { parseRepository } = await import('../services/fileParser.js');
    const { chunkRepository } = await import('../services/chunker.js');
    const files = await parseRepository(repo.repoPath);
    const chunks = chunkRepository(files);

    const repoData = {
      repoId: repo.repoId,
      owner: repo.owner,
      name: repo.name,
      url: repoUrl,
      fileCount: files.length,
      chunkCount: chunks.length,
      embedded: false,
      status: 'parsed',
    };

    await saveRepo(repoData);
    res.json(repoData);

    indexRepository(repo.repoId, repo.repoPath, (status, progress) => {
      repoStatus.set(repoUrl, { status, progress, repoId: repo.repoId });
    }).then(async (result) => {
      repoData.embedded = result.embedded;
      repoData.status = result.embedded ? 'indexed' : 'parsed';
      await saveRepo(repoData);
    }).catch(() => {});
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

router.delete('/remove/:repoId', async (req, res) => {
  const { repoId } = req.params;
  try {
    const repos = await loadSavedRepos();
    const filtered = repos.filter(r => r.repoId !== repoId);
    await fs.writeFile(REPOS_FILE, JSON.stringify(filtered, null, 2));

    const repoPath = path.resolve('repos', repoId);
    await fs.rm(repoPath, { recursive: true, force: true }).catch(() => {});

    const vectorPath = path.resolve('vector-store/data', repoId);
    await fs.rm(vectorPath, { recursive: true, force: true }).catch(() => {});

    res.json({ removed: repoId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', async (req, res) => {
  const repos = await loadSavedRepos();
  res.json({ repositories: repos });
});

router.get('/dependencies/:repoId', async (req, res) => {
  const { repoId } = req.params;
  try {
    const repoPath = await getRepoPath(repoId);
    const graph = await analyzeDependencies(repoPath);
    res.json(graph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    const { tree, fileCount } = await walkAllFiles(repoPath);
    res.json({ tree, fileCount });
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

const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', '__pycache__', '.venv', 'venv', '.cache', 'dist', 'build']);

async function walkAllFiles(repoPath) {
  let fileCount = 0;

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const result = [];

    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const children = await walk(fullPath);
        result.push({ type: 'dir', name: entry.name, children });
      } else {
        const stat = await fs.stat(fullPath);
        fileCount++;
        result.push({
          type: 'file',
          name: entry.name,
          size: formatSize(stat.size),
          language: getLanguageFromName(entry.name),
        });
      }
    }
    return result;
  }

  const tree = await walk(repoPath);
  return { tree, fileCount };
}

function getLanguageFromName(name) {
  const ext = '.' + name.split('.').pop().toLowerCase();
  const map = {
    '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript',
    '.tsx': 'typescript', '.py': 'python', '.java': 'java',
    '.go': 'go', '.rs': 'rust', '.html': 'html', '.css': 'css',
    '.json': 'json', '.md': 'markdown', '.yml': 'yaml', '.yaml': 'yaml',
    '.sh': 'shell', '.sql': 'sql', '.rb': 'ruby', '.php': 'php',
    '.c': 'c', '.cpp': 'cpp', '.h': 'c', '.swift': 'swift',
    '.kt': 'kotlin', '.vue': 'vue', '.svelte': 'svelte',
  };
  return map[ext] || name.split('.').pop();
}

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
