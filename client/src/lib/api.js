const API = import.meta.env.VITE_API_URL ?? '';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      credentials: 'include'
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  let body;
  try { body = await response.json(); }
  catch { throw new Error('The server returned an unreadable response. Please try again.'); }
  if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
  return body;
}

function jsonOptions(method, payload) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
}

export function authMe() {
  return request('/api/auth/me');
}

export function registerAccount({ name, email, password }) {
  return request('/api/auth/register', jsonOptions('POST', { name, email, password }));
}

export function loginAccount({ email, password }) {
  return request('/api/auth/login', jsonOptions('POST', { email, password }));
}

export function logoutAccount() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function analyzeResume(file, targetRole) {
  const form = new FormData();
  form.append('resume', file);
  form.append('targetRole', targetRole);
  return request('/api/analyze', { method: 'POST', body: form });
}

export function getHistory() {
  return request('/api/results');
}

export function deleteHistoryItem(id) {
  return request(`/api/results/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
