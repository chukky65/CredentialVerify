import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentRenderer } from './DocumentRenderer';
import { FieldCorrectionModal } from './FieldCorrectionModal';
import { NewFieldModal } from './NewFieldModal';
import { DecisionModal } from '../screens/DecisionModal';
import { DossierModal } from '../screens/DossierModal';
import { IssueRFIModal } from '../screens/IssueRFIModal';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { ExtractedField, CorrectionReasonCode, RecommendationRecord, EvidenceRegion } from '../../types';
import { verificationService } from '../../services/verificationService';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Edit3,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ArrowLeft,
  Eye,
  FileCheck2,
  XCircle,
  FileQuestion,
  MessageSquare,
  Sparkles,
  Crop,
  Plus,
  Trash2,
  BookOpen,
  Send,
} from 'lucide-react';

export const DocumentWorkbench: React.FC = () => {
  const {
    activeCaseId,
    activeDocumentId,
    cases,
    candidates,
    navigateTo,
    setActiveDocumentId,
    addToast,
    refreshData,
    currentUser,
  } = useApp();

  // Active case and candidate
  const currentCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const candidate = candidates.find((cand) => cand.id === currentCase?.candidateId) || candidates[0];

  // Active document
  const activeDoc =
    candidate?.documents.find((d) => d.id === activeDocumentId) ||
    candidate?.documents[0] ||
    null;

  // Viewer state
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);

  // Field selection and correction state
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    activeDoc?.extractedFields[0]?.id || null
  );
  const [fieldToCorrect, setFieldToCorrect] = useState<ExtractedField | null>(null);
  const [newDrawnRegion, setNewDrawnRegion] = useState<EvidenceRegion | null>(null);
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState<boolean>(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false);
  const [isIssueRFIModalOpen, setIsIssueRFIModalOpen] = useState<boolean>(false);
  const [filterFieldStatus, setFilterFieldStatus] = useState<string>('ALL');
  const [mobileTab, setMobileTab] = useState<'packet' | 'viewer' | 'fields'>('viewer');

  // Zoom controls
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 180));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoomLevel(100);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Handle bounding box drawn callback from DocumentRenderer
  const handleBoxDrawn = (region: EvidenceRegion) => {
    setNewDrawnRegion(region);
    setIsNewFieldModalOpen(true);
    setIsDrawMode(false);
  };

  // Save new drawn field to candidate document
  const handleSaveNewField = async (data: {
    fieldName: string;
    fieldKey: string;
    extractedValue: string;
    evidenceLabel: string;
  }) => {
    if (!activeDoc || !candidate || !newDrawnRegion) return;

    const newFieldData: Omit<ExtractedField, 'id'> = {
      fieldName: data.fieldName,
      fieldKey: data.fieldKey,
      originalValue: data.extractedValue,
      normalizedValue: data.extractedValue,
      isCorrected: false,
      extractionConfidence: 94,
      status: 'VERIFIED',
      evidencePage: currentPage,
      evidenceRegion: {
        ...newDrawnRegion,
        label: data.evidenceLabel,
      },
      sourceStatus: 'MATCHED',
    };

    const created = await verificationService.addExtractedField(
      candidate.id,
      activeDoc.id,
      newFieldData,
      currentUser.name,
      currentUser.role
    );

    if (created) {
      await refreshData();
      setSelectedFieldId(created.id);
      addToast(
        `Custom evidence claim [${data.fieldName}] mapped and logged to audit ledger.`,
        'success'
      );
    }
  };

  // Delete custom field
  const handleDeleteField = async (fieldId: string, fieldName: string) => {
    if (!activeDoc || !candidate) return;
    const success = await verificationService.deleteExtractedField(
      candidate.id,
      activeDoc.id,
      fieldId,
      currentUser.name,
      currentUser.role
    );
    if (success) {
      await refreshData();
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(null);
      }
      addToast(`Evidence annotation [${fieldName}] removed.`, 'info');
    }
  };

  // Field verification action
  const handleConfirmField = async (fieldId: string) => {
    if (!activeDoc || !candidate) return;
    await verificationService.updateExtractedField(
      candidate.id,
      activeDoc.id,
      fieldId,
      { status: 'VERIFIED' },
      currentUser.name,
      currentUser.role
    );
    await refreshData();
    addToast('Field verified and confirmed against document evidence.', 'success');
  };

  // Field correction action
  const handleSaveCorrection = async (
    fieldId: string,
    correctedValue: string,
    reasonCode: CorrectionReasonCode,
    note: string
  ) => {
    if (!activeDoc || !candidate) return;
    await verificationService.updateExtractedField(
      candidate.id,
      activeDoc.id,
      fieldId,
      {
        correctedValue,
        isCorrected: true,
        correctionReasonCode: reasonCode,
        correctionNote: note,
        status: 'VERIFIED',
      },
      currentUser.name,
      currentUser.role
    );
    await refreshData();
    addToast(`Correction applied to [${correctedValue}]. Preserved in audit ledger.`, 'success');
  };

  const handleMarkStatus = async (fieldId: string, status: 'UNREADABLE' | 'UNSUPPORTED') => {
    if (!activeDoc || !candidate) return;
    await verificationService.updateExtractedField(
      candidate.id,
      activeDoc.id,
      fieldId,
      { status: status === 'UNREADABLE' ? 'INFO_REQUIRED' : 'CONTRADICTED' },
      currentUser.name,
      currentUser.role
    );
    await refreshData();
    addToast(`Field marked as ${status.replace('_', ' ')}.`, 'warning');
  };

  const handleRecordRecommendation = async (rec: RecommendationRecord) => {
    if (!currentCase) return;
    await verificationService.recordRecommendation(currentCase.id, rec);
    await refreshData();
    addToast(`Recommendation recorded for case ${currentCase.caseReference}.`, 'success');
  };

  if (!candidate || !activeDoc) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600">No document found in active case file.</p>
        <button
          type="button"
          onClick={() => navigateTo('queue')}
          className="mt-4 px-4 py-2 bg-[#17324D] text-white text-xs font-semibold rounded-md"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  // Filter fields
  const filteredFields = activeDoc.extractedFields.filter((f) => {
    if (filterFieldStatus !== 'ALL' && f.status !== filterFieldStatus) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-8.5rem)] space-y-3">
      {/* Workbench Header Bar */}
      <div className="bg-white p-3 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => navigateTo('case-overview', { caseId: currentCase.id, candidateId: candidate.id })}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#17324D] px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Case Overview</span>
          </button>

          <div className="hidden sm:block h-4 w-px bg-slate-200" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs text-[#17324D]">
                {candidate.referenceCode}
              </span>
              <span className="font-bold text-xs text-[#17202A] truncate">
                {candidate.fullName}
              </span>
            </div>
            <p className="text-[11px] text-[#5B6777] truncate max-w-md">
              {candidate.officeContested} • {candidate.electionName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          <StatusBadge status={currentCase.workflowStatus} size="sm" />
          
          <button
            type="button"
            id="workbench-issue-rfi-btn"
            onClick={() => setIsIssueRFIModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-semibold text-[#17324D] bg-white border border-slate-300 hover:bg-slate-50 rounded-md shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Issue statutory clarification notice for uncorroborated document"
          >
            <Send className="w-3.5 h-3.5 text-[#2F75B5]" />
            <span className="hidden sm:inline">Issue</span> RFI
          </button>

          <button
            type="button"
            id="workbench-compile-dossier-btn"
            onClick={() => setIsDossierModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#17324D] bg-[#F4EDE4] border border-[#D4AF37]/50 hover:bg-[#EAE0D2] rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            title="Compile Statutory Evidence Dossier & Case Binder"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#B7791F]" />
            <span className="hidden sm:inline">Compile</span> Dossier
          </button>

          <button
            type="button"
            onClick={() => setIsDecisionModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#237A57] hover:bg-[#1b6145] rounded-md shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Recommend</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible on < lg screens) */}
      <div className="flex lg:hidden bg-white p-1 rounded-lg border border-slate-200 shadow-2xs gap-1 text-xs font-semibold shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('packet')}
          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'packet'
              ? 'bg-[#17324D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Packet ({candidate.documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('viewer')}
          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'viewer'
              ? 'bg-[#17324D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Document Viewer</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('fields')}
          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'fields'
              ? 'bg-[#17324D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Claims ({activeDoc?.extractedFields.length || 0})</span>
        </button>
      </div>

      {/* 3-Panel Workspace Grid */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {/* PANEL 1: Document Thumbnails & Packet (Left 3 cols) */}
        <div className={`col-span-12 lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs flex-col overflow-hidden ${
          mobileTab === 'packet' ? 'flex' : 'hidden lg:flex'
        }`}>
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
              Document Packet ({candidate.documents.length})
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Scanned In</span>
          </div>

          <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
            {candidate.documents.map((doc, idx) => {
              const isSelected = doc.id === activeDoc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setActiveDocumentId(doc.id);
                    setSelectedFieldId(doc.extractedFields[0]?.id || null);
                    setMobileTab('viewer');
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#2F75B5] bg-[#2F75B5]/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-[#2F75B5]' : 'text-slate-500'
                        }`}
                      />
                      <span className="text-xs font-bold text-[#17202A] truncate max-w-[150px]">
                        {doc.credentialTitle}
                      </span>
                    </div>
                    <StatusBadge status={doc.status} size="sm" />
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono mt-1 truncate">
                    {doc.fileName}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <span>{doc.totalPages} page(s)</span>
                    <span>{doc.extractedFields.length} structured claim(s)</span>
                  </div>

                  {doc.qualityWarnings.length > 0 && (
                    <div className="mt-1.5 p-1 bg-amber-50 text-amber-800 text-[10px] rounded border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{doc.qualityWarnings[0].message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Evidence intake certified under official seal
          </div>
        </div>

        {/* PANEL 2: Document Viewer Canvas (Center 5 or 6 cols) */}
        <div className={`col-span-12 lg:col-span-5 bg-[#E1E5EB] rounded-xl border border-slate-300/80 shadow-inner flex-col items-center justify-between p-3 sm:p-4 relative overflow-hidden min-h-[440px] ${
          mobileTab === 'viewer' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Interactive Document Renderer Area */}
          <div className="flex-1 w-full overflow-auto flex items-center justify-center py-2">
            <DocumentRenderer
              document={activeDoc}
              activeFieldId={selectedFieldId}
              onSelectField={(id) => setSelectedFieldId(id)}
              currentPage={currentPage}
              rotation={rotation}
              zoomLevel={zoomLevel}
              isDrawMode={isDrawMode}
              onBoxDrawn={handleBoxDrawn}
            />
          </div>

          {/* Floating Dark Inspector Pill Bar with Draw Evidence Toggle */}
          <div className="mt-3 bg-[#17324D] rounded-full px-4 py-2 flex items-center space-x-3 text-white text-xs shadow-xl shrink-0 z-20 select-none">
            {/* Draw Bounding Box Toggle */}
            <button
              type="button"
              id="toggle-draw-mode-btn"
              onClick={() => {
                setIsDrawMode((prev) => !prev);
                if (!isDrawMode) {
                  addToast('Draw Mode Activated: Click and drag on the document canvas to mark a region.', 'info');
                }
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isDrawMode
                  ? 'bg-[#D4AF37] text-[#17324D] shadow-md ring-2 ring-amber-300'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title="Click and drag on the document to draw a custom evidence bounding box"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{isDrawMode ? 'Drawing...' : 'Draw Box'}</span>
            </button>

            <span className="w-px h-3.5 bg-white/20" />

            <button
              type="button"
              onClick={handleZoomOut}
              className="hover:text-[#16838D] transition-colors flex items-center gap-1 font-medium"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zoom</span>
            </button>

            <span className="font-mono text-xs font-semibold px-1 text-white/90">
              {zoomLevel}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              className="hover:text-[#16838D] transition-colors flex items-center gap-1 font-medium"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-3.5 bg-white/20" />

            <button
              type="button"
              onClick={handleRotate}
              className="hover:text-[#16838D] transition-colors flex items-center gap-1 font-medium"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-3.5 bg-white/20" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="hover:text-[#16838D] disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px]">
                {currentPage}/{activeDoc.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, activeDoc.totalPages))}
                disabled={currentPage === activeDoc.totalPages}
                className="hover:text-[#16838D] disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* PANEL 3: Extracted Claims & Verification (Right 4 cols) */}
        <div className={`col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex-col overflow-hidden ${
          mobileTab === 'fields' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Header & Filter */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
                  Extracted Evidence Claims
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-[#2F75B5] font-bold">
                  {activeDoc.extractedFields.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDrawMode(true);
                  setMobileTab('viewer');
                  addToast('Click and drag on the document canvas to mark a new evidence region.', 'info');
                }}
                className="px-2 py-1 text-[11px] font-bold text-[#17324D] bg-white border border-slate-300 hover:bg-slate-50 rounded flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3 h-3 text-[#2F75B5]" />
                <span>Add Region</span>
              </button>
            </div>

            <select
              value={filterFieldStatus}
              onChange={(e) => setFilterFieldStatus(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 text-[#17202A] focus:outline-none"
              aria-label="Filter claims by verification status"
            >
              <option value="ALL">All Extracted Fields ({activeDoc.extractedFields.length})</option>
              <option value="PENDING">Pending Review</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="VERIFIED">Verified & Confirmed</option>
              <option value="CONTRADICTED">Contradicted</option>
            </select>
          </div>

          {/* Fields List */}
          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {filteredFields.map((field) => {
              const isSelected = selectedFieldId === field.id;
              const isCustom = field.id.startsWith('fld_custom');

              return (
                <div
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'border-[#2F75B5] ring-2 ring-[#2F75B5]/20 bg-blue-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Field Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-[#17202A]">{field.fieldName}</h4>
                        {isCustom && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                            Custom Drawn
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Key: {field.fieldKey} • P{field.evidencePage}
                      </span>
                    </div>
                    <StatusBadge status={field.status} size="sm" />
                  </div>

                  {/* Confidence Bar */}
                  <ConfidenceIndicator score={field.extractionConfidence} />

                  {/* Field Values (Original vs Corrected) */}
                  <div className="space-y-1.5 text-xs">
                    <div className="bg-[#F5F7FA] p-2 rounded border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">
                        Extracted Value:
                      </span>
                      <span className="font-mono text-[#17202A] break-words">
                        {field.originalValue}
                      </span>
                    </div>

                    {field.isCorrected && (
                      <div className="bg-amber-50/70 p-2 rounded border border-amber-200 text-amber-950">
                        <span className="text-[10px] font-bold text-amber-800 block uppercase">
                          Authorized Corrected Value:
                        </span>
                        <span className="font-mono font-bold text-[#17202A]">
                          {field.correctedValue}
                        </span>
                        {field.correctionReasonCode && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Reason: {field.correctionReasonCode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Source status flag */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                    <span>Source Check:</span>
                    <StatusBadge status={field.sourceStatus} size="sm" />
                  </div>

                  {/* Review Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmField(field.id);
                      }}
                      className="flex-1 py-1.5 px-2 bg-[#237A57] text-white hover:bg-[#1b6145] text-xs font-semibold rounded flex items-center justify-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFieldToCorrect(field);
                      }}
                      className="py-1.5 px-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Correct</span>
                    </button>

                    {isCustom ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(field.id, field.fieldName);
                        }}
                        title="Delete Custom Region"
                        className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkStatus(field.id, 'UNREADABLE');
                        }}
                        title="Mark Unreadable"
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded"
                      >
                        <FileQuestion className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                const nextDocIndex = candidate.documents.findIndex((d) => d.id === activeDoc.id) + 1;
                if (nextDocIndex < candidate.documents.length) {
                  setActiveDocumentId(candidate.documents[nextDocIndex].id);
                  addToast(`Advanced to next document: ${candidate.documents[nextDocIndex].credentialTitle}`, 'info');
                } else {
                  addToast('All documents in this packet have been reviewed.', 'success');
                }
              }}
              className="w-full py-2 bg-[#17324D] text-white text-xs font-bold rounded hover:bg-[#0f2337] flex items-center justify-center gap-1.5"
            >
              <span>Next Document in Packet</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Field Correction Modal */}
      <FieldCorrectionModal
        isOpen={!!fieldToCorrect}
        onClose={() => setFieldToCorrect(null)}
        field={fieldToCorrect}
        onSave={handleSaveCorrection}
      />

      {/* New Field from Drawn Bounding Box Modal */}
      <NewFieldModal
        isOpen={isNewFieldModalOpen}
        onClose={() => {
          setIsNewFieldModalOpen(false);
          setNewDrawnRegion(null);
        }}
        evidenceRegion={newDrawnRegion}
        pageNumber={currentPage}
        onSave={handleSaveNewField}
      />

      {/* Recommendation Decision Modal */}
      <DecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        caseReference={currentCase.caseReference}
        candidateName={currentCase.candidateName}
        confirmedClaimsCount={candidate.documents.reduce((acc, d) => acc + d.extractedFields.filter((f) => f.status === 'VERIFIED').length, 0)}
        contradictedClaimsCount={currentCase.discrepanciesCount}
        onRecord={handleRecordRecommendation}
      />

      {/* Statutory Evidence Dossier Modal */}
      <DossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        caseRecord={currentCase}
        candidate={candidate}
      />

      {/* Issue Statutory Clarification Modal */}
      <IssueRFIModal
        isOpen={isIssueRFIModalOpen}
        onClose={() => setIsIssueRFIModalOpen(false)}
        caseId={currentCase.id}
        caseReference={currentCase.caseReference}
        candidateId={candidate.id}
        candidateName={candidate.fullName}
        initialCredentialType={activeDoc.credentialType}
        initialDiscrepancyRef={`Document Scope: ${activeDoc.credentialTitle} (${activeDoc.fileName})`}
        onIssued={async (rfiData) => {
          const created = await verificationService.createRFI(rfiData, currentUser.name, currentUser.role);
          if (created) {
            await refreshData();
            addToast(`Statutory Clarification [${created.rfiNumber}] issued to candidate.`, 'success');
          }
        }}
      />
    </div>
  );
};
