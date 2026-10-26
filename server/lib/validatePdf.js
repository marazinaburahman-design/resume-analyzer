const PDF_SIGNATURE = Buffer.from('%PDF-');

export function hasPdfSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < PDF_SIGNATURE.length) return false;
  // The PDF specification expects the header near the beginning of the file;
  // allow a small prefix for PDFs with a permitted leading byte sequence.
  return buffer.subarray(0, 1024).includes(PDF_SIGNATURE);
}
