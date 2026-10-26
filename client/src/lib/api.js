const API = import.meta.env.VITE_API_URL ?? '';
async function request(path, options) {
  let response;
  try { response = await fetch(`${API}${path}`, options); }
  catch { throw new Error('Could not reach the server. Check your connection and try again.'); }
  let body;
  try { body = await response.json(); }
  catch { throw new Error('The server returned an unreadable response. Please try again.'); }
  if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
  return body;
}
export function analyzeResume(file, targetRole, userId) {
  const form = new FormData(); form.append('resume', file); form.append('targetRole', targetRole); form.append('userId', userId);
  return request('/api/analyze', { method: 'POST', body: form });
}
export function getHistory(userId) { return request(`/api/results?userId=${encodeURIComponent(userId)}`); }
