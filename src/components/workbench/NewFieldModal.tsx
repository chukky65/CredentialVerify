import React, { useState } from 'react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { EvidenceRegion, ExtractedField } from '../../types';
import { Crop, Sparkles, Tag, HelpCircle, Check, AlertCircle } from 'lucide-react';

interface NewFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceRegion: EvidenceRegion | null;
  pageNumber: number;
  onSave: (fieldData: {
    fieldName: string;
    fieldKey: string;
    extractedValue: string;
    evidenceLabel: string;
  }) => void;
}

const COMMON_FIELD_TEMPLATES = [
  { name: 'Issuing Authority / University', key: 'issuing_authority', defaultLabel: 'Official Header' },
  { name: 'Conferral / Admission Date', key: 'conferral_date', defaultLabel: 'Conferral Date' },
  { name: 'Registration / License Number', key: 'license_registration_no', defaultLabel: 'Registry Number' },
  { name: 'Official Signatory / Dean', key: 'signatory_name', defaultLabel: 'Authorized Signature' },
  { name: 'Statutory Seal / Stamp', key: 'statutory_seal', defaultLabel: 'Embossed Seal' },
  { name: 'Honors / Classification', key: 'academic_honors', defaultLabel: 'Honors Clause' },
  { name: 'Security Verification Stamp', key: 'security_watermark', defaultLabel: 'Security Stamp' },
];

export const NewFieldModal: React.FC<NewFieldModalProps> = ({
  isOpen,
  onClose,
  evidenceRegion,
  pageNumber,
  onSave,
}) => {
  const [fieldName, setFieldName] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [extractedValue, setExtractedValue] = useState('');
  const [evidenceLabel, setEvidenceLabel] = useState('Evidence Bounding Box');
  const [isAutoOcrProcessing, setIsAutoOcrProcessing] = useState(false);
  const [error, setError] = useState('');

  // Handle template selection
  const handleSelectTemplate = (tpl: typeof COMMON_FIELD_TEMPLATES[0]) => {
    setFieldName(tpl.name);
    setFieldKey(tpl.key);
    setEvidenceLabel(tpl.defaultLabel);
    setError('');
  };

  // Simulate OCR text extraction from drawn region
  const handleSimulateOcr = async () => {
    setIsAutoOcrProcessing(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsAutoOcrProcessing(false);

    if (fieldName.toLowerCase().includes('date') || fieldKey.includes('date')) {
      setExtractedValue('June 12, 2002');
    } else if (fieldName.toLowerCase().includes('seal') || fieldKey.includes('seal')) {
      setExtractedValue('OFFICIAL REGISTRAR EMBOSSED GOLD SEAL - VERIFIED AUTHENTIC');
    } else if (fieldName.toLowerCase().includes('signatory') || fieldKey.includes('signatory')) {
      setExtractedValue('Prof. C. Hawthorne, Dean of Law');
    } else if (fieldName.toLowerCase().includes('license') || fieldKey.includes('reg')) {
      setExtractedValue('REG-VSU-1999-0482');
    } else {
      setExtractedValue('Extracted Text from Region [Page ' + pageNumber + ']');
    }
  };

  const handleSubmit = () => {
    if (!fieldName.trim()) {
      setError('Please provide a descriptive field name.');
      return;
    }
    if (!extractedValue.trim()) {
      setError('Please input or extract the text value found in this bounding box.');
      return;
    }

    const generatedKey =
      fieldKey.trim() ||
      fieldName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');

    onSave({
      fieldName: fieldName.trim(),
      fieldKey: generatedKey,
      extractedValue: extractedValue.trim(),
      evidenceLabel: evidenceLabel.trim() || 'Custom Evidence Box',
    });

    // Reset
    setFieldName('');
    setFieldKey('');
    setExtractedValue('');
    setError('');
    onClose();
  };

  if (!evidenceRegion) return null;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title="Link Drawn Evidence Region to Structured Claim"
      description={`You have drawn a custom bounding box on Page ${pageNumber} covering (${evidenceRegion.width.toFixed(1)}% × ${evidenceRegion.height.toFixed(1)}%) of the document canvas.`}
      confirmLabel="Create Evidence Claim"
      cancelLabel="Cancel"
      variant="primary"
    >
      <div className="space-y-4 pt-2 text-xs">
        {/* Region coordinates banner */}
        <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-md flex items-center justify-between text-blue-900 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <Crop className="w-3.5 h-3.5 text-[#2F75B5]" />
            <span>Region: X:{evidenceRegion.x.toFixed(1)}% Y:{evidenceRegion.y.toFixed(1)}%</span>
          </div>
          <span>Dim: {evidenceRegion.width.toFixed(1)}% × {evidenceRegion.height.toFixed(1)}%</span>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Template Picker */}
        <div>
          <label className="block text-slate-600 font-semibold mb-1">
            Quick Select Common Statutory Field:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_FIELD_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                  fieldKey === tpl.key
                    ? 'bg-[#17324D] text-white border-[#17324D]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Field Name */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Field Name *
          </label>
          <input
            type="text"
            value={fieldName}
            onChange={(e) => {
              setFieldName(e.target.value);
              setError('');
            }}
            placeholder="e.g., Dean Signatory / Embossed Gold Seal"
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#2F75B5] focus:outline-none"
          />
        </div>

        {/* Bounding Box Label */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Field Key (Internal ID)
            </label>
            <input
              type="text"
              value={fieldKey}
              onChange={(e) => setFieldKey(e.target.value)}
              placeholder="e.g. dean_signature"
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-[#2F75B5] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Box Evidence Label
            </label>
            <input
              type="text"
              value={evidenceLabel}
              onChange={(e) => setEvidenceLabel(e.target.value)}
              placeholder="e.g., Dean Signature Block"
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#2F75B5] focus:outline-none"
            />
          </div>
        </div>

        {/* Value Input & OCR Simulation */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-700 font-semibold">
              Observed / Extracted Value *
            </label>
            <button
              type="button"
              onClick={handleSimulateOcr}
              disabled={isAutoOcrProcessing}
              className="text-[11px] font-bold text-[#2F75B5] hover:text-[#17324D] flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>{isAutoOcrProcessing ? 'Reading Region...' : 'Auto-OCR Region'}</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={extractedValue}
            onChange={(e) => {
              setExtractedValue(e.target.value);
              setError('');
            }}
            placeholder="Enter the textual evidence observed inside the drawn box..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-[#2F75B5] focus:outline-none"
          />
        </div>
      </div>
    </ConfirmationModal>
  );
};
