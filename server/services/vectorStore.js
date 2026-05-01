import fs from 'fs/promises';
import path from 'path';

const STORE_DIR = path.resolve('vector-store/data');

class VectorStore {
  constructor(repoId) {
    this.repoId = repoId;
    this.vectors = [];
    this.chunks = [];
    this.storePath = path.join(STORE_DIR, repoId);
  }

  async addChunks(chunks, embeddings) {
    for (let i = 0; i < chunks.length; i++) {
      this.vectors.push(normalize(embeddings[i]));
      this.chunks.push(chunks[i]);
    }
  }

  search(queryEmbedding, topK = 5) {
    if (this.chunks.length === 0) return [];

    const norm = normalize(queryEmbedding);
    const scores = this.vectors.map((vec, i) => ({
      index: i,
      score: cosineSimilarity(norm, vec),
    }));

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map(s => ({
      chunk: this.chunks[s.index],
      score: s.score,
    }));
  }

  async save() {
    await fs.mkdir(this.storePath, { recursive: true });
    await fs.writeFile(
      path.join(this.storePath, 'store.json'),
      JSON.stringify({ vectors: this.vectors, chunks: this.chunks })
    );
  }

  async load() {
    const filePath = path.join(this.storePath, 'store.json');
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!exists) throw new Error('No index found for this repository');

    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    this.vectors = data.vectors;
    this.chunks = data.chunks;
  }

  async exists() {
    const filePath = path.join(this.storePath, 'store.json');
    return fs.access(filePath).then(() => true).catch(() => false);
  }
}

function normalize(vec) {
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (mag === 0) return vec;
  return vec.map(v => v / mag);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export { VectorStore };
