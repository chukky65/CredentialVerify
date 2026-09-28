import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function openPdf(blob: Blob) {
  const base = import.meta.env.BASE_URL;
  return pdfjs.getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    cMapUrl: `${base}pdf-assets/cmaps/`, cMapPacked: true,
    standardFontDataUrl: `${base}pdf-assets/standard_fonts/`,
    wasmUrl: `${base}pdf-assets/wasm/`,
  }).promise;
}

export async function renderPdfPage(pdf: pdfjs.PDFDocumentProxy, number: number) {
  const page = await pdf.getPage(number);
  const original = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: Math.min(2.5, 2200 / Math.max(original.width, original.height)) });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, viewport }).promise;
  return { canvas, page, viewport };
}

export async function isPdf(blob: Blob) {
  return (await blob.slice(0, 5).text()) === '%PDF-';
}

export async function imageCanvas(blob: Blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 2500 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally { URL.revokeObjectURL(url); }
}
