import { parseRepository } from './fileParser.js';
import { chunkRepository } from './chunker.js';

async function indexRepository(repoId, repoPath, onProgress) {
  const progress = onProgress || (() => {});

  progress('parsing', 10);
  const files = await parseRepository(repoPath);

  progress('chunking', 30);
  const chunks = chunkRepository(files);

  progress('done', 100);

  return {
    fileCount: files.length,
    chunkCount: chunks.length,
    status: 'parsed',
    embedded: false,
  };
}

export { indexRepository };
