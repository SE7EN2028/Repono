const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function chunkFile(file) {
  const language = file.language;

  if (['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'c', 'csharp', 'kotlin', 'swift', 'php', 'ruby', 'scala'].includes(language)) {
    return chunkByFunctions(file);
  }

  return chunkBySlidingWindow(file);
}

function chunkByFunctions(file) {
  const lines = file.content.split('\n');
  const chunks = [];
  const functionPatterns = [
    /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/,
    /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\w*\s*=>/,
    /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/,
    /^(?:export\s+)?class\s+(\w+)/,
    /^\s*def\s+(\w+)/,
    /^\s*class\s+(\w+)/,
    /^func\s+(\w+)/,
    /^fn\s+(\w+)/,
    /^\s*(?:public|private|protected)\s+(?:static\s+)?(?:\w+\s+)?(\w+)\s*\(/,
  ];

  let currentChunk = [];
  let currentName = file.path;
  let startLine = 1;
  let braceDepth = 0;
  let inFunction = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let matched = false;

    if (!inFunction || braceDepth === 0) {
      for (const pattern of functionPatterns) {
        const match = line.match(pattern);
        if (match) {
          if (currentChunk.length > 0) {
            chunks.push(buildChunk(file, currentChunk, currentName, startLine));
          }
          currentChunk = [];
          currentName = match[1] || file.path;
          startLine = i + 1;
          matched = true;
          inFunction = true;
          braceDepth = 0;
          break;
        }
      }
    }

    currentChunk.push(line);

    for (const ch of line) {
      if (ch === '{') braceDepth++;
      if (ch === '}') braceDepth--;
    }

    if (inFunction && braceDepth <= 0 && currentChunk.length > 3) {
      if (line.trim() === '}' || line.trim().endsWith('}') || (file.language === 'python' && !matched && line.trim() === '' && currentChunk.length > 5)) {
        const tokenCount = estimateTokens(currentChunk.join('\n'));
        if (tokenCount > CHUNK_SIZE) {
          const subChunks = splitLargeChunk(file, currentChunk, currentName, startLine);
          chunks.push(...subChunks);
        } else {
          chunks.push(buildChunk(file, currentChunk, currentName, startLine));
        }
        currentChunk = [];
        currentName = file.path;
        startLine = i + 2;
        inFunction = false;
      }
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(buildChunk(file, currentChunk, currentName, startLine));
  }

  if (chunks.length === 0) {
    return chunkBySlidingWindow(file);
  }

  return chunks;
}

function chunkBySlidingWindow(file) {
  const lines = file.content.split('\n');
  const chunks = [];
  let start = 0;

  while (start < lines.length) {
    let end = start;
    let tokenCount = 0;

    while (end < lines.length && tokenCount < CHUNK_SIZE) {
      tokenCount += estimateTokens(lines[end]);
      end++;
    }

    const chunkLines = lines.slice(start, end);
    chunks.push(buildChunk(file, chunkLines, file.path, start + 1));

    start = Math.max(start + 1, end - Math.floor(CHUNK_OVERLAP / 4));
    if (start >= lines.length) break;
  }

  return chunks;
}

function splitLargeChunk(file, lines, name, startLine) {
  const chunks = [];
  let start = 0;

  while (start < lines.length) {
    let end = start;
    let tokenCount = 0;

    while (end < lines.length && tokenCount < CHUNK_SIZE) {
      tokenCount += estimateTokens(lines[end]);
      end++;
    }

    const chunkLines = lines.slice(start, end);
    chunks.push(buildChunk(file, chunkLines, `${name}_part${chunks.length + 1}`, startLine + start));

    start = Math.max(start + 1, end - Math.floor(CHUNK_OVERLAP / 4));
  }

  return chunks;
}

function buildChunk(file, lines, name, startLine) {
  const content = lines.join('\n');
  return {
    content,
    metadata: {
      filePath: file.path,
      language: file.language,
      name,
      startLine,
      endLine: startLine + lines.length - 1,
      tokenEstimate: estimateTokens(content)
    }
  };
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function chunkRepository(files) {
  const allChunks = [];
  for (const file of files) {
    const chunks = chunkFile(file);
    allChunks.push(...chunks);
  }
  return allChunks;
}

export { chunkRepository, chunkFile, chunkByFunctions, chunkBySlidingWindow };
