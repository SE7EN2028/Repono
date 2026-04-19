import { parseRepository, getLanguage } from './fileParser.js';

async function generateInsights(repoPath) {
  const files = await parseRepository(repoPath);

  const langCount = {};
  let totalLines = 0;

  for (const file of files) {
    const lang = file.language;
    const lines = file.content.split('\n').length;
    totalLines += lines;
    langCount[lang] = (langCount[lang] || 0) + lines;
  }

  const stack = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, lines]) => ({
      name,
      share: Math.round((lines / totalLines) * 100),
      color: getLangColor(name),
    }));

  const frameworks = detectFrameworks(files);
  const entries = findEntryPoints(files);
  const issues = findPotentialIssues(files);

  return {
    summary: `Repository with ${files.length} files and ${totalLines.toLocaleString()} lines of code.`,
    fileCount: files.length,
    totalLines,
    stack,
    frameworks,
    entries,
    issues,
    hotspots: [],
  };
}

function getLangColor(lang) {
  const colors = {
    javascript: '#F7DF1E', typescript: '#3178C6', python: '#3776AB',
    java: '#B07219', go: '#00ADD8', rust: '#CE412B',
    ruby: '#CC342D', php: '#4F5D95', swift: '#F05138',
    kotlin: '#A97BFF', html: '#E34F26', css: '#1572B6',
    shell: '#89E051', yaml: '#CB171E', json: '#292929',
    markdown: '#083FA1', sql: '#E38C00', terraform: '#7B42BC',
  };
  return colors[lang] || '#8B97A8';
}

function detectFrameworks(files) {
  const found = [];
  const allContent = files.map(f => f.path + ' ' + f.content.slice(0, 500)).join(' ');

  const checks = [
    ['React', /from ['"]react['"]/],
    ['Next.js', /next\.config|from ['"]next/],
    ['Express', /from ['"]express['"]/],
    ['FastAPI', /from fastapi/],
    ['Django', /from django/],
    ['Flask', /from flask/],
    ['Vue', /from ['"]vue['"]/],
    ['Angular', /@angular\/core/],
    ['Prisma', /prisma/],
    ['Mongoose', /from ['"]mongoose['"]/],
    ['PostgreSQL', /pg|postgres/i],
    ['Redis', /redis/i],
    ['Docker', /Dockerfile|docker-compose/],
    ['Terraform', /\.tf$/],
    ['Vitest', /vitest/],
    ['Jest', /jest/],
    ['Tailwind', /tailwind/],
  ];

  for (const [name, pattern] of checks) {
    if (pattern.test(allContent)) found.push(name);
  }

  return found.slice(0, 10);
}

function findEntryPoints(files) {
  const entries = [];
  const entryPatterns = [
    { pattern: /^(index|main|app|server)\.(js|ts|jsx|tsx|py)$/, role: 'Entry point' },
    { pattern: /^(package|setup|cargo|go)\.(json|py|toml|mod)$/, role: 'Config' },
    { pattern: /Dockerfile$/, role: 'Container' },
  ];

  for (const file of files) {
    const name = file.path.split('/').pop();
    for (const { pattern, role } of entryPatterns) {
      if (pattern.test(name)) {
        entries.push({ file: file.path, role });
        break;
      }
    }
  }

  return entries.slice(0, 8);
}

function findPotentialIssues(files) {
  const issues = [];

  for (const file of files) {
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/TODO|FIXME|HACK|XXX/.test(line)) {
        issues.push({
          level: 'info',
          title: line.trim().slice(0, 80),
          file: file.path,
          line: i + 1,
        });
      }

      if (/password\s*=\s*['"][^'"]+['"]|api_key\s*=\s*['"][^'"]+['"]|secret\s*=\s*['"][^'"]+['"]/i.test(line)) {
        issues.push({
          level: 'danger',
          title: 'Possible hardcoded secret',
          file: file.path,
          line: i + 1,
        });
      }

      if (/console\.log\(/.test(line) && !file.path.includes('test')) {
        issues.push({
          level: 'warn',
          title: 'Console.log in production code',
          file: file.path,
          line: i + 1,
        });
      }
    }
  }

  return issues.slice(0, 20);
}

export { generateInsights };
