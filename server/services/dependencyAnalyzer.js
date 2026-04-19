import { parseRepository } from './fileParser.js';
import path from 'path';

async function analyzeDependencies(repoPath) {
  const files = await parseRepository(repoPath);

  const dirMap = {};

  for (const file of files) {
    const parts = file.path.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';

    if (!dirMap[dir]) {
      dirMap[dir] = {
        id: dir,
        label: dir,
        files: [],
        languages: {},
      };
    }
    dirMap[dir].files.push(file.path);
    const lang = file.language;
    dirMap[dir].languages[lang] = (dirMap[dir].languages[lang] || 0) + 1;
  }

  const nodes = [];
  const edgeSet = new Set();
  const edges = [];

  for (const dir of Object.values(dirMap)) {
    const topLang = Object.entries(dir.languages).sort((a, b) => b[1] - a[1])[0];
    nodes.push({
      id: dir.id,
      label: dir.id,
      group: getGroup(dir.id),
      size: Math.min(28, 10 + dir.files.length * 2),
      summary: `${dir.files.length} files, primarily ${topLang ? topLang[0] : 'unknown'}`,
    });
  }

  for (const file of files) {
    const sourceDir = file.path.split('/').slice(0, -1).join('/') || '.';
    const imports = extractImports(file.content);

    for (const imp of imports) {
      const resolved = resolveImport(imp, file.path, files);
      if (!resolved) continue;

      const targetDir = resolved.split('/').slice(0, -1).join('/') || '.';
      if (targetDir === sourceDir) continue;
      if (!dirMap[targetDir]) continue;

      const key = sourceDir + '>' + targetDir;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([sourceDir, targetDir]);
      }
    }
  }

  layoutNodes(nodes);

  return { nodes, edges };
}

function extractImports(content) {
  const imports = [];
  const patterns = [
    /import\s+.*?from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
}

function resolveImport(importPath, fromFile, allFiles) {
  if (!importPath.startsWith('.')) return null;

  const fromDir = path.dirname(fromFile);
  let resolved = path.normalize(path.join(fromDir, importPath));

  resolved = resolved.replace(/\\/g, '/');

  const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts'];

  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (allFiles.some(f => f.path === candidate)) {
      return candidate;
    }
  }

  return null;
}

function getGroup(dirPath) {
  if (dirPath.includes('test') || dirPath.includes('spec')) return 'test';
  if (dirPath.includes('config') || dirPath.includes('infra')) return 'infra';
  if (dirPath.includes('component') || dirPath.includes('ui') || dirPath.includes('view')) return 'app';
  if (dirPath.includes('service') || dirPath.includes('api') || dirPath.includes('route')) return 'svc';
  if (dirPath.includes('lib') || dirPath.includes('util') || dirPath.includes('helper') || dirPath.includes('core')) return 'pkg';
  return 'pkg';
}

function layoutNodes(nodes) {
  const total = nodes.length;
  if (total === 0) return;

  const cols = Math.ceil(Math.sqrt(total));
  const padding = 0.12;

  for (let i = 0; i < nodes.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const rows = Math.ceil(total / cols);

    nodes[i].x = padding + (col / Math.max(1, cols - 1)) * (1 - 2 * padding);
    nodes[i].y = padding + (row / Math.max(1, rows - 1)) * (1 - 2 * padding);

    nodes[i].x += (Math.random() - 0.5) * 0.04;
    nodes[i].y += (Math.random() - 0.5) * 0.04;

    nodes[i].x = Math.max(0.06, Math.min(0.94, nodes[i].x));
    nodes[i].y = Math.max(0.06, Math.min(0.94, nodes[i].y));
  }
}

export { analyzeDependencies };
