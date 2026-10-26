const KEY = 'resume-analyzer-user-id';
export function getUserId() {
  let id = localStorage.getItem(KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(KEY, id); }
  return id;
}
