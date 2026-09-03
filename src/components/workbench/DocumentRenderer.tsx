import React, { useState, useRef, useEffect } from 'react';
import { SubmittedDocument, ExtractedField, EvidenceRegion } from '../../types';
import { Award, Shield, BookOpen, FileSpreadsheet, Building, Crop, Plus, Sparkles } from 'lucide-react';

interface DocumentRendererProps {
  document: SubmittedDocument;
  activeFieldId: string | null;
  onSelectField: (fieldId: string) => void;
  currentPage: number;
  rotation: number;
  zoomLevel: number;
  isDrawMode?: boolean;
  onBoxDrawn?: (region: EvidenceRegion) => void;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  document,
  activeFieldId,
  onSelectField,
  currentPage,
  rotation,
  zoomLevel,
  isDrawMode = false,
  onBoxDrawn,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Mouse drag handlers for drawing bounding box
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const left = Math.min(startPoint.x, currentX);
    const top = Math.min(startPoint.y, currentY);
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);

    setCurrentBox({ x: left, y: top, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentBox(null);
      return;
    }

    setIsDrawing(false);
    setStartPoint(null);

    // Minimum bounding box dimension threshold (at least 3% x 2%)
    if (currentBox.width > 3 && currentBox.height > 2 && onBoxDrawn) {
      onBoxDrawn({
        page: currentPage,
        x: currentBox.x,
        y: currentBox.y,
        width: currentBox.width,
        height: currentBox.height,
        label: 'Custom Evidence Region',
      });
    }
    setCurrentBox(null);
  };

  // Render authentic vector documents based on credential type
  const renderVectorContent = () => {
    switch (document.vectorDocType) {
      case 'DEGREE':
        return (
          <div className="w-full h-full p-8 sm:p-12 flex flex-col justify-between items-center text-center bg-[#FCFBF7] border-8 border-double border-[#D4AF37]/50 relative select-none">
            {/* Watermark Seal */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Award className="w-96 h-96 text-slate-900" />
            </div>

            {/* University Header */}
            <div className="space-y-2 z-10">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#17324D] text-[#D4AF37] flex items-center justify-center shadow-xs">
                <Building className="w-7 h-7" />
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#17324D] tracking-wide uppercase">
                National University of Pacifica
              </h1>
              <p className="text-[11px] font-serif uppercase tracking-widest text-[#5B6777]">
                School of Law & Jurisprudence • Founded 1888
              </p>
              <div className="w-32 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
            </div>

            {/* Degree Conferral Body */}
            <div className="space-y-4 my-6 z-10 max-w-md">
              <p className="text-xs font-serif italic text-slate-600">
                Be it known to all whom these presents may come, that the Trustees and Faculty, by virtue of statutory authority, have conferred upon
              </p>

              {/* Candidate Name Region */}
              <div
                onClick={() => onSelectField('fld_001')}
                className={`p-2 rounded-sm transition-all cursor-pointer ${
                  activeFieldId === 'fld_001'
                    ? 'border-2 border-[#2F75B5] bg-[#2F75B5]/20 shadow-sm'
                    : 'border border-dashed border-[#2F75B5]/30 hover:bg-[#2F75B5]/10'
                }`}
              >
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#17202A] tracking-wider underline decoration-[#D4AF37] decoration-2 underline-offset-4">
                  Dr. Arthur Sterling-Morales
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">Reg: VSU-LAW-1999-0482</span>
              </div>

              <p className="text-xs font-serif italic text-slate-600">
                the degree of
              </p>

              {/* Degree Title Region */}
              <div
                onClick={() => onSelectField('fld_002')}
                className={`p-2 rounded-sm transition-all cursor-pointer ${
                  activeFieldId === 'fld_002'
                    ? 'border-2 border-[#2F75B5] bg-[#2F75B5]/20 shadow-sm'
                    : 'border border-dashed border-[#2F75B5]/30 hover:bg-[#2F75B5]/10'
                }`}
              >
                <h3 className="text-lg font-serif font-bold text-[#17324D]">
                  Doctor of Juridical Science (Juris Doctor)
                </h3>
              </div>

              {/* Date Region */}
              <div
                onClick={() => onSelectField('fld_003')}
                className={`p-2 rounded-sm transition-all cursor-pointer ${
                  activeFieldId === 'fld_003'
                    ? 'border-2 border-[#2F75B5] bg-[#2F75B5]/20 shadow-sm'
                    : 'border border-dashed border-[#2F75B5]/30 hover:bg-[#2F75B5]/10'
                }`}
              >
                <p className="text-xs font-serif text-slate-700">
                  Conferred at Metropolis Central, on the <strong className="text-[#17202A]">12th day of June, 2002</strong>
                </p>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="w-full flex items-end justify-between pt-6 border-t border-slate-300/80 z-10 text-[11px] font-serif text-slate-700">
              <div className="text-center">
                <div className="w-24 h-6 border-b border-slate-400 mx-auto italic text-slate-500 text-[10px]">
                  C. Hawthorne
                </div>
                <span>Dean of Faculty</span>
              </div>

              {/* Gold Foil Seal Representation */}
              <div className="w-16 h-16 rounded-full border-4 border-[#D4AF37] bg-amber-100/60 flex flex-col items-center justify-center text-[8px] font-bold text-[#D4AF37] uppercase shadow-xs">
                <span>Official</span>
                <span className="text-[10px]">★</span>
                <span>Seal</span>
              </div>

              <div className="text-center">
                <div className="w-24 h-6 border-b border-slate-400 mx-auto italic text-slate-500 text-[10px]">
                  V. Kensington
                </div>
                <span>University Chancellor</span>
              </div>
            </div>
          </div>
        );

      case 'BAR_LICENSE':
        return (
          <div className="w-full h-full p-8 sm:p-12 flex flex-col justify-between bg-[#F8F9FA] border-4 border-[#17324D] relative select-none">
            {/* Header */}
            <div className="border-b-2 border-[#17324D] pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#17324D] uppercase tracking-wider">
                  Supreme Judicial Bar of Pacifica
                </h1>
                <p className="text-[11px] text-slate-600">
                  Official Certificate of Active Standing & Practice Roll
                </p>
              </div>
              <Shield className="w-8 h-8 text-[#17324D]" />
            </div>

            {/* License Body */}
            <div className="space-y-4 my-6 text-xs text-slate-800 leading-relaxed">
              <p>
                This is to officially certify that pursuant to Section 44 of the Legal Practitioners Act:
              </p>

              <div
                onClick={() => onSelectField('fld_004')}
                className={`p-2.5 bg-white rounded-sm transition-all cursor-pointer ${
                  activeFieldId === 'fld_004'
                    ? 'border-2 border-[#2F75B5] bg-[#2F75B5]/15 shadow-xs'
                    : 'border border-dashed border-slate-300 hover:border-[#2F75B5]/40 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-500 text-[10px] uppercase">Practitioner:</div>
                <div className="font-bold text-[#17202A] text-sm">Arthur Sterling-Morales</div>
                <div className="font-mono text-slate-600 text-[11px] mt-0.5">Roll No: BAR-PAC-2003-8819</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => onSelectField('fld_005')}
                  className={`p-2.5 bg-white rounded-sm transition-all cursor-pointer ${
                    activeFieldId === 'fld_005'
                      ? 'border-2 border-[#2F75B5] bg-[#2F75B5]/15 shadow-xs'
                      : 'border border-dashed border-slate-300 hover:border-[#2F75B5]/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-slate-500 text-[10px] uppercase">Admission Date:</div>
                  <div className="font-bold text-[#17202A]">October 15, 2003</div>
                </div>

                <div className="p-2.5 bg-white border border-slate-300 rounded-sm">
                  <div className="font-semibold text-slate-500 text-[10px] uppercase">Disciplinary Record:</div>
                  <div className="font-bold text-[#237A57]">No Disciplinary Sanctions</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 italic">
                The attorney named herein is in good standing and authorized to practice before all Courts of the State.
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Security Stamp: #SEC-99182</span>
              <span>Issued: Jan 10, 2026</span>
            </div>
          </div>
        );

      case 'CITIZENSHIP_CERT':
      default:
        // If this is a locally uploaded image preview
        if (document.fileUrl) {
          return (
            <div className="w-full h-full relative select-none">
              <img 
                src={document.fileUrl} 
                alt="Document preview" 
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          );
        }

        return (
          <div className="w-full h-full p-8 sm:p-12 flex flex-col justify-between bg-white border-4 border-slate-300 relative select-none">
            <div className="text-center border-b border-slate-200 pb-4 space-y-1">
              <h1 className="text-lg font-bold text-[#17324D] uppercase">
                Republic of Pacifica • Civil Status Registry
              </h1>
              <p className="text-xs text-slate-600">
                Official National Identity & Citizenship Verification Record
              </p>
            </div>

            <div className="space-y-4 my-6 text-xs text-slate-800">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">National ID Number:</span>
                  <span className="font-mono font-bold text-[#17202A]">PAC-ID-881920-A</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Full Legal Name:</span>
                  <span className="font-bold text-[#17202A]">Elena S. Vance</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Citizenship Classification:</span>
                  <span className="font-bold text-[#237A57]">Citizen by Birth (Article IV, §1)</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex justify-between">
              <span>Registrar Seal Affixed</span>
              <span>Doc Ref: NRCS-2026-CERT</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-8 overflow-auto">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`bg-white shadow-xl rounded-lg border border-slate-300 transition-all duration-150 origin-center relative select-none ${
          isDrawMode ? 'cursor-crosshair' : 'cursor-default'
        }`}
        style={{
          width: `${600 * (zoomLevel / 100)}px`,
          minHeight: `${800 * (zoomLevel / 100)}px`,
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* Vector Document Content */}
        {renderVectorContent()}

        {/* Dynamic Bounding Box Overlay for Existing Extracted Fields */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {document.extractedFields
            .filter((f) => f.evidencePage === currentPage && f.evidenceRegion)
            .map((f) => {
              const isSelected = f.id === activeFieldId;
              const reg = f.evidenceRegion;
              return (
                <div
                  key={f.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectField(f.id);
                  }}
                  className={`absolute pointer-events-auto transition-all rounded-[2px] cursor-pointer group ${
                    isSelected
                      ? 'border-2 border-[#2F75B5] bg-[#2F75B5]/20 ring-2 ring-[#2F75B5]/30'
                      : f.status === 'VERIFIED'
                      ? 'border border-dashed border-emerald-500/80 bg-emerald-500/10 hover:bg-emerald-500/20'
                      : f.status === 'CONTRADICTED'
                      ? 'border border-dashed border-red-500/80 bg-red-500/10 hover:bg-red-500/20'
                      : 'border border-dashed border-[#2F75B5]/50 bg-[#2F75B5]/5 hover:bg-[#2F75B5]/15'
                  }`}
                  style={{
                    left: `${reg.x}%`,
                    top: `${reg.y}%`,
                    width: `${reg.width}%`,
                    height: `${reg.height}%`,
                  }}
                >
                  {/* Bounding box label tag */}
                  <span
                    className={`absolute -top-4 left-0 text-[9px] font-mono font-bold px-1 py-0.2 rounded shadow-xs whitespace-nowrap z-30 transition-opacity ${
                      isSelected
                        ? 'bg-[#17324D] text-white opacity-100'
                        : 'bg-slate-800/80 text-white/90 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {f.fieldName} ({f.extractionConfidence}%)
                  </span>
                </div>
              );
            })}
        </div>

        {/* Live Drawing Preview Box */}
        {isDrawing && currentBox && (
          <div
            className="absolute border-2 border-dashed border-[#16838D] bg-[#16838D]/25 z-30 pointer-events-none rounded-sm flex items-center justify-center shadow-lg"
            style={{
              left: `${currentBox.x}%`,
              top: `${currentBox.y}%`,
              width: `${currentBox.width}%`,
              height: `${currentBox.height}%`,
            }}
          >
            <span className="bg-[#17324D] text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
              {currentBox.width.toFixed(0)}% × {currentBox.height.toFixed(0)}%
            </span>
          </div>
        )}

        {/* Draw Mode Active Watermark/Hint */}
        {isDrawMode && !isDrawing && (
          <div className="absolute top-3 right-3 bg-[#17324D]/90 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow-md z-30 pointer-events-none flex items-center gap-1.5 animate-pulse">
            <Crop className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Click & Drag to Draw Evidence Region</span>
          </div>
        )}
      </div>
    </div>
  );
};
