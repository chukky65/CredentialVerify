import React, { useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { Download, FileSpreadsheet, ShieldAlert, Check, Lock, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateAuditExportPayload, isAuthorizedForAuditExport } from '../../services/exportService';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'CANDIDATES' | 'CASES' | 'AUDIT_TRAIL' | 'REPORTS';
  recordCount: number;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  exportType,
  recordCount,
}) => {
  const { addToast, currentUser, auditEvents, switchRole } = useApp();
  const [includeRedactedPii, setIncludeRedactedPii] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON' | 'PDF_ARCHIVE'>('CSV');
  const [isExporting, setIsExporting] = useState(false);

  const isAuditTrail = exportType === 'AUDIT_TRAIL';
  const isAuthorized = !isAuditTrail || isAuthorizedForAuditExport(currentUser.role);

  const handleExport = async () => {
    if (!isAuthorized) {
      addToast(
        `Export Denied: Staff role [${currentUser.role}] lacks clearance for statutory ledger extraction. Auditor or Administrator required.`,
        'error'
      );
      return;
    }

    setIsExporting(true);
    try {
      if (isAuditTrail) {
        const fmt = exportFormat === 'PDF_ARCHIVE' ? 'PDF' : 'CSV';
        const result = await generateAuditExportPayload(auditEvents, fmt, currentUser, {
          maskPii: includeRedactedPii,
        });
        addToast(
          `Export downloaded: ${result.filename} (${(result.fileSizeBytes / 1024).toFixed(1)} KB) - ${recordCount} records.`,
          'success'
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        addToast(
          `Export generated: ${recordCount} authorized ${exportType.toLowerCase().replace('_', ' ')} records exported as ${exportFormat}.`,
          'success'
        );
      }
      onClose();
    } catch (err: any) {
      addToast(err?.message || 'Export failed due to authorization restriction.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleExport}
      title={`Export Authorized ${exportType.replace('_', ' ')}`}
      description={`You are about to export ${recordCount} official record(s) under staff authorization ${currentUser.staffId}.`}
      confirmLabel={isAuthorized ? "Generate Authorized Export" : "Authorization Required"}
      cancelLabel="Cancel"
      variant={isAuthorized ? "primary" : "danger"}
      isProcessing={isExporting}
    >
      <div className="space-y-4 pt-2">
        {/* Role Authorization Banner */}
        {isAuditTrail && (
          <div
            className={`p-3 rounded-md border text-xs flex items-start gap-2.5 ${
              isAuthorized
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            {isAuthorized ? (
              <ShieldCheck className="w-4 h-4 text-[#237A57] shrink-0 mt-0.5" />
            ) : (
              <Lock className="w-4 h-4 text-[#B83232] shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {isAuthorized
                  ? `Clearance Verified: ${currentUser.role}`
                  : `Restricted Access: Role [${currentUser.role}] Not Permitted`}
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                {isAuthorized
                  ? `Your active staff credentials (${currentUser.staffId}) have statutory authority to export cryptographic ledger payloads under Section 14.`
                  : `Statutory audit ledger downloads are strictly restricted to AUDITOR and ADMINISTRATOR roles. Switch to Auditor role to test export.`}
              </p>
              {!isAuthorized && (
                <button
                  type="button"
                  onClick={() => {
                    switchRole('AUDITOR');
                    addToast('Role switched to Auditor (Marcus Sterling). Export clearance granted.', 'success');
                  }}
                  className="mt-2 text-[11px] font-bold text-[#17324D] underline hover:text-[#2F75B5]"
                >
                  Switch active role to Auditor now →
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#17202A] mb-1.5">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['CSV', 'JSON', 'PDF_ARCHIVE'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className={`px-3 py-2 text-xs font-medium rounded-md border flex items-center justify-center gap-1.5 transition-colors ${
                  exportFormat === fmt
                    ? 'border-[#2F75B5] bg-[#2F75B5]/10 text-[#17324D] font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {exportFormat === fmt && <Check className="w-3.5 h-3.5 text-[#2F75B5]" />}
                <span>{fmt.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeRedactedPii}
              onChange={(e) => setIncludeRedactedPii(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#2F75B5] focus:ring-[#2F75B5]"
            />
            <span className="text-xs text-[#17202A]">
              <strong>Mask Sensitive Personal Identifiers (Recommended)</strong>
              <span className="block text-[11px] text-[#5B6777] mt-0.5">
                Applies standard statutory PII redaction masks to personal phone, date of birth, and identity registration sequences.
              </span>
            </span>
          </label>
        </div>
      </div>
    </ConfirmationModal>
  );
};
