import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPdfSignature } from '../lib/validatePdf.js';

test('recognizes a PDF signature at the start of a file', () => {
  assert.equal(hasPdfSignature(Buffer.from('%PDF-1.7\nbody')), true);
});

test('allows a PDF signature within the first 1024 bytes', () => {
  assert.equal(hasPdfSignature(Buffer.concat([Buffer.from('%\n'), Buffer.from('%PDF-1.4\nbody')])), true);
});

test('rejects non-PDF and invalid buffer inputs', () => {
  assert.equal(hasPdfSignature(Buffer.from('not a pdf')), false);
  assert.equal(hasPdfSignature(null), false);
});
