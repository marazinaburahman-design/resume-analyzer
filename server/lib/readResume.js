import pdf from 'pdf-parse';

export async function readResume(buffer) {
 const result = await pdf(buffer);
 return (result.text || '')
  .replace(/^\\s*--\\s*\\d+\\s+of\\s+\\d+\\s*--\\s*$/gm, '')
  .replace(/\\n{3,}/g, '\\n\\n')
  .trim();
}
