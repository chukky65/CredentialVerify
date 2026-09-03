import React, { useState } from 'react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { CandidateRFI } from '../../types';
import { Scale, CheckCircle2, XCircle, AlertTriangle, FileText, ExternalLink } from 'lucide-react';

interface AdjudicateRFIModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfi: CandidateRFI | null;
  onAdjudicate: (
    outcome: 'DEFECT_CURED' | 'INSUFFICIENT_EVIDENCE' | 'FORMAL_REJECTION',
    adjudicationNote: string
  ) => void;
}

export const AdjudicateRFIModal: React.FC<AdjudicateRFIModalProps> = ({
  isOpen,
  onClose,
  rfi,
  onAdjudicate,
}) => {
  const [outcome, setOutcome] = useState<'DEFECT_CURED' | 'INSUFFICIENT_EVIDENCE' | 'FORMAL_REJECTION'>(
    'DEFECT_CURED'
  );
  const [adjudicationNote, setAdjudicationNote] = useState(
    'Candidate submission reviewed against statutory criteria. The supplementary registrar clarification explains the convocation schedule discrepancy satisfactorily and satisfies the qualification prerequisite.'
  );
  const [error, setError] = useState('');

  if (!rfi) return null;

  const handleConfirm = () => {
    if (!adjudicationNote.trim()) {
      setError('A formal statutory adjudication statement is required.');
      return;
    }
    onAdjudicate(outcome, adjudicationNote.trim());
    onClose();
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Statutory Adjudication of Candidate Response"
      description={`Record formal determination for RFI [${rfi.rfiNumber}] filed by ${rfi.candidateName}.`}
      confirmLabel="Record Determination"
      cancelLabel="Cancel"
      variant={outcome === 'DEFECT_CURED' ? 'primary' : outcome === 'FORMAL_REJECTION' ? 'danger' : 'warning'}
    >
      <div className="space-y-4 pt-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Candidate Response Summary Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-slate-700">
            <span className="font-bold">Candidate Response Statement</span>
            <span className="text-[11px] font-mono text-slate-500">{rfi.candidateResponseTimestamp}</span>
          </div>
          <p className="text-xs text-slate-800 bg-white p-2.5 rounded border border-slate-200 leading-relaxed italic">
            "{rfi.candidateResponseText || 'No written statement provided.'}"
          </p>
          
          {rfi.attachments && rfi.attachments.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-semibold text-slate-600">Attached Documentary Evidence:</span>
              {rfi.attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 text-slate-700 bg-white p-1.5 rounded border border-slate-200 text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-[#2F75B5]" />
                  <span className="font-medium truncate flex-1">{att.fileName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{(att.fileSizeBytes / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outcome Selection */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Adjudication Determination Outcome *</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setOutcome('DEFECT_CURED');
                setAdjudicationNote(
                  'Candidate submission reviewed against statutory criteria. Supplementary registrar clarification explains the convocation schedule discrepancy satisfactorily and satisfies the qualification prerequisite.'
                );
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                outcome === 'DEFECT_CURED'
                  ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Defect Cured</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">
                Evidence accepted; resolves discrepancy and restores clearance.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setOutcome('INSUFFICIENT_EVIDENCE');
                setAdjudicationNote(
                  'The evidence provided is incomplete or lacks certified official seal. Additional supporting documentation is required before statutory deadline.'
                );
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                outcome === 'INSUFFICIENT_EVIDENCE'
                  ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Insufficient</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">
                Evidence incomplete; requires supplementary cure or escalation.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setOutcome('FORMAL_REJECTION');
                setAdjudicationNote(
                  'The candidate failed to cure the statutory defect. Claim remains contradicted under the Electoral Act.'
                );
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                outcome === 'FORMAL_REJECTION'
                  ? 'bg-red-50 border-red-400 ring-1 ring-red-400 text-red-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Formal Rejection</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1">
                Formal rejection of cure; triggers adverse decision notice.
              </p>
            </button>
          </div>
        </div>

        {/* Adjudication Legal Statement */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Formal Statutory Adjudication Finding & Statement *
          </label>
          <textarea
            rows={3}
            value={adjudicationNote}
            onChange={(e) => {
              setAdjudicationNote(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#2F75B5] focus:outline-none leading-relaxed font-sans"
          />
        </div>
      </div>
    </ConfirmationModal>
  );
};
