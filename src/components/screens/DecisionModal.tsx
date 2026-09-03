import React, { useState } from 'react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { RecommendationRecord, RecommendationType } from '../../types';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseReference: string;
  candidateName: string;
  confirmedClaimsCount: number;
  contradictedClaimsCount: number;
  onRecord: (record: RecommendationRecord) => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  isOpen,
  onClose,
  caseReference,
  candidateName,
  confirmedClaimsCount,
  contradictedClaimsCount,
  onRecord,
}) => {
  const { currentUser, addToast } = useApp();

  const [recommendationType, setRecommendationType] = useState<RecommendationType>(
    contradictedClaimsCount > 0 ? 'SENIOR_ADJUDICATION_REQUIRED' : 'REQUIREMENTS_SATISFIED'
  );
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>(
    contradictedClaimsCount > 0 ? 'STATUTORY_THRESHOLD_UNMET' : 'MANDATORY_CRITERIA_VERIFIED'
  );
  const [rationale, setRationale] = useState<string>('');
  const [confirmedStatutoryDisclaimer, setConfirmedStatutoryDisclaimer] = useState<boolean>(false);

  const handleSubmit = () => {
    if (!rationale.trim()) {
      addToast('Please enter structured decision rationale.', 'warning');
      return;
    }
    if (!confirmedStatutoryDisclaimer) {
      addToast('Please confirm the statutory decision boundary notice.', 'warning');
      return;
    }

    const newRecord: RecommendationRecord = {
      recommendationType,
      reasonCodes: [selectedReasonCode],
      rationale,
      submittedBy: `${currentUser.name} (${currentUser.role.replace('_', ' ')})`,
      submittedTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      confirmedClaimsCount,
      contradictedClaimsCount,
      openRisks: contradictedClaimsCount > 0 ? ['Contradicted claim requires senior sign-off'] : [],
      isFinalAdverseDecision: false,
    };

    onRecord(newRecord);
    onClose();
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="Record Credential Verification Recommendation"
      description={`Record official evidence findings for ${candidateName} (${caseReference}).`}
      confirmLabel="Submit Recommendation to Case Ledger"
      cancelLabel="Cancel"
      variant="primary"
    >
      <div className="space-y-4 pt-1">
        {/* Evidence Snapshot */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-[#F5F7FA] rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Confirmed Claims:</span>
            <span className="font-bold text-[#237A57] font-tabular">{confirmedClaimsCount} Verified</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Contradictions / Flags:</span>
            <span className={`font-bold font-tabular ${contradictedClaimsCount > 0 ? 'text-[#B83232]' : 'text-slate-600'}`}>
              {contradictedClaimsCount} Flagged
            </span>
          </div>
        </div>

        {/* Recommendation Type */}
        <div>
          <label className="block text-xs font-semibold text-[#17202A] mb-1">
            Reviewer Recommendation
          </label>
          <select
            value={recommendationType}
            onChange={(e) => setRecommendationType(e.target.value as RecommendationType)}
            className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-[#17202A] focus:border-[#2F75B5] focus:outline-none"
          >
            <option value="REQUIREMENTS_SATISFIED">Verification Requirements Satisfied</option>
            <option value="ADDITIONAL_INFO_REQUIRED">Additional Information Required</option>
            <option value="SENIOR_ADJUDICATION_REQUIRED">Senior Adjudication Required</option>
            <option value="UNABLE_TO_VERIFY">Unable to Verify (Source Inaccessible)</option>
            <option value="RESTRICTED_INVESTIGATION_REQUIRED">Restricted Investigation Required</option>
          </select>
        </div>

        {/* Reason Code */}
        <div>
          <label className="block text-xs font-semibold text-[#17202A] mb-1">
            Statutory Reason Code
          </label>
          <select
            value={selectedReasonCode}
            onChange={(e) => setSelectedReasonCode(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-[#17202A] focus:border-[#2F75B5] focus:outline-none"
          >
            <option value="MANDATORY_CRITERIA_VERIFIED">MANDATORY_CRITERIA_VERIFIED — All statutory prerequisites substantiated</option>
            <option value="REGISTRAR_RECORDS_AMENDMENT">REGISTRAR_RECORDS_AMENDMENT — Official registrar corrected dates/transcripts</option>
            <option value="MISSING_MANDATORY_ANNEXURE">MISSING_MANDATORY_ANNEXURE — Incomplete mandatory filing attachment</option>
            <option value="STATUTORY_THRESHOLD_UNMET">STATUTORY_THRESHOLD_UNMET — Practice duration or qualification mismatch</option>
            <option value="SOURCE_UNRESPONSIVE">SOURCE_UNRESPONSIVE — Upstream statutory authority timeout</option>
          </select>
        </div>

        {/* Detailed Rationale */}
        <div>
          <label className="block text-xs font-semibold text-[#17202A] mb-1">
            Detailed Evidence Rationale <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={3}
            placeholder="Record detailed basis for this recommendation, citing specific verified documents and authoritative source responses..."
            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none"
            required
          />
        </div>

        {/* Mandatory Statutory Boundary Notice */}
        <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-lg text-xs text-red-950 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <p className="font-bold text-red-900">
              MANDATORY STATUTORY NOTICE:
            </p>
          </div>
          <p className="leading-relaxed text-red-950 font-medium">
            “This recommendation assists authorized reviewers and does not constitute the final legal eligibility decision. Final adverse determinations require formal hearing and authorized human sign-off.”
          </p>
          <label className="flex items-start gap-2 pt-1 border-t border-red-200 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedStatutoryDisclaimer}
              onChange={(e) => setConfirmedStatutoryDisclaimer(e.target.checked)}
              className="mt-0.5 rounded border-red-300 text-[#17324D] focus:ring-[#2F75B5]"
            />
            <span className="text-[11px] font-semibold text-red-900">
              I acknowledge and confirm this recommendation complies with statutory boundaries.
            </span>
          </label>
        </div>
      </div>
    </ConfirmationModal>
  );
};
