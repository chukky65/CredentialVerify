import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { VerificationCase, Priority } from '../../types';
import {
  ListTodo,
  Filter,
  UserCheck,
  ArrowRight,
  Clock,
  AlertTriangle,
  Users,
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';

export const VerificationQueueScreen: React.FC = () => {
  const { cases, currentUser, navigateTo, setActiveCaseId, setActiveCandidateId, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [assigneeName, setAssigneeName] = useState('Elena Vance');

  // Filter cases
  const filteredCases = cases.filter((c) => {
    // Tab filter
    if (activeTab === 'ASSIGNED_TO_ME') {
      if (c.assignedReviewerName !== currentUser.name) return false;
    } else if (activeTab === 'NEEDS_REVIEW') {
      if (c.workflowStatus !== 'NEEDS_REVIEW') return false;
    } else if (activeTab === 'INFO_REQUIRED') {
      if (c.workflowStatus !== 'INFO_REQUIRED') return false;
    } else if (activeTab === 'SENIOR_ADJUDICATION') {
      if (c.stage !== 'ADJUDICATION') return false;
    } else if (activeTab === 'RESTRICTED') {
      if (c.workflowStatus !== 'RESTRICTED') return false;
    } else if (activeTab === 'COMPLETED') {
      if (c.workflowStatus !== 'VERIFIED') return false;
    }

    // Priority filter
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = c.candidateName.toLowerCase().includes(q);
      const matchRef = c.caseReference.toLowerCase().includes(q);
      const matchOffice = c.officeContested.toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchOffice) return false;
    }

    return true;
  });

  const handleSelectAll = () => {
    if (selectedCaseIds.length === filteredCases.length) {
      setSelectedCaseIds([]);
    } else {
      setSelectedCaseIds(filteredCases.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedCaseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAssignConfirm = () => {
    setIsBulkAssignOpen(false);
    addToast(
      `Reassigned ${selectedCaseIds.length} case(s) to ${assigneeName}. Audit entry registered.`,
      'success'
    );
    setSelectedCaseIds([]);
  };

  const tabs = [
    { id: 'ALL', label: 'All Cases', count: cases.length },
    { id: 'ASSIGNED_TO_ME', label: 'Assigned to Me', count: cases.filter((c) => c.assignedReviewerName === currentUser.name).length },
    { id: 'NEEDS_REVIEW', label: 'Needs Review', count: cases.filter((c) => c.workflowStatus === 'NEEDS_REVIEW').length },
    { id: 'INFO_REQUIRED', label: 'Information Required', count: cases.filter((c) => c.workflowStatus === 'INFO_REQUIRED').length },
    { id: 'SENIOR_ADJUDICATION', label: 'Senior Adjudication', count: cases.filter((c) => c.stage === 'ADJUDICATION').length },
    { id: 'RESTRICTED', label: 'Restricted Investigation', count: cases.filter((c) => c.workflowStatus === 'RESTRICTED').length },
    { id: 'COMPLETED', label: 'Completed', count: cases.filter((c) => c.workflowStatus === 'VERIFIED').length },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Header and Bulk Control */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#17202A]">Credential Verification Queue</h2>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Operational triage and priority workflow queue for candidate evidence packets.
          </p>
        </div>

        {selectedCaseIds.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in bg-[#17324D]/5 p-2 rounded-lg border border-[#17324D]/15">
            <span className="text-xs font-semibold text-[#17324D] px-1">
              {selectedCaseIds.length} Selected
            </span>
            <button
              type="button"
              onClick={() => setIsBulkAssignOpen(true)}
              className="px-3 py-1.5 bg-[#17324D] text-white text-xs font-semibold rounded hover:bg-[#0f2337] flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Bulk Assign Reviewer</span>
            </button>
          </div>
        )}
      </div>

      {/* Queue Category Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#17324D] text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#17202A]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-tabular px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search case ref, candidate, or office..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F5F7FA] border border-slate-300 rounded-md text-[#17202A] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5B6777] font-semibold">Priority Filter:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-[#F5F7FA] border border-slate-300 rounded-md px-3 py-1.5 text-[#17202A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="STANDARD">Standard Priority</option>
          </select>
        </div>
      </div>

      {/* Queue Table (Tablet & Desktop) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[#5B6777] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-8">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-slate-500 hover:text-slate-800"
                    aria-label="Select all cases"
                  >
                    {selectedCaseIds.length === filteredCases.length && filteredCases.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#2F75B5]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Case Reference</th>
                <th className="py-3 px-3">Candidate & Office</th>
                <th className="py-3 px-3">Workflow Stage</th>
                <th className="py-3 px-3">Reason for Review</th>
                <th className="py-3 px-3">Assigned Reviewer</th>
                <th className="py-3 px-3">Age in Queue</th>
                <th className="py-3 px-3">SLA Deadline</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => {
                const isSelected = selectedCaseIds.includes(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                    onClick={() => {
                      setActiveCaseId(c.id);
                      setActiveCandidateId(c.candidateId);
                      navigateTo('case-overview', { caseId: c.id, candidateId: c.candidateId });
                    }}
                  >
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(c.id)}
                        className="text-slate-400 hover:text-slate-700"
                        aria-label={`Select case ${c.caseReference}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#2F75B5]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={c.priority} size="sm" />
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-[#17202A]">
                      {c.caseReference}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-[#17202A]">{c.candidateName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[190px]">
                        {c.officeContested}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={c.workflowStatus} size="sm" />
                      <span className="block text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                        Stage: {c.stage.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600 max-w-[220px]">
                      <p className="truncate text-xs" title={c.reasonForReview}>
                        {c.reasonForReview}
                      </p>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {c.assignedReviewerName}
                    </td>

                    <td className="py-3 px-3 font-tabular text-slate-500">
                      {c.ageHours}h
                    </td>

                    <td className="py-3 px-3 font-tabular text-slate-600 font-medium">
                      {c.slaDeadline}
                    </td>

                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCaseId(c.id);
                            setActiveCandidateId(c.candidateId);
                            navigateTo('workbench', { caseId: c.id, candidateId: c.candidateId });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#17324D] text-white hover:bg-[#0f2337] rounded shadow-xs"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Queue Card List (Mobile only: < md) */}
      <div className="space-y-3 md:hidden">
        {filteredCases.map((c) => {
          const isSelected = selectedCaseIds.includes(c.id);
          return (
            <div
              key={c.id}
              onClick={() => {
                setActiveCaseId(c.id);
                setActiveCandidateId(c.candidateId);
                navigateTo('case-overview', { caseId: c.id, candidateId: c.candidateId });
              }}
              className={`p-4 bg-white rounded-xl border transition-all shadow-xs space-y-3 cursor-pointer ${
                isSelected ? 'border-[#2F75B5] ring-1 ring-[#2F75B5]' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(c.id);
                    }}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label={`Select case ${c.caseReference}`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#2F75B5]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <div>
                    <span className="font-mono font-bold text-xs text-[#17324D] block">
                      {c.caseReference}
                    </span>
                    <h3 className="font-bold text-sm text-[#17202A] leading-tight">
                      {c.candidateName}
                    </h3>
                  </div>
                </div>
                <StatusBadge status={c.priority} size="sm" />
              </div>

              <div className="text-xs text-slate-600">
                <p className="font-medium text-[#17202A]">{c.officeContested}</p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{c.reasonForReview}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={c.workflowStatus} size="sm" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">SLA Target</span>
                  <span className="font-mono font-semibold text-xs text-[#B83232]">{c.slaDeadline}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 gap-2">
                <span className="text-[11px] text-slate-500 truncate">
                  Assignee: <strong className="text-slate-700">{c.assignedReviewerName}</strong>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCaseId(c.id);
                    setActiveCandidateId(c.candidateId);
                    navigateTo('workbench', { caseId: c.id, candidateId: c.candidateId });
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#17324D] text-white hover:bg-[#0f2337] rounded-md shadow-xs shrink-0"
                >
                  Open Workbench
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Assign Modal */}
      <ConfirmationModal
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        onConfirm={handleBulkAssignConfirm}
        title="Bulk Assign Verification Cases"
        description={`You are reassigning ${selectedCaseIds.length} candidate case(s).`}
        confirmLabel="Confirm Workload Assignment"
      >
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#17202A] mb-1">
              Select Authorized Assignee
            </label>
            <select
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-[#17202A]"
            >
              <option value="Elena Vance">Elena Vance (Verification Analyst)</option>
              <option value="Marcus Chen">Marcus Chen (Senior Adjudicator)</option>
              <option value="Amina Osei">Amina Osei (Intake Officer)</option>
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
            <strong>Statutory Boundary:</strong> Bulk actions are restricted to workload distribution. Bulk final adverse recommendations or eligibility rejections are strictly forbidden by administrative rules.
          </div>
        </div>
      </ConfirmationModal>
    </div>
  );
};
