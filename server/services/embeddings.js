const DIMENSIONS = 768;

async function generateEmbedding(text, apiKey) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Embedding failed');
  }

  const data = await response.json();
  return data.embedding.values;
}

async function generateEmbeddings(texts, apiKey) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i++) {
    try {
      const embedding = await generateEmbedding(texts[i], apiKey);
      embeddings.push(embedding);
    } catch (err) {
      if (err.message.includes('429')) {
        await new Promise(r => setTimeout(r, 60000));
        i--;
        continue;
      }
      throw err;
    }

    if (i > 0 && i % 10 === 0) {
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
