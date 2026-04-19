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

  let indexed = false;

  try {
    progress('embedding', 50);
    const texts = chunks.map(prepareChunkText);
    const embeddings = await generateEmbeddings(texts);

    progress('storing', 80);
    const store = new VectorStore(repoId);
    await store.addChunks(chunks, embeddings);
    await store.save();
    indexed = true;
  } catch (err) {
    console.log('Embedding failed:', err.message);
    console.log('Repository parsed and chunked but not embedded.');
    console.log('RAG queries will not work until embeddings are generated.');
  }

  progress('done', 100);

  return {
    fileCount: files.length,
    chunkCount: chunks.length,
    status: indexed ? 'indexed' : 'parsed',
    embedded: indexed,
  };
}

export { indexRepository };
