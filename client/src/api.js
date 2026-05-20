const API_URL = '/api';

function getClientId() {
  let id = localStorage.getItem('reponoClientId');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    localStorage.setItem('reponoClientId', id);
  }
  return id;
}

function headers(extra = {}) {
  return { 'Content-Type': 'application/json', 'X-Client-Id': getClientId(), ...extra };
}

export async function connectRepo(repoUrl) {
  const response = await fetch(`${API_URL}/repo/connect`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ repoUrl }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function getRepoStatus(repoId) {
  const response = await fetch(`${API_URL}/repo/status/${repoId}`, { headers: headers() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function listRepos() {
  const response = await fetch(`${API_URL}/repo/list`, { headers: headers() });
  const data = await response.json();
  return data.repositories;
}

export async function askQuestion(repoId, question, settings = {}) {
  const extra = {};
  if (settings.groqKey) extra['X-Groq-Key'] = settings.groqKey;
  if (settings.geminiKey) extra['X-Gemini-Key'] = settings.geminiKey;
  const response = await fetch(`${API_URL}/query/ask`, {
    method: 'POST',
    headers: headers(extra),
    body: JSON.stringify({ repoId, question, model: settings.model, maxResults: settings.maxResults }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function classifyQuestion(question) {
  const response = await fetch(`${API_URL}/query/classify`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ question }),
  });
  const data = await response.json();
  return data;
}

export async function embedRepo(repoId, geminiKey) {
  const extra = {};
  if (geminiKey) extra['X-Gemini-Key'] = geminiKey;
  const response = await fetch(`${API_URL}/repo/embed/${repoId}`, {
    method: 'POST',
    headers: headers(extra),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function removeRepo(repoId) {
  const response = await fetch(`${API_URL}/repo/remove/${repoId}`, { method: 'DELETE', headers: headers() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function getRepoDependencies(repoId) {
  const response = await fetch(`${API_URL}/repo/dependencies/${repoId}`, { headers: headers() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function getApiFlow(repoId) {
  const response = await fetch(`${API_URL}/repo/api-flow/${repoId}`, { headers: headers() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function getRepoInsights(repoId) {
  const response = await fetch(`${API_URL}/repo/insights/${repoId}`, { headers: headers() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function getRepoFiles(repoId) {
  const response = await fetch(`${API_URL}/repo/files/${repoId}`, { headers: headers() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function getFileContent(repoId, filePath) {
  const response = await fetch(`${API_URL}/repo/file/${repoId}?path=${encodeURIComponent(filePath)}`, { headers: headers() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function checkHealth() {
  const response = await fetch(`${API_URL}/health`);
  return response.ok;
}
