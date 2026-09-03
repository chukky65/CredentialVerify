import React, { useState } from 'react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { CredentialType, CandidateRFI } from '../../types';
import { Send, Scale, Clock, AlertCircle, Plus, Trash2, ShieldCheck, FileText } from 'lucide-react';

interface IssueRFIModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseReference: string;
  candidateId: string;
  candidateName: string;
  initialDiscrepancyRef?: string;
  initialCredentialType?: CredentialType;
  onIssued: (rfi: Omit<CandidateRFI, 'id' | 'rfiNumber' | 'issuedTimestamp' | 'status'>) => void;
}

const CREDENTIAL_OPTIONS: { type: CredentialType; label: string }[] = [
  { type: 'CITIZENSHIP', label: 'Citizenship & Civil Status' },
  { type: 'ACADEMIC_DEGREE', label: 'Academic Qualifications & Degrees' },
  { type: 'PROFESSIONAL_LICENSE', label: 'Professional Bar / Licensure' },
  { type: 'FINANCIAL_DISCLOSURE', label: 'Financial & Tax Asset Disclosure' },
  { type: 'SECURITY_CLEARANCE', label: 'Security Clearance & Police Records' },
];

export const IssueRFIModal: React.FC<IssueRFIModalProps> = ({
  isOpen,
  onClose,
  caseId,
  caseReference,
  candidateId,
  candidateName,
  initialDiscrepancyRef = '',
  initialCredentialType = 'ACADEMIC_DEGREE',
  onIssued,
}) => {
  const [subject, setSubject] = useState(
    initialDiscrepancyRef
      ? `Clarification Request: ${initialDiscrepancyRef}`
      : `Statutory Request for Information (RFI) - ${caseReference}`
  );
  const [credentialType, setCredentialType] = useState<CredentialType>(initialCredentialType);
  const [statutoryBasis, setStatutoryBasis] = useState('Electoral Integrity Act § 19.3 & Verification Regulations');
  const [discrepancyRef, setDiscrepancyRef] = useState(initialDiscrepancyRef);
  const [instructions, setInstructions] = useState(
    'Please submit certified supplementary documentation or an explanatory statutory declaration from the issuing authority to cure the indicated verification defect.'
  );
  const [curingRequirements, setCuringRequirements] = useState<string[]>([
    'Official duplicate or certified excerpt from issuing authority',
    'Statutory Declaration or Notarized Affidavit clarifying discrepancies',
  ]);
  const [newRequirement, setNewRequirement] = useState('');
  const [deadlineDays, setDeadlineDays] = useState<number>(4);
  const [error, setError] = useState('');

  // Calculate default deadline string
  const calculateDeadline = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().replace('T', ' ').substring(0, 16);
  };

  const handleAddRequirement = () => {
    if (!newRequirement.trim()) return;
    setCuringRequirements([...curingRequirements, newRequirement.trim()]);
    setNewRequirement('');
  };

  const handleRemoveRequirement = (idx: number) => {
    setCuringRequirements(curingRequirements.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    if (!subject.trim()) {
      setError('Please provide a subject line for the formal notice.');
      return;
    }
    if (!statutoryBasis.trim()) {
      setError('Statutory legal basis citation is required.');
      return;
    }
    if (!instructions.trim()) {
      setError('Specific guidance instructions for the candidate are required.');
      return;
    }

    onIssued({
      caseId,
      caseReference,
      candidateId,
      candidateName,
      subject: subject.trim(),
      statutoryBasis: statutoryBasis.trim(),
      discrepancyRef: discrepancyRef.trim(),
      credentialType,
      instructions: instructions.trim(),
      curingRequirements,
      issuedByStaffId: 'usr_analyst_01',
      issuedByName: 'Elena Vance (Lead Verification Analyst)',
      responseDeadline: calculateDeadline(deadlineDays),
    });

    onClose();
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Issue Formal Statutory Clarification (RFI)"
      description={`Dispatches an official Request for Information under statutory deadline rules to candidate ${candidateName}.`}
      confirmLabel="Issue Formal Notice"
      cancelLabel="Cancel"
      variant="primary"
    >
      <div className="space-y-4 pt-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Case & Candidate Meta Pill */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <div className="font-bold text-[#17324D]">{candidateName}</div>
            <div className="text-[11px] text-slate-500 font-mono">Case #{caseReference}</div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Statutory Notice
          </span>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">RFI Subject Title *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#2F75B5] focus:outline-none"
          />
        </div>

        {/* Credential Scope & Statutory Authority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Credential Category</label>
            <select
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value as CredentialType)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none"
            >
              {CREDENTIAL_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Statutory Basis Citation *</label>
            <input
              type="text"
              value={statutoryBasis}
              onChange={(e) => setStatutoryBasis(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono text-[11px] focus:outline-none"
            />
          </div>
        </div>

        {/* Discrepancy Reference */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Linked Discrepancy / Trigger Item
          </label>
          <input
            type="text"
            value={discrepancyRef}
            onChange={(e) => setDiscrepancyRef(e.target.value)}
            placeholder="e.g. Degree conferral date mismatch (1999 vs 2000 registry entry)"
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Specific Instructions for Candidate / Legal Agent *
          </label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#2F75B5] focus:outline-none leading-relaxed"
          />
        </div>

        {/* Specific Curing Items List */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <label className="block text-slate-800 font-bold text-xs">
            Required Documentary Curing Submissions
          </label>
          
          <div className="space-y-1.5">
            {curingRequirements.map((req, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{req}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRequirement(idx)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Add specific submission prerequisite..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRequirement();
                }
              }}
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddRequirement}
              className="px-3 py-1.5 bg-[#17324D] text-white rounded text-xs font-bold hover:bg-[#0f2337] flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Statutory Clock / Response Deadline */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <div className="font-bold text-amber-900">Statutory Response Window</div>
              <div className="text-[11px] text-amber-700">
                Deadline: <strong className="font-mono">{calculateDeadline(deadlineDays)}</strong>
              </div>
            </div>
          </div>

          <select
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(Number(e.target.value))}
            className="text-xs bg-white border border-amber-300 rounded px-2.5 py-1 text-amber-900 font-semibold focus:outline-none"
          >
            <option value={2}>48 Hours (Expedited)</option>
            <option value={4}>4 Calendar Days (Standard)</option>
            <option value={7}>7 Calendar Days (Complex)</option>
          </select>
        </div>
      </div>
    </ConfirmationModal>
  );
};
