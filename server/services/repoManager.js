import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const REPOS_DIR = path.resolve('repos');

function normalizeUrl(repoUrl) {
  return repoUrl.replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();
}

function generateRepoId(repoUrl) {
  return crypto.createHash('md5').update(normalizeUrl(repoUrl)).digest('hex').slice(0, 12);
}

function parseRepoUrl(repoUrl) {
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  return { owner: match[1], name: match[2] };
}

async function cloneRepo(repoUrl) {
  await fs.mkdir(REPOS_DIR, { recursive: true });

  const repoId = generateRepoId(repoUrl);
  const { owner, name } = parseRepoUrl(repoUrl);
  const repoPath = path.join(REPOS_DIR, repoId);

  const exists = await fs.access(repoPath).then(() => true).catch(() => false);
  if (exists) {
    const git = simpleGit(repoPath);
    await git.pull();
    return { repoId, repoPath, owner, name, updated: true };
  }

  const git = simpleGit();
  await git.clone(repoUrl, repoPath, ['--depth', '1']);
  return { repoId, repoPath, owner, name, updated: false };
}

async function getRepoPath(repoId) {
  const repoPath = path.join(REPOS_DIR, repoId);
  const exists = await fs.access(repoPath).then(() => true).catch(() => false);
  if (!exists) throw new Error('Repository not found');
  return repoPath;
}

export { cloneRepo, getRepoPath, generateRepoId, parseRepoUrl, REPOS_DIR };
