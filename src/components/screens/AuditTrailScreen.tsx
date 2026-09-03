import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { ExportDialog } from '../common/ExportDialog';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Calendar,
  User,
  ArrowRight,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Hash,
  FileSpreadsheet,
  FileText,
  Lock,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  generateAuditExportPayload,
  isAuthorizedForAuditExport,
  AUTHORIZED_AUDIT_EXPORT_ROLES,
} from '../../services/exportService';

export const AuditTrailScreen: React.FC = () => {
  const { auditEvents, currentUser, switchRole, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'CSV' | 'PDF' | null>(null);

  const isAuthorized = isAuthorizedForAuditExport(currentUser.role);

  const filteredEvents = auditEvents.filter((ev) => {
    const actorStaff = ev.actorStaffId || ev.actorId || '';
    const actionText = ev.action || ev.summary || '';
    const descText = ev.description || ev.summary || '';
    const hashText = ev.eventHash || ev.technicalHash || '';

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchActor = ev.actorName.toLowerCase().includes(q) || actorStaff.toLowerCase().includes(q);
      const matchAction = actionText.toLowerCase().includes(q) || descText.toLowerCase().includes(q);
      const matchHash = hashText.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchHash) return false;
    }

    if (selectedEventType !== 'ALL' && ev.eventType !== selectedEventType) return false;
    if (selectedSeverity !== 'ALL' && ev.severity !== selectedSeverity) return false;

    return true;
  });

  const handleDirectExport = async (format: 'CSV' | 'PDF') => {
    if (!isAuthorized) {
      setIsAuthModalOpen(true);
      return;
    }

    setExportingFormat(format);
    try {
      const result = await generateAuditExportPayload(
        filteredEvents,
        format,
        currentUser,
        {
          filterEventType: selectedEventType,
          filterSeverity: selectedSeverity,
          searchTerm,
        }
      );

      addToast(
        `Export Generated: ${result.filename} (${(result.fileSizeBytes / 1024).toFixed(1)} KB) - ${filteredEvents.length} events.`,
        'success'
      );
    } catch (err: any) {
      addToast(err?.message || 'Failed to generate audit export payload.', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#17202A]">Statutory Audit & Cryptographic Ledger</h2>
            {isAuthorized ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                Auditor Clearance Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Lock className="w-3 h-3 text-amber-700" />
                Restricted Clearance
              </span>
            )}
          </div>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Immutable SHA-256 chained transaction logs for all automated extractions, human edits, and recommendations.
          </p>
        </div>

        {/* Action Controls & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* CSV Export Button */}
          <button
            type="button"
            id="export-audit-csv-btn"
            onClick={() => handleDirectExport('CSV')}
            disabled={exportingFormat !== null}
            title={
              isAuthorized
                ? `Export ${filteredEvents.length} events as official CSV audit ledger`
                : 'Export restricted to Auditor & Administrator roles'
            }
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-[#2F75B5] ${
              isAuthorized
                ? 'text-[#17324D] bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs'
                : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed hover:bg-slate-150'
            }`}
          >
            {exportingFormat === 'CSV' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F75B5]" />
            ) : isAuthorized ? (
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#237A57]" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Export CSV</span>
          </button>

          {/* PDF Export Button */}
          <button
            type="button"
            id="export-audit-pdf-btn"
            onClick={() => handleDirectExport('PDF')}
            disabled={exportingFormat !== null}
            title={
              isAuthorized
                ? `Generate official PDF audit document for ${filteredEvents.length} records`
                : 'Export restricted to Auditor & Administrator roles'
            }
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-[#2F75B5] ${
              isAuthorized
                ? 'text-[#17324D] bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs'
                : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed hover:bg-slate-150'
            }`}
          >
            {exportingFormat === 'PDF' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F75B5]" />
            ) : isAuthorized ? (
              <FileText className="w-3.5 h-3.5 text-[#B7791F]" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Export PDF</span>
          </button>

          {/* Advanced Export Options Button */}
          <button
            type="button"
            id="export-audit-modal-btn"
            onClick={() => {
              if (!isAuthorized) {
                setIsAuthModalOpen(true);
              } else {
                setIsExportDialogOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#112439] border border-[#17324D] rounded-md shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
            <span>Export Options</span>
          </button>
        </div>
      </div>

      {/* Role Restriction Banner (if unauthorized) */}
      {!isAuthorized && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Auditor Clearance Required for Ledger Export (Active Role: {currentUser.role.replace(/_/g, ' ')})
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Statutory audit extraction is restricted to <strong>AUDITOR</strong> and <strong>ADMINISTRATOR</strong> credentials under Section 14 of the Electoral Integrity Act.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              switchRole('AUDITOR');
              addToast('Switched to Auditor (Marcus Sterling). Ledger export clearance granted.', 'success');
            }}
            className="px-3 py-1.5 bg-[#17324D] text-white font-semibold rounded text-xs hover:bg-[#112439] whitespace-nowrap shadow-xs"
          >
            Switch to Auditor Role →
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="audit-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search actor, action, or SHA hash..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F5F7FA] border border-slate-300 rounded-md text-[#17202A] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
          />
        </div>

        <div>
          <select
            id="audit-event-type-filter"
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="w-full text-xs bg-[#F5F7FA] border border-slate-300 rounded-md px-3 py-1.5 text-[#17202A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            aria-label="Filter by event category"
          >
            <option value="ALL">All Event Categories ({auditEvents.length})</option>
            <option value="FIELD_CORRECTION">Human Field Corrections</option>
            <option value="RECOMMENDATION_RECORDED">Verification Recommendations</option>
            <option value="SOURCE_CHECK_EXECUTED">Source Check Queries</option>
            <option value="CANDIDATE_INTAKE">Candidate Ingestion Events</option>
            <option value="WORKLOAD_REASSIGNED">Workload Reassignments</option>
          </select>
        </div>

        <div>
          <select
            id="audit-severity-filter"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full text-xs bg-[#F5F7FA] border border-slate-300 rounded-md px-3 py-1.5 text-[#17202A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            aria-label="Filter by security severity"
          >
            <option value="ALL">All Security Severities</option>
            <option value="INFO">Informational Log</option>
            <option value="AUDIT">Standard Audit Entry</option>
            <option value="WARNING">Operational Warning</option>
            <option value="CRITICAL">Critical Flag</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-[#5B6777]">
          <span className="font-semibold text-[#17202A]">
            Showing {filteredEvents.length} Recorded Ledger Events
          </span>
          <span className="font-mono text-[11px]">
            SHA-256 Chained Non-Repudiation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[#5B6777] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Authorized Actor</th>
                <th className="py-3 px-4">Action & Scope</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 font-mono">Cryptographic Hash</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const actorStaff = ev.actorStaffId || ev.actorId || 'STAFF';
                  const actionTitle = ev.action || ev.summary || ev.eventType;
                  const descText = ev.description || ev.summary || '';
                  const hashValue = ev.eventHash || ev.technicalHash || 'sha256:0000000000000000';

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 font-tabular whitespace-nowrap">
                        {ev.timestamp}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-[#17202A]">{ev.actorName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {actorStaff} • {ev.actorRole.replace(/_/g, ' ')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#17202A]">{actionTitle}</div>
                        {descText && (
                          <div className="text-[11px] text-slate-500 max-w-sm">{descText}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {ev.reasonCode ? (
                          <span className="font-mono font-semibold text-[#2F75B5] block mb-0.5">
                            {ev.reasonCode}
                          </span>
                        ) : null}
                        <span>{ev.notes || ev.reason || '—'}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : ev.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ev.severity}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={hashValue}>
                        {hashValue}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        exportType="AUDIT_TRAIL"
        recordCount={filteredEvents.length}
      />

      {/* Authorization Required Modal */}
      <ConfirmationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onConfirm={() => {
          switchRole('AUDITOR');
          setIsAuthModalOpen(false);
          addToast('Role switched to Auditor (Marcus Sterling). Export clearance granted.', 'success');
        }}
        title="Auditor Clearance Required"
        description={`Exporting statutory audit logs requires AUDITOR or ADMINISTRATOR clearance. Your active account is operating as ${currentUser.name} (${currentUser.role}).`}
        confirmLabel="Switch to Auditor Role & Proceed"
        cancelLabel="Dismiss"
        variant="primary"
      >
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
          <p className="font-semibold">Statutory RBAC Mandate (Section 14)</p>
          <p className="mt-1 text-[11px] leading-relaxed">
            The candidate verification protocol mandates that cryptographic audit logs cannot be extracted by standard intake officers or frontline analysts to preserve non-repudiation chain security.
          </p>
        </div>
      </ConfirmationModal>
    </div>
  );
};
