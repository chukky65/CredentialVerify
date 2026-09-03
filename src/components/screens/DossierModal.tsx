import React, { useState } from 'react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { VerificationCase, Candidate, UserAccount } from '../../types';
import { generateEvidenceDossierPayload, DossierOptions } from '../../services/dossierService';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Scale,
  ShieldCheck,
  CheckSquare,
  Square,
  Download,
  Eye,
  Loader2,
  Printer,
  Sparkles,
  Layers,
} from 'lucide-react';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseRecord: VerificationCase;
  candidate: Candidate;
}

export const DossierModal: React.FC<DossierModalProps> = ({
  isOpen,
  onClose,
  caseRecord,
  candidate,
}) => {
  const { currentUser, addToast } = useApp();
  const [includeFullDocuments, setIncludeFullDocuments] = useState(true);
  const [includeSourceRegistryLogs, setIncludeSourceRegistryLogs] = useState(true);
  const [includeAuditLedger, setIncludeAuditLedger] = useState(true);
  const [includeSignoffCertificate, setIncludeSignoffCertificate] = useState(true);
  const [redactPii, setRedactPii] = useState(false);
  const [hearingPurpose, setHearingPurpose] = useState<
    'PRELIMINARY_SCRUTINY' | 'COMMISSION_HEARING' | 'STATUTORY_APPEAL' | 'PUBLIC_INSPECTION'
  >('COMMISSION_HEARING');
  const [isCompiling, setIsCompiling] = useState(false);

  const handleCompile = async (format: 'PDF' | 'HTML_PACKAGE') => {
    setIsCompiling(true);
    try {
      const options: DossierOptions = {
        includeFullDocuments,
        includeSourceRegistryLogs,
        includeAuditLedger,
        includeSignoffCertificate,
        redactPii,
        hearingPurpose,
      };

      const result = await generateEvidenceDossierPayload(
        caseRecord,
        candidate,
        currentUser,
        options
      );

      addToast(
        `Statutory Dossier compiled: ${result.filename} (${(result.fileSizeBytes / 1024).toFixed(1)} KB) - ${result.totalSections} sections.`,
        'success'
      );
      onClose();
    } catch (err: any) {
      addToast(err?.message || 'Failed to assemble statutory evidence binder.', 'error');
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => handleCompile('PDF')}
      title="Compile Statutory Evidence Dossier"
      description={`Generate an immutable multi-section case binder for ${caseRecord.candidateName} (${caseRecord.caseReference}) ready for commission review.`}
      confirmLabel={isCompiling ? 'Compiling Dossier...' : 'Compile & Open Binder'}
      cancelLabel="Cancel"
      variant="primary"
      isProcessing={isCompiling}
    >
      <div className="space-y-4 pt-2 text-xs">
        {/* Hearing Purpose Selector */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">
            Adjudication & Hearing Purpose
          </label>
          <select
            value={hearingPurpose}
            onChange={(e) => setHearingPurpose(e.target.value as any)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-[#17202A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
          >
            <option value="COMMISSION_HEARING">Statutory Commission Adjudication Hearing</option>
            <option value="PRELIMINARY_SCRUTINY">Preliminary Candidacy Scrutiny Review</option>
            <option value="STATUTORY_APPEAL">Formal Appellate Tribunal Record</option>
            <option value="PUBLIC_INSPECTION">Redacted Public Gazetting & Inspection File</option>
          </select>
        </div>

        {/* Section Inclusions */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">
            Dossier Evidence Inclusions:
          </label>
          <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFullDocuments}
                onChange={(e) => setIncludeFullDocuments(e.target.checked)}
                className="rounded border-slate-300 text-[#17324D] focus:ring-[#2F75B5]"
              />
              <span className="font-medium text-slate-800">
                1. Full Document Index & Extracted Vector Evidence Claims ({candidate.documents.length} Docs)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSourceRegistryLogs}
                onChange={(e) => setIncludeSourceRegistryLogs(e.target.checked)}
                className="rounded border-slate-300 text-[#17324D] focus:ring-[#2F75B5]"
              />
              <span className="font-medium text-slate-800">
                2. Authoritative External Registry Payloads & Mismatch Analysis
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAuditLedger}
                onChange={(e) => setIncludeAuditLedger(e.target.checked)}
                className="rounded border-slate-300 text-[#17324D] focus:ring-[#2F75B5]"
              />
              <span className="font-medium text-slate-800">
                3. Immutable SHA-256 Chained Human Correction Ledger & Review History
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignoffCertificate}
                onChange={(e) => setIncludeSignoffCertificate(e.target.checked)}
                className="rounded border-slate-300 text-[#17324D] focus:ring-[#2F75B5]"
              />
              <span className="font-medium text-slate-800">
                4. Statutory Non-Repudiation Certificate & Physical Sign-Off Signature Block
              </span>
            </label>
          </div>
        </div>

        {/* Security / PII Masking */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
          <input
            type="checkbox"
            id="redact-pii-checkbox"
            checked={redactPii}
            onChange={(e) => setRedactPii(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-[#17324D] focus:ring-[#2F75B5]"
          />
          <div>
            <label htmlFor="redact-pii-checkbox" className="font-bold text-blue-950 cursor-pointer">
              Mask Sensitive Personal Identifiable Information (PII)
            </label>
            <p className="text-[11px] text-blue-800 mt-0.5">
              Obscures candidate National Tax IDs and residential addresses for broad-bench circulation under Privacy Regulations.
            </p>
          </div>
        </div>

        {/* Generated Binder Highlights Summary */}
        <div className="p-3 bg-slate-100 rounded text-[11px] text-slate-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>Candidate Ref:</span>
            <span className="font-mono font-bold text-slate-900">{caseRecord.caseReference}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Compiled By:</span>
            <span className="font-semibold text-slate-900">{currentUser.name} ({currentUser.role})</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Format:</span>
            <span className="font-bold text-[#17324D]">A4 Print-Ready Statutory Case Dossier</span>
          </div>
        </div>
      </div>
    </ConfirmationModal>
  );
};
