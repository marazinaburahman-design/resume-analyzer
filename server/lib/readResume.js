import pdf from 'pdf-parse/lib/pdf-parse.js';

export async function readResume(buffer) {
 try {
  const result = await pdf(buffer);
  return (result.text || '')
   .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm, '')
   .replace(/\n{3,}/g, '\n\n')
   .trim();
 } catch (error) {
  // Log only parser diagnostics, never the uploaded PDF or extracted resume text.
  console.error('[PDF] Parsing failed:', error?.name || 'Error', error?.message || 'Unknown parser error');
  throw error;
 }
}
