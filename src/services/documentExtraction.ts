import type { CredentialType, SubmittedDocument } from '../types';
import { claimsFromLines, type TextLine } from './extractedClaims';
import { readOriginal, storeOriginal } from './documentStore';
import { imageCanvas, isPdf, openPdf, renderPdfPage } from './pdfEngine';
import { createWorker, PSM, type Worker } from 'tesseract.js';
import { extractionWarnings } from './extractionQuality';

export const EXTRACTION_VERSION = 2;
export async function extractDocument(doc: SubmittedDocument, progress: (message: string) => void = () => {}) {
  const lines: TextLine[] = [];
  const scanWarnings: SubmittedDocument['qualityWarnings'] = [];
  let worker: Worker | undefined;
  let pdf: Awaited<ReturnType<typeof openPdf>> | undefined;
  const ocr = async (canvas: HTMLCanvasElement, page: number) => {
    if (Math.min(canvas.width, canvas.height) < 700) scanWarnings.push({ type: 'LOW_RESOLUTION', message: `Page ${page}: low image resolution; use a clearer scan and check every extracted value.`, severity: 'WARNING' });
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let min = 255, max = 0;
    for (let i=0;i<pixels.length;i+=4) { const gray=(pixels[i]+pixels[i+1]+pixels[i+2])/3; min=Math.min(min,gray); max=Math.max(max,gray); }
    if (max-min < 8) { scanWarnings.push({ type: 'NO_TEXT', message: `Page ${page}: blank or too faint to read.`, severity: 'CRITICAL' }); return; }
    if (!worker) {
      const base = new URL(import.meta.env.BASE_URL, window.location.origin).href;
      worker = await createWorker('eng', 1, {
        workerPath: `${base}ocr/worker.min.js`, corePath: `${base}ocr`, langPath: `${base}ocr`,
        logger: m => progress(`Page ${page}: ${m.status} ${Math.round((m.progress || 0) * 100)}%`),
      });
      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    }
    const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true });
    const previousCount=lines.length;
    for (const block of data.blocks || []) for (const paragraph of block.paragraphs) for (const line of paragraph.lines) {
      lines.push({ text: line.text, confidence: Math.round(line.confidence), method: 'OCR', region: {
        page, x: line.bbox.x0 / canvas.width * 100, y: line.bbox.y0 / canvas.height * 100,
        width: (line.bbox.x1 - line.bbox.x0) / canvas.width * 100,
        height: (line.bbox.y1 - line.bbox.y0) / canvas.height * 100, label: 'OCR text',
      } });
    }
    if (lines.length===previousCount) scanWarnings.push({ type: 'NO_TEXT', message: `Page ${page}: no readable text found; check the original.`, severity: 'WARNING' });
  };
  try {
    const blob = await readOriginal(doc);
    if (await isPdf(blob)) {
      pdf = await openPdf(blob);
      doc = { ...doc, mimeType: 'application/pdf', totalPages: pdf.numPages };
      if (pdf.numPages > 50) throw new Error('This PDF exceeds the 50-page extraction limit. Split it into smaller files.');
      for (let p = 1; p <= pdf.numPages; p++) {
        progress(`Reading PDF page ${p} of ${pdf.numPages}`);
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const items = content.items.filter((item): item is import('pdfjs-dist/types/src/display/api').TextItem => 'str' in item && !!item.str.trim());
        if (items.map(i => i.str).join('').trim().length >= 20) {
          const viewport = page.getViewport({ scale: 1 });
          // Combine adjacent PDF text items on each visual line, preserving reading order.
          const rows: Array<{ text: string; x: number; y: number; width: number; height: number }> = [];
          for (const item of items) {
            const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
            const h = Math.max(item.height, Math.abs(item.transform[3]), 1);
            const previous = rows.at(-1);
            if (previous && Math.abs(previous.y - y) < h * 0.4 && x >= previous.x) {
              previous.text += ` ${item.str}`;
              previous.width = Math.max(previous.width, x + item.width - previous.x);
            } else rows.push({ text: item.str, x, y, width: item.width, height: h });
          }
          lines.push(...rows.map(row => ({ text: row.text, confidence: null, method: 'PDF_TEXT' as const, region: {
            page: p, x: row.x / viewport.width * 100, y: Math.max(0, row.y - row.height) / viewport.height * 100,
            width: Math.min(100, row.width / viewport.width * 100), height: row.height / viewport.height * 100,
            label: 'PDF text',
          } })));
        } else {
          const { canvas } = await renderPdfPage(pdf, p);
          await ocr(canvas, p);
          canvas.width = canvas.height = 0;
        }
        page.cleanup();
      }
    } else {
      doc = { ...doc, mimeType: blob.type || doc.mimeType, totalPages: 1 };
      const canvas = await imageCanvas(blob);
      await ocr(canvas, 1);
      canvas.width = canvas.height = 0;
    }
    const extractedFields = claimsFromLines(doc.id, lines, doc.credentialType);
    if (!lines.some(line => (line.text.match(/[a-z0-9]/gi) || []).length >= 3)) throw new Error('No readable text found. Try a clearer scan or add evidence manually.');
    return { ...doc, extractedFields, rawText: lines.map(l => l.text).join('\n'),
      qualityWarnings: [...scanWarnings, ...extractionWarnings({ credentialType: doc.credentialType, extractedFields })],
      extractionVersion: EXTRACTION_VERSION, extractionStatus: 'COMPLETE' as const,
      extractionError: undefined, status: 'NEEDS_REVIEW' as const };
  } catch (error) {
    return { ...doc, extractedFields: [], extractionVersion: EXTRACTION_VERSION, extractionStatus: 'FAILED' as const,
      rawText: lines.map(l => l.text).join('\n'), qualityWarnings: scanWarnings,
      extractionError: error instanceof Error ? error.message : 'Extraction failed. Please retry.', status: 'NEEDS_REVIEW' as const };
  } finally { await worker?.terminate(); await pdf?.loadingTask.destroy(); }
}

export async function ingestDocument(file: File, credentialType: CredentialType, progress?: (message: string) => void) {
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) throw new Error('Choose a PDF, JPEG or PNG file.');
  if (file.size > 25_000_000 || file.size === 0) throw new Error('Choose a nonempty document no larger than 25 MB.');
  const id = `doc_${crypto.randomUUID()}`;
  await storeOriginal(id, file);
  return extractDocument({
    id, candidateId: '', credentialType, credentialTitle: credentialType.replace(/_/g, ' '),
    fileName: file.name, fileSizeBytes: file.size, uploadTimestamp: new Date().toISOString(),
    mimeType: file.type, totalPages: 1, extractedFields: [], qualityWarnings: [], originalStorageStatus: 'LOCAL_ONLY',
    status: 'PENDING', vectorDocType: 'STANDARD_CERTIFICATE', extractionStatus: 'PENDING',
  }, progress);
}
