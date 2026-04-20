import { parseRepository } from './fileParser.js';
import path from 'path';

async function analyzeDependencies(repoPath) {
  const files = await parseRepository(repoPath);

  const dirMap = {};

  for (const file of files) {
    const parts = file.path.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';

    if (!dirMap[dir]) {
      dirMap[dir] = { id: dir, files: [], languages: {} };
    }
    dirMap[dir].files.push(file);
    const lang = file.language;
    dirMap[dir].languages[lang] = (dirMap[dir].languages[lang] || 0) + 1;
  }

  const nodes = [];
  const edgeSet = new Set();
  const edges = [];

  for (const [dirPath, dir] of Object.entries(dirMap)) {
    const topLang = Object.entries(dir.languages).sort((a, b) => b[1] - a[1])[0];
    nodes.push({
      id: dirPath,
      label: dirPath,
      group: getGroup(dirPath),
      size: Math.min(28, 10 + dir.files.length * 2),
      summary: `${dir.files.length} files, primarily ${topLang ? topLang[0] : 'unknown'}`,
    });
  }

  for (const file of files) {
    const sourceDir = file.path.split('/').slice(0, -1).join('/') || '.';
    const imports = extractImports(file.content);

    for (const imp of imports) {
      if (!imp.startsWith('.') && !imp.startsWith('/')) continue;

      const fromDir = path.dirname(file.path);
      let resolved = path.normalize(path.join(fromDir, imp)).replace(/\\/g, '/');
      resolved = resolved.replace(/\.(js|ts|jsx|tsx|py|go)$/, '');

      let targetDir = null;
      for (const dir of Object.keys(dirMap)) {
        if (resolved.startsWith(dir + '/') || resolved === dir) {
          targetDir = dir;
        }
      }

      if (!targetDir) {
        const parent = resolved.split('/').slice(0, -1).join('/');
        if (dirMap[parent]) targetDir = parent;
      }

      if (targetDir && targetDir !== sourceDir) {
        const key = sourceDir + '>' + targetDir;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push([sourceDir, targetDir]);
        }
      }
    }
  }

  const dirs = Object.keys(dirMap);
  for (const dir of dirs) {
    const parent = dir.split('/').slice(0, -1).join('/');
    if (parent && dirMap[parent]) {
      const key = parent + '>' + dir;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([parent, dir]);
      }
    }
  }

  layoutNodes(nodes, edges);

  return { nodes, edges };
}

function extractImports(content) {
  const imports = [];
  const patterns = [
    /import\s+.*?from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /from\s+(\S+)\s+import/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
}

function getGroup(dirPath) {
  const lower = dirPath.toLowerCase();
  if (lower.includes('test') || lower.includes('spec') || lower.includes('__test')) return 'test';
  if (lower.includes('config') || lower.includes('infra') || lower === '.') return 'infra';
  if (lower.includes('component') || lower.includes('ui') || lower.includes('view') || lower.includes('page') || lower.includes('renderer')) return 'app';
  if (lower.includes('service') || lower.includes('api') || lower.includes('route') || lower.includes('server')) return 'svc';
  if (lower.includes('lib') || lower.includes('util') || lower.includes('helper') || lower.includes('core') || lower.includes('data')) return 'pkg';
  if (lower.includes('src')) return 'app';
  return 'pkg';
}

function layoutNodes(nodes, edges) {
  const total = nodes.length;
  if (total === 0) return;

  const edgeMap = {};
  for (const [a, b] of edges) {
    edgeMap[a] = (edgeMap[a] || 0) + 1;
    edgeMap[b] = (edgeMap[b] || 0) + 1;
  }

  nodes.sort((a, b) => (edgeMap[b.id] || 0) - (edgeMap[a.id] || 0));

  if (total === 1) {
    nodes[0].x = 0.5;
    nodes[0].y = 0.5;
    return;
  }

  const cols = Math.ceil(Math.sqrt(total * 1.5));
  const rows = Math.ceil(total / cols);
  const padX = 0.12;
  const padY = 0.15;

  for (let i = 0; i < nodes.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    nodes[i].x = padX + (col / Math.max(1, cols - 1)) * (1 - 2 * padX);
    nodes[i].y = padY + (row / Math.max(1, rows - 1)) * (1 - 2 * padY);

    nodes[i].x += (Math.random() - 0.5) * 0.06;
    nodes[i].y += (Math.random() - 0.5) * 0.06;

    nodes[i].x = Math.max(0.08, Math.min(0.92, nodes[i].x));
    nodes[i].y = Math.max(0.08, Math.min(0.92, nodes[i].y));
  }
}

export { analyzeDependencies };
