const API_URL = '/api';

export async function connectRepo(repoUrl) {
  const response = await fetch(`${API_URL}/repo/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function getRepoStatus(repoId) {
  const response = await fetch(`${API_URL}/repo/status/${repoId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function listRepos() {
  const response = await fetch(`${API_URL}/repo/list`);
  const data = await response.json();
  return data.repositories;
}

export async function askQuestion(repoId, question) {
  const response = await fetch(`${API_URL}/query/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoId, question }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

export async function classifyQuestion(question) {
  const response = await fetch(`${API_URL}/query/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  const data = await response.json();
  return data;
}

export async function checkHealth() {
  const response = await fetch(`${API_URL}/health`);
  return response.ok;
}
