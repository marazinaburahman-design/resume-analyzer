import PDFParser from 'pdf2json';

export async function readResume(buffer) {
 return new Promise((resolve, reject) => {
  const parser = new PDFParser(null, 1);

  parser.on('pdfParser_dataError', (error) => {
   const detail = error?.parserError || error;
   console.error('[PDF] Parsing failed:', detail?.name || 'Error', detail?.message || 'Unknown parser error');
   reject(detail instanceof Error ? detail : new Error(String(detail)));
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

    resolve(text
     .replace(/\s+/g, ' ')
     .replace(/\s*\n\s*/g, '\n')
     .trim());
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
