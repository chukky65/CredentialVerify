import React, { useEffect, useRef, useState } from 'react';
import type { SubmittedDocument, EvidenceRegion } from '../../types';
import { readOriginal } from '../../services/documentStore';
import { imageCanvas, isPdf, openPdf, renderPdfPage } from '../../services/pdfEngine';

interface DocumentRendererProps {
  document: SubmittedDocument;
  activeFieldId: string | null;
  onSelectField: (id: string) => void;
  currentPage: number;
  rotation: number;
  zoomLevel: number;
  isDrawMode?: boolean;
  onBoxDrawn?: (region: EvidenceRegion) => void;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({ document: doc, activeFieldId, onSelectField, currentPage, rotation, zoomLevel, isDrawMode, onBoxDrawn }) => {
  const container = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<{ url: string; width: number; height: number } | null>(null);
  const [error, setError] = useState('');
  const [box, setBox] = useState<EvidenceRegion | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    setPreview(null); setError('');
    (async () => {
      try {
        const blob = await readOriginal(doc);
        let canvas: HTMLCanvasElement;
        if (await isPdf(blob)) {
          const pdf = await openPdf(blob);
          try { canvas = (await renderPdfPage(pdf, Math.min(currentPage, pdf.numPages))).canvas; }
          finally { await pdf.loadingTask.destroy(); }
        } else canvas = await imageCanvas(blob);
        const rendered = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Preview could not be rendered.')), 'image/png'));
        if (cancelled) return;
        url = URL.createObjectURL(rendered);
        setPreview({ url, width: canvas.width, height: canvas.height });
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Document preview failed.'); }
    })();
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [doc.id, doc.fileUrl, doc.uploadTimestamp, currentPage]);

  const point = (e: React.PointerEvent) => {
    const rect = container.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)), y: Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100)) };
  };
  if (error) return <div role="alert" className="p-8 text-center text-sm text-amber-900 bg-amber-50">{error}</div>;
  if (!preview) return <div role="status" className="p-8 text-center text-sm text-slate-600">Loading original document?</div>;
  return <div className="w-full h-full overflow-auto p-4 sm:p-8">
    {isDrawMode && rotation !== 0 && <p className="text-xs text-amber-900 mb-2">Reset rotation to draw an evidence region.</p>}
    <div ref={container} className="relative bg-white shadow-lg mx-auto shrink-0" style={{ width: 600 * zoomLevel / 100, maxWidth: zoomLevel === 100 ? '100%' : undefined, transform: 'rotate(' + rotation + 'deg)', touchAction: isDrawMode ? 'none' : 'auto' }}
      onPointerDown={e => {
        if (!isDrawMode || rotation !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId); start.current = point(e); setBox(null);
      }}
      onPointerMove={e => {
        if (!start.current) return;
        const p = point(e);
        setBox({ page: currentPage, x: Math.min(p.x, start.current.x), y: Math.min(p.y, start.current.y), width: Math.abs(p.x - start.current.x), height: Math.abs(p.y - start.current.y), label: 'Manual evidence region' });
      }}
      onPointerUp={() => { if (start.current && box && box.width > 1 && box.height > 1) onBoxDrawn?.(box); start.current = null; setBox(null); }}
      onPointerCancel={() => { start.current = null; setBox(null); }}>
      <img src={preview.url} width={preview.width} height={preview.height} alt={'Original document: ' + doc.fileName + ', page ' + currentPage} className="block w-full h-auto select-none pointer-events-none" />
      {doc.extractedFields.filter(f => f.evidencePage === currentPage && f.evidenceRegion).map(f => <button key={f.id} type="button" title={f.fieldName + ': ' + f.originalValue} aria-label={f.fieldName + ': ' + f.originalValue}
        onClick={() => onSelectField(f.id)} className={'absolute border ' + (isDrawMode ? 'pointer-events-none ' : '') + (activeFieldId === f.id ? 'border-blue-700 bg-blue-400/20' : 'border-dashed border-blue-400/40')}
        style={{ left: f.evidenceRegion.x + '%', top: f.evidenceRegion.y + '%', width: f.evidenceRegion.width + '%', height: f.evidenceRegion.height + '%' }} />)}
      {box && <div className="absolute border-2 border-dashed border-teal-600 bg-teal-300/20 pointer-events-none" style={{ left: box.x + '%', top: box.y + '%', width: box.width + '%', height: box.height + '%' }} />}
    </div>
  </div>;
};
