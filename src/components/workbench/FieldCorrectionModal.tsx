import React, { useState } from 'react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { ExtractedField, CorrectionReasonCode } from '../../types';
import { AlertCircle, History, ShieldCheck } from 'lucide-react';

interface FieldCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: ExtractedField | null;
  onSave: (fieldId: string, correctedValue: string, reasonCode: CorrectionReasonCode, note: string) => void;
}

export const FieldCorrectionModal: React.FC<FieldCorrectionModalProps> = ({
  isOpen,
  onClose,
  field,
  onSave,
}) => {
  const [correctedValue, setCorrectedValue] = useState(field?.correctedValue || field?.originalValue || '');
  const [reasonCode, setReasonCode] = useState<CorrectionReasonCode>('OCR_TYPO_INACCURACY');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Update initial value when field changes
  React.useEffect(() => {
    if (field) {
      setCorrectedValue(field.correctedValue || field.originalValue);
      setReasonCode('OCR_TYPO_INACCURACY');
      setNote('');
      setErrorMessage('');
    }
  }, [field]);

  if (!field) return null;

  const handleConfirm = () => {
    if (!correctedValue.trim()) {
      setErrorMessage('Corrected field value cannot be empty.');
      return;
    }
    if (!note.trim()) {
      setErrorMessage('Please provide an explanatory note citing the evidence basis.');
      return;
    }

    onSave(field.id, correctedValue.trim(), reasonCode, note.trim());
    onClose();
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Non-Destructive Field Value Correction"
      description={`Apply authorized correction to [${field.fieldName}].`}
      confirmLabel="Apply Verified Correction"
      cancelLabel="Cancel"
      variant="primary"
    >
      <div className="space-y-4 pt-1">
        {errorMessage && (
          <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Original Value Comparison */}
        <div className="p-3 bg-[#F5F7FA] rounded-lg border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold">Original Automated Value:</span>
            <span className="font-tabular text-[11px]">Confidence: {field.extractionConfidence}%</span>
          </div>
          <p className="font-mono font-bold text-[#17202A] text-sm bg-white p-2 rounded border border-slate-200">
            {field.originalValue}
          </p>
        </div>

        {/* Corrected Value Input */}
        <div>
          <label className="block text-xs font-semibold text-[#17202A] mb-1">
            Corrected / Verified Value <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={correctedValue}
            onChange={(e) => setCorrectedValue(e.target.value)}
            placeholder="Enter accurate value from certified evidence..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            required
          />
        </div>

        {/* Mandatory Reason Code */}
        <div>
          <label className="block text-xs font-semibold text-[#17202A] mb-1">
            Statutory Reason Code <span className="text-red-500">*</span>
          </label>
          <select
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value as CorrectionReasonCode)}
            className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-[#17202A] focus:border-[#2F75B5] focus:outline-none"
          >
            <option value="OCR_TYPO_INACCURACY">OCR_TYPO_INACCURACY — Automated extraction character distortion</option>
            <option value="REGISTRAR_RECORDS_AMENDMENT">REGISTRAR_RECORDS_AMENDMENT — Official registrar corrected dates/spelling</option>
            <option value="STAMP_OCCLUSION">STAMP_OCCLUSION — Official ink seal or watermark obscured text</option>
            <option value="TRANSLATION_NORMALIZATION">TRANSLATION_NORMALIZATION — Certified statutory translation alignment</option>
            <option value="LEGAL_NAME_VARIATION">LEGAL_NAME_VARIATION — Maternal surname or alias standard alignment</option>
          </select>
        </div>

        {/* Explanatory Note */}
        <div>
          <label className="block text-xs font-semibold text-[#17202A] mb-1">
            Explanatory Note & Evidence Citation <span className="text-red-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Citing document page, stamp number, or authoritative registrar confirmation..."
            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md text-[#17202A] focus:border-[#2F75B5] focus:outline-none"
            required
          />
        </div>

        {/* Audit Preservation Notice */}
        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded text-[11px] text-blue-950 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <span>
            <strong>Audit Preservation:</strong> Original automated extraction values are permanently preserved alongside reviewer staff IDs in the cryptographic audit log.
          </span>
        </div>
      </div>
    </ConfirmationModal>
  );
};
