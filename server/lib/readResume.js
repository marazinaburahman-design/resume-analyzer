import { createRequire } from 'node:module';
import PDFParser from 'pdf2json';

const require = createRequire(import.meta.url);
// Load the parser implementation directly. The package entry point runs a bundled
// sample-PDF self-test in some serverless CommonJS/ESM interop environments.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

function cleanText(value) {
  return String(value || '')
    .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gm, '')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

async function readWithPdfParse(buffer) {
  const result = await pdfParse(Buffer.from(buffer));
  return cleanText(result?.text);
}

function readWithPdf2Json(buffer) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, 1);

    parser.on('pdfParser_dataError', (error) => {
      const detail = error?.parserError || error;
      reject(detail instanceof Error ? detail : new Error(String(detail?.message || detail || 'PDF parsing failed')));
    });

    parser.on('pdfParser_dataReady', (pdfData) => {
      try {
        const pages = Array.isArray(pdfData?.Pages) ? pdfData.Pages : [];
        const text = pages.map((page) => {
          const items = Array.isArray(page?.Texts) ? page.Texts : [];
          return items.map((item) => (item.R || [])
            .map((run) => {
              try {
                return decodeURIComponent(run.T || '');
              } catch {
                return run.T || '';
              }
            })
            .join(''))
            .join(' ');
        }).join('\n\n');
        resolve(cleanText(text));
      } catch (error) {
        reject(error);
      }
    });

    try {
      parser.parseBuffer(Buffer.from(buffer));
    } catch (error) {
      reject(error);
    }
  });
}

export async function readResume(buffer) {
  const failures = [];
  try {
    const text = await readWithPdfParse(buffer);
    if (text.length >= 20) return text;
    failures.push(new Error('Primary PDF parser returned too little text'));
  } catch (error) {
    failures.push(error);
  }

  try {
    const text = await readWithPdf2Json(buffer);
    if (text.length >= 20) return text;
    failures.push(new Error('Fallback PDF parser returned too little text'));
  } catch (error) {
    failures.push(error);
  }

  // Log parser diagnostics only; never log the uploaded PDF or its text.
  console.error('[PDF] All parsers failed:', failures.map((error) => error?.message || 'Unknown parser error').join(' | '));
  throw new Error('The PDF could not be parsed by either supported parser.');
}
