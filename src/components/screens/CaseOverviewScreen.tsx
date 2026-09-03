import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { MetricCard } from '../common/MetricCard';
import { DecisionModal } from './DecisionModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { DossierModal } from './DossierModal';
import { CaseRFISection } from './CaseRFISection';
import { IssueRFIModal } from './IssueRFIModal';
import { verificationService } from '../../services/verificationService';
import { RecommendationRecord } from '../../types';
import {
  FolderKanban,
  FileSearch,
  FileText,
  Building2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Send,
  Scale,
  ScrollText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  Layers,
  BookOpen,
} from 'lucide-react';

export const CaseOverviewScreen: React.FC = () => {
  const {
    activeCaseId,
    cases,
    candidates,
    navigateTo,
    setActiveCandidateId,
    setActiveDocumentId,
    addToast,
    refreshData,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'DOCUMENTS' | 'CLAIMS' | 'SOURCE_CHECKS' | 'HISTORY' | 'AUDIT' | 'NOTICES'
  >('OVERVIEW');

  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isIssueRFIModalOpen, setIsIssueRFIModalOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);

  // Find active case
  const currentCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const candidate = candidates.find((cand) => cand.id === currentCase?.candidateId) || candidates[0];

  const handleRecordDecision = async (record: RecommendationRecord) => {
    if (!currentCase) return;
    await verificationService.recordRecommendation(currentCase.id, record);
    await refreshData();
    addToast(`Recommendation [${record.recommendationType.replace(/_/g, ' ')}] recorded for ${currentCase.caseReference}.`, 'success');
  };

  const handleIssueRFI = async (rfiData: any) => {
    const created = await verificationService.createRFI(rfiData, currentUser.name, currentUser.role);
    if (created) {
      await refreshData();
      setActiveTab('NOTICES');
      addToast(`Statutory Clarification [${created.rfiNumber}] issued to ${created.candidateName}.`, 'success');
    }
  };

  const handleEscalateConfirm = () => {
    setIsEscalateOpen(false);
    addToast(`Case ${currentCase?.caseReference} escalated to Senior Adjudication Queue.`, 'warning');
  };

  if (!currentCase) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600">No active case selected.</p>
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

  return (
    <div className="space-y-6 pb-16">
      {/* Case Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-[#17324D] bg-slate-100 px-2 py-0.5 rounded">
                {currentCase.caseReference}
              </span>
              <StatusBadge status={currentCase.workflowStatus} size="md" />
              <StatusBadge status={currentCase.priority} size="md" />
            </div>
            <h2 className="text-xl font-bold text-[#17202A] tracking-tight">
              {currentCase.candidateName}
            </h2>
            <p className="text-xs text-[#5B6777]">
              Contesting: <strong className="text-[#17202A]">{currentCase.officeContested}</strong> • {currentCase.electionName}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="generate-dossier-btn"
              onClick={() => setIsDossierModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#17324D] bg-[#F4EDE4] border border-[#D4AF37]/50 hover:bg-[#EAE0D2] rounded-md shadow-xs transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#B7791F]" />
              <span>Compile Dossier</span>
            </button>

            <button
              type="button"
              id="open-workbench-btn"
              onClick={() => {
                setActiveCandidateId(candidate.id);
                if (candidate.documents.length > 0) {
                  setActiveDocumentId(candidate.documents[0].id);
                }
                navigateTo('workbench', { caseId: currentCase.id, candidateId: candidate.id });
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#17324D] hover:bg-[#0f2337] rounded-md shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
            >
              <FileSearch className="w-4 h-4" />
              <span>Document Review Workbench</span>
            </button>

            <button
              type="button"
              id="btn-request-info-rfi"
              onClick={() => setIsIssueRFIModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#17324D] bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5 text-[#2F75B5]" />
              <span>Issue Statutory RFI</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEscalateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100"
            >
              <Scale className="w-3.5 h-3.5 text-amber-700" />
              <span>Escalate</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDecisionModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#237A57] hover:bg-[#1c6447] rounded-md shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Recommendation</span>
            </button>
          </div>
        </div>

        {/* Metadata Details Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Assigned Reviewer</span>
            <span className="font-semibold text-[#17202A]">{currentCase.assignedReviewerName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Submission Ingestion</span>
            <span className="font-tabular font-semibold text-[#17202A]">{currentCase.submissionDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">SLA Target Deadline</span>
            <span className="font-tabular font-semibold text-[#B83232]">{currentCase.slaDeadline}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Current Stage</span>
            <span className="font-semibold text-[#2F75B5] uppercase">{currentCase.stage.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          id="metric-docs"
          title="Documents Submitted"
          value={candidate.documents.length}
          sublabel="All scanned clean"
          icon={<FileText className="w-4 h-4 text-[#17324D]" />}
        />
        <MetricCard
          id="metric-claims"
          title="Claims Extracted"
          value={candidate.documents.reduce((acc, d) => acc + d.extractedFields.length, 0)}
          sublabel="Automated analysis"
          icon={<FileSearch className="w-4 h-4 text-[#2F75B5]" />}
        />
        <MetricCard
          id="metric-sources"
          title="Source Checks"
          value={currentCase.sourceChecksCount}
          sublabel="Tier 1 & 2 sources"
          icon={<Building2 className="w-4 h-4 text-[#237A57]" />}
        />
        <MetricCard
          id="metric-discrepancies"
          title="Discrepancies"
          value={currentCase.discrepanciesCount}
          sublabel={currentCase.discrepanciesCount > 0 ? 'Requires attention' : 'None detected'}
          variant={currentCase.discrepanciesCount > 0 ? 'alert' : 'verified'}
          icon={<AlertTriangle className="w-4 h-4 text-[#B83232]" />}
        />
        <MetricCard
          id="metric-open"
          title="Open Review Items"
          value={currentCase.openItemsCount}
          sublabel="Pending sign-off"
          variant="warning"
          icon={<Clock className="w-4 h-4 text-[#B7791F]" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'OVERVIEW', label: 'Executive Summary' },
            { id: 'DOCUMENTS', label: `Documents (${candidate.documents.length})` },
            { id: 'CLAIMS', label: 'Extracted Claims' },
            { id: 'SOURCE_CHECKS', label: 'Source Verification' },
            { id: 'HISTORY', label: 'Review Notes & History' },
            { id: 'AUDIT', label: 'Case Audit Trail' },
            { id: 'NOTICES', label: 'Notices & Appeals' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#17324D] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#17202A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-[#17202A] mb-2">Case Assessment Narrative</h3>
              <p className="text-xs text-slate-600 leading-relaxed p-3.5 bg-[#F5F7FA] rounded-lg border border-slate-200">
                {currentCase.reasonForReview}
              </p>
            </div>

            {currentCase.recommendation && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Recorded Recommendation: {currentCase.recommendation.recommendationType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-tabular">
                    {currentCase.recommendation.submittedTimestamp}
                  </span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {currentCase.recommendation.rationale}
                </p>
                <div className="pt-2 border-t border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                  <span>Recorded by: {currentCase.recommendation.submittedBy}</span>
                  {currentCase.recommendation.finalAdjudicatorSignoff && (
                    <span>Sign-off: {currentCase.recommendation.finalAdjudicatorSignoff}</span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
                  Statutory Prerequisites Check
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span>Statutory Citizenship</span>
                    <span className="text-[#237A57] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Birth Register
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span>Academic Qualification</span>
                    <span className="text-[#B7791F] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Date Amended (NADC Mismatch)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span>Ethical Bar Standing</span>
                    <span className="text-[#237A57] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Good Standing
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-[#17202A] uppercase tracking-wider">
                  Verification Safeguards & Limits
                </h4>
                <ul className="text-xs text-[#5B6777] space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Assisted verification engine does not make legal disqualification rulings.</li>
                  <li>All extracted claims cross-checked against primary government registers.</li>
                  <li>Candidate representation afforded via formal Information Request.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'DOCUMENTS' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#17202A]">Submitted Credential Documents</h3>
              <span className="text-xs text-slate-500">{candidate.documents.length} Files Ingested</span>
            </div>

            <div className="space-y-3">
              {candidate.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-[#F5F7FA] rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-6 h-6 text-[#2F75B5] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#17202A] text-sm">{doc.credentialTitle}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.fileName}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {(doc.fileSizeBytes / 1000000).toFixed(2)} MB • {doc.totalPages} page(s) • Ingested {doc.uploadTimestamp}
                      </p>
                      {doc.qualityWarnings.length > 0 && (
                        <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{doc.qualityWarnings[0].message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={doc.status} size="sm" />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCandidateId(candidate.id);
                        setActiveDocumentId(doc.id);
                        navigateTo('workbench', { caseId: currentCase.id, candidateId: candidate.id, docId: doc.id });
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#17324D] text-white hover:bg-[#0f2337] rounded flex items-center gap-1"
                    >
                      <span>Review in Workbench</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLAIMS TAB */}
        {activeTab === 'CLAIMS' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-[#17202A]">Extracted Structured Claims</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[#5B6777] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Field Claim</th>
                    <th className="py-2.5 px-3">Document Value</th>
                    <th className="py-2.5 px-3">Normalized Value</th>
                    <th className="py-2.5 px-3">Extraction Confidence</th>
                    <th className="py-2.5 px-3">Source Status</th>
                    <th className="py-2.5 px-3">Verification State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidate.documents
                    .flatMap((d) => d.extractedFields)
                    .map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-[#17202A]">{f.fieldName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{f.originalValue}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {f.correctedValue ? (
                            <span className="text-[#2F75B5] font-semibold">{f.correctedValue} (Corrected)</span>
                          ) : (
                            f.normalizedValue
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-tabular">{f.extractionConfidence}%</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={f.sourceStatus} size="sm" />
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={f.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SOURCE CHECKS TAB */}
        {activeTab === 'SOURCE_CHECKS' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-[#17202A]">Authoritative Source Cross-Checks</h3>
            <p className="text-xs text-[#5B6777]">
              Independent verification queries against certified statutory registers and registries.
            </p>
            <div className="space-y-3">
              <div className="p-3.5 bg-[#F5F7FA] rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#17202A]">National Academic Degree Clearinghouse (NADC)</p>
                  <p className="text-[11px] text-slate-500">Query Reference: NADC-TRX-2026-881920 • Response time: 342ms</p>
                  <p className="text-[11px] text-slate-700 mt-1">
                    Payload: Matched Student ID VSU-LAW-1999-0482. Degree JD conferred 2002-06-12.
                  </p>
                </div>
                <StatusBadge status="VERIFIED" size="sm" />
              </div>

              <div className="p-3.5 bg-[#F5F7FA] rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#17202A]">Supreme Judicial Bar of Pacifica Registry API</p>
                  <p className="text-[11px] text-slate-500">Query Reference: BAR-PAC-API-VER-904 • Response time: 210ms</p>
                  <p className="text-[11px] text-slate-700 mt-1">
                    Payload: Roll #BAR-PAC-2003-8819. Status: Active in Good Standing.
                  </p>
                </div>
                <StatusBadge status="VERIFIED" size="sm" />
              </div>
            </div>
          </div>
        )}

        {/* REVIEW HISTORY TAB */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-[#17202A]">Review Notes & Timeline</h3>
            <div className="space-y-3">
              <div className="p-3.5 border-l-4 border-l-[#2F75B5] bg-[#F5F7FA] rounded-r-lg text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span className="font-semibold text-[#17202A]">Elena Vance (Verification Analyst)</span>
                  <span className="font-tabular">2026-08-26 11:20 UTC</span>
                </div>
                <p className="text-slate-800">
                  Applied non-destructive field correction to conferral date pursuant to official NADC convocation register. Degree validity confirmed.
                </p>
              </div>

              <div className="p-3.5 border-l-4 border-l-[#17324D] bg-[#F5F7FA] rounded-r-lg text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span className="font-semibold text-[#17202A]">Amina Osei (Intake Officer)</span>
                  <span className="font-tabular">2026-08-22 14:30 UTC</span>
                </div>
                <p className="text-slate-800">
                  Initial candidate packet intake completed. 3 documents ingested and dispatched to automated extraction engine.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-[#17202A]">Case Audit Log</h3>
            <p className="text-xs text-[#5B6777]">
              Immutable cryptographic ledger events specific to case {currentCase.caseReference}.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[#5B6777] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Actor</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 px-3">2026-08-26 11:20:14</td>
                    <td className="py-2.5 px-3 font-sans">Elena Vance</td>
                    <td className="py-2.5 px-3 font-sans">FIELD_VALUE_CORRECTED</td>
                    <td className="py-2.5 px-3 font-sans">REGISTRAR_RECORDS_AMENDMENT</td>
                    <td className="py-2.5 px-3 text-slate-400">sha256:7f83b1...</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3">2026-08-26 09:16:30</td>
                    <td className="py-2.5 px-3 font-sans">NADC Connector</td>
                    <td className="py-2.5 px-3 font-sans">SOURCE_QUERY_COMPLETED</td>
                    <td className="py-2.5 px-3 font-sans">Automated query</td>
                    <td className="py-2.5 px-3 text-slate-400">sha256:8899aa...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NOTICES & RFI CLARIFICATIONS TAB */}
        {activeTab === 'NOTICES' && (
          <div className="space-y-4 animate-fade-in">
            <CaseRFISection
              caseId={currentCase.id}
              caseReference={currentCase.caseReference}
              candidateId={candidate.id}
              candidateName={candidate.fullName}
              onUpdate={refreshData}
            />
          </div>
        )}
      </div>

      {/* Decision Modal */}
      <DecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        caseReference={currentCase.caseReference}
        candidateName={currentCase.candidateName}
        confirmedClaimsCount={candidate.documents.reduce((acc, d) => acc + d.extractedFields.filter((f) => f.status === 'VERIFIED').length, 0)}
        contradictedClaimsCount={currentCase.discrepanciesCount}
        onRecord={handleRecordDecision}
      />

      {/* Statutory Evidence Dossier Modal */}
      <DossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        caseRecord={currentCase}
        candidate={candidate}
      />

      {/* Issue Statutory RFI Modal */}
      <IssueRFIModal
        isOpen={isIssueRFIModalOpen}
        onClose={() => setIsIssueRFIModalOpen(false)}
        caseId={currentCase.id}
        caseReference={currentCase.caseReference}
        candidateId={candidate.id}
        candidateName={candidate.fullName}
        onIssued={handleIssueRFI}
      />

      {/* Escalate Modal */}
      <ConfirmationModal
        isOpen={isEscalateOpen}
        onClose={() => setIsEscalateOpen(false)}
        onConfirm={handleEscalateConfirm}
        title="Escalate Case to Senior Adjudication"
        description="Escalate this candidate case for senior legal panel determination."
        confirmLabel="Confirm Escalation"
        variant="warning"
      />
    </div>
  );
};
