import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { IssueRFIModal } from './IssueRFIModal';
import { verificationService } from '../../services/verificationService';
import {
  Scale,
  AlertTriangle,
  Building2,
  FileText,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Send,
  ExternalLink,
} from 'lucide-react';

export const DiscrepancyReviewScreen: React.FC = () => {
  const { cases, navigateTo, setActiveCaseId, setActiveCandidateId, addToast, currentUser, refreshData } = useApp();
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState<string>('disc_01');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false);
  const [isIssueRFIModalOpen, setIsIssueRFIModalOpen] = useState<boolean>(false);
  const [resolutionAction, setResolutionAction] = useState<'ACCEPT_SOURCE' | 'REQUEST_INFO' | 'ESCALATE'>('ACCEPT_SOURCE');

  // Realistic discrepancy cases
  const discrepancies = [
    {
      id: 'disc_01',
      caseReference: 'PAC-2026-0019',
      candidateName: 'Dr. Arthur Sterling-Morales',
      officeContested: 'Western Province High Court Judge',
      claimType: 'Bar Practice Eligibility Duration',
      documentValue: 'Admitted October 15, 2003 (22+ Years Practice Claimed)',
      documentSource: 'Submitted Bar Certificate (Page 1)',
      authoritativeSource: 'Supreme Judicial Bar of Pacifica Registry API',
      authoritativeValue: 'Roll #BAR-PAC-2003-8819: Admitted Oct 15, 2003 (Good Standing)',
      reliabilityTier: 'Tier 1 Statutory Registry',
      queryDate: '2026-08-26 09:14 UTC',
      status: 'NEEDS_REVIEW',
      impact: 'Statutory prerequisite: 15 years continuous active bar standing.',
      analysisNotes: 'Bar register confirms 22 continuous years in good standing. Date discrepancy on degree conferral does not affect legal bar standing threshold.',
    },
    {
      id: 'disc_02',
      caseReference: 'PAC-2026-0182',
      candidateName: 'Hon. Samantha Ross-Chen',
      officeContested: 'Capital Territory Governor',
      claimType: 'Tax Integrity & Asset Disclosure Clearance',
      documentValue: 'Asset Statement Filed Dec 2025',
      documentSource: 'Public Integrity Asset Filing (Page 4)',
      authoritativeSource: 'Department of Revenue Gateway API',
      authoritativeValue: 'Gateway Timeout / Connection Refused (HTTP 503)',
      reliabilityTier: 'Tier 1 Statutory Gateway',
      queryDate: '2026-08-26 10:02 UTC',
      status: 'INFO_REQUIRED',
      impact: 'Mandatory tax clearance certificate required under Constitution Art. VI.',
      analysisNotes: 'Upstream gateway offline. Requires secondary manual tax authority stamped certificate or automated retry.',
    },
    {
      id: 'disc_03',
      caseReference: 'PAC-2026-0094',
      candidateName: 'Captain James Vance',
      officeContested: 'Member of Parliament - Constituency 4',
      claimType: 'Identity Registration Sequence & Middle Name',
      documentValue: 'James Vance (Citizenship Cert #8819)',
      documentSource: 'Civil Status Cert (Page 1)',
      authoritativeSource: 'National Civil Status Register (NRCS)',
      authoritativeValue: 'James Alexander Vance (ID PAC-881920-A)',
      reliabilityTier: 'Tier 1 Civil Register',
      queryDate: '2026-08-26 08:30 UTC',
      status: 'VERIFIED',
      impact: 'Identity verification for ballot printing.',
      analysisNotes: 'Middle name "Alexander" confirmed on birth registry. Non-destructive name alignment applied.',
    },
  ];

  const activeDisc = discrepancies.find((d) => d.id === selectedDiscrepancyId) || discrepancies[0];

  const handleIssueRFI = async (rfiData: any) => {
    const created = await verificationService.createRFI(rfiData, currentUser.name, currentUser.role);
    if (created) {
      await refreshData();
      addToast(`Statutory Clarification [${created.rfiNumber}] issued to ${created.candidateName}.`, 'success');
      const targetCase = cases.find((c) => c.caseReference === activeDisc.caseReference);
      if (targetCase) {
        setActiveCaseId(targetCase.id);
        setActiveCandidateId(targetCase.candidateId);
        navigateTo('case-overview');
      }
    }
  };

  const handleResolveConfirm = () => {
    setIsResolveModalOpen(false);
    if (resolutionAction === 'ACCEPT_SOURCE') {
      addToast(`Discrepancy resolved: Corroborated value accepted from ${activeDisc.authoritativeSource}.`, 'success');
    } else if (resolutionAction === 'REQUEST_INFO') {
      addToast(`Formal Information Request dispatched to candidate agent for ${activeDisc.candidateName}.`, 'info');
    } else {
      addToast(`Discrepancy escalated to Senior Adjudicator panel for statutory determination.`, 'warning');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#17202A]">Authoritative Discrepancy Review</h2>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Side-by-side reconciliation between submitted candidate claims and statutory registry databases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
            {discrepancies.filter((d) => d.status !== 'VERIFIED').length} Active Discrepancies
          </span>
        </div>
      </div>

      {/* Discrepancy Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Discrepancy Selector List (Left 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50 font-bold text-xs text-[#17202A] uppercase tracking-wider">
            Flagged Items Awaiting Review
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto">
            {discrepancies.map((disc) => {
              const isSelected = disc.id === activeDisc.id;
              return (
                <div
                  key={disc.id}
                  onClick={() => setSelectedDiscrepancyId(disc.id)}
                  className={`p-3.5 text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#2F75B5]/10 border-l-4 border-l-[#2F75B5]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-[#17324D]">
                      {disc.caseReference}
                    </span>
                    <StatusBadge status={disc.status} size="sm" />
                  </div>
                  <div className="font-bold text-xs text-[#17202A]">{disc.candidateName}</div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{disc.claimType}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Side-by-Side Comparison Panel (Right 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-[#17324D] bg-slate-100 px-2 py-0.5 rounded">
                  {activeDisc.caseReference}
                </span>
                <span className="text-sm font-bold text-[#17202A]">{activeDisc.candidateName}</span>
              </div>
              <p className="text-xs text-[#5B6777] mt-1">
                Contested Office: <strong className="text-[#17202A]">{activeDisc.officeContested}</strong>
              </p>
            </div>

            <StatusBadge status={activeDisc.status} size="md" />
          </div>

          {/* Side-by-Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Claim */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17202A] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#2F75B5]" />
                  Candidate Submitted Claim
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Document Evidence</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-[#17202A] leading-snug">
                  {activeDisc.documentValue}
                </p>
              </div>

              <p className="text-[11px] text-slate-500">
                Source: <strong>{activeDisc.documentSource}</strong>
              </p>
            </div>

            {/* Authoritative Database Record */}
            <div className="p-4 rounded-xl border border-blue-300 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#2F75B5]" />
                  Authoritative Registry Response
                </span>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  {activeDisc.reliabilityTier}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-xs font-bold text-[#17202A] leading-snug">
                  {activeDisc.authoritativeValue}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{activeDisc.authoritativeSource}</span>
                <span className="font-tabular font-mono text-[10px]">{activeDisc.queryDate}</span>
              </div>
            </div>
          </div>

          {/* Analysis & Statutory Impact */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#F5F7FA] space-y-2 text-xs">
            <h4 className="font-bold text-[#17202A] uppercase tracking-wider text-[11px]">
              Assisted Evidence Analysis & Statutory Impact
            </h4>
            <p className="text-slate-700 leading-relaxed">
              <strong>Impact:</strong> {activeDisc.impact}
            </p>
            <p className="text-slate-700 leading-relaxed">
              <strong>Reviewer Notes:</strong> {activeDisc.analysisNotes}
            </p>
          </div>

          {/* Neutral Boundary Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Statutory Boundary:</strong> The verification engine highlights data divergence but does not determine candidate disqualification. Reviewers must evaluate whether supplemental proof or registrar clarification is required.
            </p>
          </div>

          {/* Reviewer Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                const targetCase = cases.find((c) => c.caseReference === activeDisc.caseReference);
                if (targetCase) {
                  setActiveCaseId(targetCase.id);
                  setActiveCandidateId(targetCase.candidateId);
                  navigateTo('workbench', { caseId: targetCase.id, candidateId: targetCase.candidateId });
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Open in Document Workbench
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-rfi-clarify-discrepancy"
                onClick={() => setIsIssueRFIModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-[#17324D] bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 text-[#2F75B5]" />
                <span>Issue Statutory RFI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResolutionAction('ACCEPT_SOURCE');
                  setIsResolveModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#237A57] hover:bg-[#1b6145] rounded-md shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept Corroborated Value</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Statutory RFI Modal */}
      {(() => {
        const targetCase = cases.find((c) => c.caseReference === activeDisc.caseReference) || cases[0];
        return (
          <IssueRFIModal
            isOpen={isIssueRFIModalOpen}
            onClose={() => setIsIssueRFIModalOpen(false)}
            caseId={targetCase?.id || 'case_001'}
            caseReference={activeDisc.caseReference}
            candidateId={targetCase?.candidateId || 'cand_001'}
            candidateName={activeDisc.candidateName}
            initialDiscrepancyRef={`${activeDisc.claimType}: ${activeDisc.documentValue} vs ${activeDisc.authoritativeValue}`}
            onIssued={handleIssueRFI}
          />
        );
      })()}

      {/* Resolution Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onConfirm={handleResolveConfirm}
        title="Confirm Discrepancy Adjudication"
        description={`Record authorized resolution for ${activeDisc.claimType} in case ${activeDisc.caseReference}.`}
        confirmLabel="Apply Resolution to Ledger"
      />
    </div>
  );
};
