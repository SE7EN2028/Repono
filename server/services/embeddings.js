import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI;
function getClient() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
}

const DIMENSIONS = 3072;

async function generateEmbedding(text) {
  const model = getClient().getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function generateEmbeddings(texts) {
  const embeddings = [];
  const model = getClient().getGenerativeModel({ model: 'gemini-embedding-001' });

  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await model.embedContent(texts[i]);
      embeddings.push(result.embedding.values);
    } catch (err) {
      if (err.message && err.message.includes('429')) {
        console.log(`Rate limited at ${i}/${texts.length}, waiting 60s...`);
        await new Promise(r => setTimeout(r, 60000));
        i--;
        continue;
      }
      throw err;
    }

    if (i > 0 && i % 10 === 0) {
      console.log(`Embedded ${i}/${texts.length} chunks...`);
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return embeddings;
}

function prepareChunkText(chunk) {
  const header = `File: ${chunk.metadata.filePath}\nLanguage: ${chunk.metadata.language}\nFunction: ${chunk.metadata.name}\n\n`;
  return header + chunk.content;
}

export { generateEmbedding, generateEmbeddings, prepareChunkText, DIMENSIONS };
