import { mkdir, copyFile, readdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'public/ocr');
await mkdir(output, { recursive: true });
await copyFile(resolve(root, 'node_modules/tesseract.js/dist/worker.min.js'), resolve(output, 'worker.min.js'));
for (const file of await readdir(resolve(root, 'node_modules/tesseract.js-core'))) {
  if (file.endsWith('.wasm') || file.endsWith('.wasm.js')) {
    await copyFile(resolve(root, 'node_modules/tesseract.js-core', file), resolve(output, file));
  }
}
await copyFile(resolve(root, 'node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz'), resolve(output, 'eng.traineddata.gz'));
for (const directory of ['cmaps', 'standard_fonts', 'wasm']) {
  await cp(resolve(root, 'node_modules/pdfjs-dist', directory), resolve(root, 'public/pdf-assets', directory), { recursive: true });
}
console.log('Prepared same-origin OCR and PDF assets.');
