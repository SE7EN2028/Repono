import { parseRepository } from './fileParser.js';
import { chunkRepository } from './chunker.js';
import { generateEmbeddings, prepareChunkText } from './embeddings.js';
import { VectorStore } from './vectorStore.js';

async function indexRepository(repoId, repoPath, onProgress) {
  const progress = onProgress || (() => {});

  progress('parsing', 10);
  const files = await parseRepository(repoPath);

  progress('chunking', 30);
  const chunks = chunkRepository(files);

  progress('embedding', 50);
  const texts = chunks.map(prepareChunkText);
  const embeddings = await generateEmbeddings(texts);

  progress('storing', 80);
  const store = new VectorStore(repoId);
  await store.addChunks(chunks, embeddings);
  await store.save();

  progress('done', 100);

  return {
    fileCount: files.length,
    chunkCount: chunks.length,
    status: 'indexed'
  };
}

export { indexRepository };
