import { PDFParse } from 'pdf-parse';

export async function readResume(buffer) {
 const parser = new PDFParse({ data: new Uint8Array(buffer) });
 try {
  const { text } = await parser.getText();
  return (text || '').replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
 } finally {
  await parser.destroy();
 }
}
