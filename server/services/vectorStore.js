import pkg from 'faiss-node';
const { IndexFlatIP } = pkg;
import fs from 'fs/promises';
import path from 'path';
import { DIMENSIONS } from './embeddings.js';

const STORE_DIR = path.resolve('vector-store/data');

class VectorStore {
  constructor(repoId) {
    this.repoId = repoId;
    this.index = new IndexFlatIP(DIMENSIONS);
    this.chunks = [];
    this.storePath = path.join(STORE_DIR, repoId);
  }

  async addChunks(chunks, embeddings) {
    for (let i = 0; i < chunks.length; i++) {
      const norm = normalize(embeddings[i]);
      this.index.add(norm);
      this.chunks.push(chunks[i]);
    }
  }

  search(queryEmbedding, topK = 5) {
    if (this.chunks.length === 0) return [];

    const norm = normalize(queryEmbedding);
    const result = this.index.search(norm, Math.min(topK, this.chunks.length));

    return result.labels.map((idx, i) => ({
      chunk: this.chunks[idx],
      score: result.distances[i]
    }));
  }

  async save() {
    await fs.mkdir(this.storePath, { recursive: true });

    const indexPath = path.join(this.storePath, 'index.faiss');
    this.index.write(indexPath);

    const metaPath = path.join(this.storePath, 'chunks.json');
    await fs.writeFile(metaPath, JSON.stringify(this.chunks));
  }

  async load() {
    const indexPath = path.join(this.storePath, 'index.faiss');
    const metaPath = path.join(this.storePath, 'chunks.json');

    const exists = await fs.access(indexPath).then(() => true).catch(() => false);
    if (!exists) throw new Error('No index found for this repository');

    this.index = IndexFlatIP.read(indexPath);
    const meta = await fs.readFile(metaPath, 'utf-8');
    this.chunks = JSON.parse(meta);
  }
}

function normalize(vec) {
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vec;
  return vec.map(v => v / magnitude);
}

export { VectorStore };
