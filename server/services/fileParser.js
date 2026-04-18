import fs from 'fs/promises';
import path from 'path';

const SUPPORTED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs',
  '.c', '.cpp', '.h', '.hpp', '.rb', '.php', '.swift', '.kt',
  '.scala', '.cs', '.vue', '.svelte', '.html', '.css', '.scss',
  '.sql', '.sh', '.bash', '.zsh', '.yaml', '.yml', '.json',
  '.toml', '.xml', '.md', '.txt', '.dockerfile', '.tf'
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '__pycache__',
  '.next', '.nuxt', 'vendor', 'target', '.venv', 'venv',
  'coverage', '.cache', '.idea', '.vscode'
]);

const MAX_FILE_SIZE = 100 * 1024;

async function parseRepository(repoPath) {
  const files = [];
  await walkDirectory(repoPath, repoPath, files);
  return files;
}

async function walkDirectory(currentPath, rootPath, files) {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    const relativePath = path.relative(rootPath, fullPath);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      await walkDirectory(fullPath, rootPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext) && entry.name !== 'Dockerfile') continue;

      const stat = await fs.stat(fullPath);
      if (stat.size > MAX_FILE_SIZE) continue;

      const content = await fs.readFile(fullPath, 'utf-8');
      files.push({
        path: relativePath,
        content,
        extension: ext,
        language: getLanguage(ext),
        size: stat.size
      });
    }
  }
}

function getLanguage(ext) {
  const langMap = {
    '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript',
    '.tsx': 'typescript', '.py': 'python', '.java': 'java',
    '.go': 'go', '.rs': 'rust', '.c': 'c', '.cpp': 'cpp',
    '.h': 'c', '.hpp': 'cpp', '.rb': 'ruby', '.php': 'php',
    '.swift': 'swift', '.kt': 'kotlin', '.scala': 'scala',
    '.cs': 'csharp', '.vue': 'vue', '.svelte': 'svelte',
    '.html': 'html', '.css': 'css', '.scss': 'scss',
    '.sql': 'sql', '.sh': 'shell', '.bash': 'shell',
    '.zsh': 'shell', '.yaml': 'yaml', '.yml': 'yaml',
    '.json': 'json', '.toml': 'toml', '.xml': 'xml',
    '.md': 'markdown', '.txt': 'text', '.tf': 'terraform'
  };
  return langMap[ext] || 'unknown';
}

export { parseRepository, getLanguage, SUPPORTED_EXTENSIONS };
