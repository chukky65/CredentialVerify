import React, { useState } from 'react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { CandidateRFI } from '../../types';
import { Upload, FileText, CheckCircle2, ShieldAlert, FilePlus } from 'lucide-react';

interface SimulateCandidateResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfi: CandidateRFI | null;
  onSubmit: (responsePayload: {
    responseText: string;
    agentName: string;
    attachments: Array<{ fileName: string; fileSizeBytes: number; description: string }>;
  }) => void;
}

export const SimulateCandidateResponseModal: React.FC<SimulateCandidateResponseModalProps> = ({
  isOpen,
  onClose,
  rfi,
  onSubmit,
}) => {
  const [responseText, setResponseText] = useState(
    'In response to the statutory inquiry regarding the degree conferral date, we submit an official certified institutional letter from the Dean of Veritasia State University confirming completion of all graduation requirements in November 1999, prior to the annual June 2000 congregation convocation. Notarized affidavit and registrar confirmation are attached.'
  );
  const [agentName, setAgentName] = useState('Marcus Vance, Legal Representative');
  const [attachments, setAttachments] = useState<
    Array<{ fileName: string; fileSizeBytes: number; description: string }>
  >([
    {
      fileName: 'VSU_Registrar_Expedited_Convocation_Clarification.pdf',
      fileSizeBytes: 845000,
      description: 'Certified Registrar letter with official university dry seal reconciling convocation year.',
    },
    {
      fileName: 'Candidate_Statutory_Declaration_Affidavit.pdf',
      fileSizeBytes: 420000,
      description: 'Sworn affidavit before Notary Public confirming continuous bar qualification.',
    },
  ]);

  if (!rfi) return null;

  const handleSubmit = () => {
    onSubmit({
      responseText,
      agentName,
      attachments,
    });
    onClose();
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="Candidate Response & Proof Filing Portal"
      description={`Simulate candidate or legal counsel filing formal response documents for RFI [${rfi.rfiNumber}].`}
      confirmLabel="File Candidate Response"
      cancelLabel="Cancel"
      variant="primary"
    >
      <div className="space-y-4 pt-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
        {/* Banner */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
          <div className="font-bold flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-blue-700" />
            <span>Candidate Portal Submission Simulator</span>
          </div>
          <p className="text-[11px] text-blue-700 mt-1">
            Filing formal statutory representation for {rfi.candidateName} regarding: <strong>{rfi.subject}</strong>.
          </p>
        </div>

        {/* Representative */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Submitting Agent / Counsel Name</label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
          />
        </div>

        {/* Written Response */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Formal Written Explanation / Legal Clarification Statement
          </label>
          <textarea
            rows={4}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#2F75B5] leading-relaxed"
          />
        </div>

        {/* Attachments */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">Uploaded Evidence Attachments ({attachments.length})</span>
            <span className="text-[10px] font-mono text-slate-500">PDF / Verified Cryptographic Digest</span>
          </div>

          <div className="space-y-1.5">
            {attachments.map((att, i) => (
              <div key={i} className="p-2 bg-white rounded border border-slate-200 flex items-start gap-2">
                <FileText className="w-4 h-4 text-[#2F75B5] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{att.fileName}</div>
                  <div className="text-[11px] text-slate-500">{att.description}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {(att.fileSizeBytes / 1024).toFixed(1)} KB • Digital SHA-256 Stamp Generated
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ConfirmationModal>
  );
};
