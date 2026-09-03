import React, { useState, useEffect } from 'react';
import { CandidateRFI, RFIStatus } from '../../types';
import { verificationService } from '../../services/verificationService';
import { useApp } from '../../context/AppContext';
import { IssueRFIModal } from './IssueRFIModal';
import { SimulateCandidateResponseModal } from './SimulateCandidateResponseModal';
import { AdjudicateRFIModal } from './AdjudicateRFIModal';
import {
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Upload,
  Scale,
  XCircle,
  Plus,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface CaseRFISectionProps {
  caseId: string;
  caseReference: string;
  candidateId: string;
  candidateName: string;
  onUpdate?: () => void;
}

export const CaseRFISection: React.FC<CaseRFISectionProps> = ({
  caseId,
  caseReference,
  candidateId,
  candidateName,
  onUpdate,
}) => {
  const { currentUser, addToast } = useApp();
  const [rfis, setRfis] = useState<CandidateRFI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRfiId, setExpandedRfiId] = useState<string | null>(null);

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedRfiForResponse, setSelectedRfiForResponse] = useState<CandidateRFI | null>(null);
  const [selectedRfiForAdjudication, setSelectedRfiForAdjudication] = useState<CandidateRFI | null>(
    null
  );

  const loadRFIs = async () => {
    setIsLoading(true);
    const list = await verificationService.getRFIs({ caseId });
    setRfis(list);
    if (list.length > 0 && !expandedRfiId) {
      setExpandedRfiId(list[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRFIs();
  }, [caseId]);

  const handleIssueRFI = async (rfiData: Omit<CandidateRFI, 'id' | 'rfiNumber' | 'issuedTimestamp' | 'status'>) => {
    const created = await verificationService.createRFI(rfiData, currentUser.name, currentUser.role);
    if (created) {
      await loadRFIs();
      setExpandedRfiId(created.id);
      addToast(`Statutory Clarification [${created.rfiNumber}] issued to candidate.`, 'success');
      if (onUpdate) onUpdate();
    }
  };

  const handleCandidateResponse = async (payload: {
    responseText: string;
    agentName: string;
    attachments: Array<{ fileName: string; fileSizeBytes: number; description: string }>;
  }) => {
    if (!selectedRfiForResponse) return;
    const updated = await verificationService.submitCandidateRFIResponse(
      selectedRfiForResponse.id,
      payload
    );
    if (updated) {
      await loadRFIs();
      addToast(`Candidate response & supplementary proof recorded for [${updated.rfiNumber}].`, 'success');
      if (onUpdate) onUpdate();
    }
    setSelectedRfiForResponse(null);
  };

  const handleAdjudicate = async (
    outcome: 'DEFECT_CURED' | 'INSUFFICIENT_EVIDENCE' | 'FORMAL_REJECTION',
    adjudicationNote: string
  ) => {
    if (!selectedRfiForAdjudication) return;
    const updated = await verificationService.adjudicateRFI(
      selectedRfiForAdjudication.id,
      outcome,
      adjudicationNote,
      currentUser.name,
      currentUser.role
    );
    if (updated) {
      await loadRFIs();
      addToast(`Determination recorded: ${outcome.replace(/_/g, ' ')} for [${updated.rfiNumber}].`, 'success');
      if (onUpdate) onUpdate();
    }
    setSelectedRfiForAdjudication(null);
  };

  const getStatusBadge = (status: RFIStatus) => {
    switch (status) {
      case 'ISSUED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Awaiting Candidate Response</span>
          </span>
        );
      case 'RESPONSE_SUBMITTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
            <Upload className="w-3 h-3" />
            <span>Response Filed • Pending Adjudication</span>
          </span>
        );
      case 'CURED_ACCEPTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Defect Cured & Accepted</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900 border border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Formal Rejection</span>
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Issue Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h4 className="text-xs font-bold text-[#17324D] flex items-center gap-2">
            <Send className="w-4 h-4 text-[#2F75B5]" />
            <span>Candidate Requests for Information (RFI) & Statutory Clarifications</span>
          </h4>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Formal administrative inquiries, statutory response clocks, and candidate documentary cure submissions.
          </p>
        </div>

        <button
          type="button"
          id="issue-new-rfi-btn"
          onClick={() => setIsIssueModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#17324D] hover:bg-[#0f2337] rounded-md shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Issue New RFI</span>
        </button>
      </div>

      {/* RFI Items List */}
      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading statutory notices...</div>
      ) : rfis.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-300 p-6">
          <p className="font-semibold text-slate-700">No Statutory RFIs Issued for this Case</p>
          <p className="text-[11px] text-slate-500 mt-1">
            If discrepancies or uncorroborated claims arise, click "Issue New RFI" to formally invite the candidate to cure defects.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rfis.map((rfi) => {
            const isExpanded = expandedRfiId === rfi.id;
            return (
              <div
                key={rfi.id}
                className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedRfiId(isExpanded ? null : rfi.id)}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 select-none border-b border-slate-100"
                >
                  <div className="flex items-start sm:items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 mt-0.5 sm:mt-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 mt-0.5 sm:mt-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-[#17324D] bg-slate-100 px-2 py-0.5 rounded">
                          {rfi.rfiNumber}
                        </span>
                        <span className="text-xs font-bold text-[#17202A]">{rfi.subject}</span>
                        {getStatusBadge(rfi.status)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>Issued: {rfi.issuedTimestamp}</span>
                        <span>•</span>
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Deadline: {rfi.responseDeadline}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Header Bar */}
                  <div
                    className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rfi.status === 'ISSUED' && (
                      <button
                        type="button"
                        onClick={() => setSelectedRfiForResponse(rfi)}
                        className="px-2.5 py-1 text-xs font-bold text-[#17324D] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-1"
                        title="Simulate candidate response submission"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-700" />
                        <span>Submit Response</span>
                      </button>
                    )}

                    {rfi.status === 'RESPONSE_SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => setSelectedRfiForAdjudication(rfi)}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-[#237A57] hover:bg-[#1c6447] rounded shadow-2xs flex items-center gap-1"
                        title="Record statutory determination on candidate cure"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Adjudicate Cure</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/50 space-y-4 text-xs">
                    {/* Inquiry Details Box */}
                    <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
                      <div className="text-slate-800 font-bold flex items-center justify-between">
                        <span>Statutory Inquiry Details</span>
                        <span className="text-[11px] font-mono text-slate-500 font-normal">
                          Authority: {rfi.statutoryBasis}
                        </span>
                      </div>
                      
                      <p className="text-slate-700 leading-relaxed">{rfi.instructions}</p>

                      {rfi.discrepancyRef && (
                        <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                          <strong>Trigger Discrepancy:</strong> {rfi.discrepancyRef}
                        </div>
                      )}

                      {/* Curing Prerequisite List */}
                      {rfi.curingRequirements && rfi.curingRequirements.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="text-[11px] font-bold text-slate-700 mb-1">
                            Required Curing Elements:
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                            {rfi.curingRequirements.map((req, i) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Candidate Response Section */}
                    {rfi.candidateResponseText ? (
                      <div className="p-3 bg-blue-50/60 rounded border border-blue-200 space-y-2.5">
                        <div className="flex items-center justify-between text-blue-900">
                          <div className="font-bold flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-blue-700" />
                            <span>Candidate Representation & Evidence Submission</span>
                          </div>
                          <span className="text-[11px] font-mono text-blue-700">
                            Filed: {rfi.candidateResponseTimestamp} by {rfi.submittedByAgentName || 'Candidate'}
                          </span>
                        </div>

                        <p className="text-slate-800 bg-white p-2.5 rounded border border-blue-200 leading-relaxed italic">
                          "{rfi.candidateResponseText}"
                        </p>

                        {/* Attachments */}
                        {rfi.attachments && rfi.attachments.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-blue-900">
                              Supplementary Proof Attachments ({rfi.attachments.length}):
                            </span>
                            {rfi.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="p-2 bg-white rounded border border-blue-200 flex items-start gap-2"
                              >
                                <FileText className="w-4 h-4 text-[#2F75B5] shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-slate-900 truncate">{att.fileName}</div>
                                  <div className="text-[11px] text-slate-600">{att.description}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {(att.fileSizeBytes / 1024).toFixed(1)} KB • {att.sha256Hash}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/50 rounded border border-amber-200 text-amber-800 flex items-center justify-between">
                        <span className="text-xs">
                          Pending candidate response before statutory deadline (<strong>{rfi.responseDeadline}</strong>).
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedRfiForResponse(rfi)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shadow-2xs"
                        >
                          Simulate Portal Submission
                        </button>
                      </div>
                    )}

                    {/* Adjudication Finding Finding Box */}
                    {rfi.adjudicatedBy && (
                      <div className="p-3 bg-emerald-50 rounded border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between text-emerald-900">
                          <div className="font-bold flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Statutory Determination Finding: {rfi.resolutionOutcome?.replace(/_/g, ' ')}</span>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-700">
                            Signed by {rfi.adjudicatedBy} on {rfi.adjudicatedTimestamp}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed bg-white p-2.5 rounded border border-emerald-200">
                          {rfi.adjudicationNote}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Issue RFI Modal */}
      <IssueRFIModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        caseId={caseId}
        caseReference={caseReference}
        candidateId={candidateId}
        candidateName={candidateName}
        onIssued={handleIssueRFI}
      />

      {/* Simulate Response Modal */}
      <SimulateCandidateResponseModal
        isOpen={!!selectedRfiForResponse}
        onClose={() => setSelectedRfiForResponse(null)}
        rfi={selectedRfiForResponse}
        onSubmit={handleCandidateResponse}
      />

      {/* Adjudicate Modal */}
      <AdjudicateRFIModal
        isOpen={!!selectedRfiForAdjudication}
        onClose={() => setSelectedRfiForAdjudication(null)}
        rfi={selectedRfiForAdjudication}
        onAdjudicate={handleAdjudicate}
      />
    </div>
  );
};
