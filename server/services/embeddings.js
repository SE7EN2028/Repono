import OpenAI from 'openai';

let openai;
function getClient() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

const BATCH_SIZE = 100;
const MODEL = 'text-embedding-3-small';
const DIMENSIONS = 1536;

async function generateEmbedding(text) {
  const response = await getClient().embeddings.create({
    model: MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

async function generateEmbeddings(texts) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await getClient().embeddings.create({
      model: MODEL,
      input: batch,
    });
    embeddings.push(...response.data.map(d => d.embedding));
  }

  return embeddings;
}

function prepareChunkText(chunk) {
  const header = `File: ${chunk.metadata.filePath}\nLanguage: ${chunk.metadata.language}\nFunction: ${chunk.metadata.name}\n\n`;
  return header + chunk.content;
}

export { generateEmbedding, generateEmbeddings, prepareChunkText, DIMENSIONS };
