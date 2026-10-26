import { CanvasFactory } from 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';

function cleanText(value) {
  return String(value || '')
    .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm, '')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

export async function readResume(buffer) {
  const parser = new PDFParse({
    data: Buffer.from(buffer),
    CanvasFactory
  });

  try {
    const result = await parser.getText();
    return cleanText(result?.text);
  } catch (error) {
    // Log parser diagnostics only; never log the uploaded PDF or extracted text.
    console.error('[PDF] Parsing failed:', error?.name || 'Error', error?.message || 'Unknown parser error');
    throw error;
  } finally {
    await parser.destroy().catch(() => {});
  }
}
