import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { ExportDialog } from '../common/ExportDialog';
import { Candidate, VerificationStatus } from '../../types';
import {
  Search,
  Filter,
  Plus,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  FileText,
  AlertCircle,
  Eye,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const CandidateDirectoryScreen: React.FC = () => {
  const { candidates, navigateTo, maskSensitiveData, setActiveCandidateId, setActiveCaseId, cases } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElection, setSelectedElection] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedReviewer, setSelectedReviewer] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  const itemsPerPage = 8;

  // Filter candidates
  const filteredCandidates = candidates.filter((cand) => {
    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = cand.fullName.toLowerCase().includes(q);
      const matchRef = cand.referenceCode.toLowerCase().includes(q);
      const matchOffice = cand.officeContested.toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchOffice) return false;
    }

    // Election filter
    if (selectedElection !== 'ALL' && cand.electionName !== selectedElection) return false;

    // Status filter
    if (selectedStatus !== 'ALL' && cand.status !== selectedStatus) return false;

    // Reviewer filter
    if (selectedReviewer !== 'ALL' && cand.assignedReviewerName !== selectedReviewer) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage) || 1;
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (cand: Candidate) => {
    setActiveCandidateId(cand.id);
    // Find matching case or default
    const matchingCase = cases.find((c) => c.candidateId === cand.id);
    if (matchingCase) {
      setActiveCaseId(matchingCase.id);
      navigateTo('case-overview', { caseId: matchingCase.id, candidateId: cand.id });
    } else {
      navigateTo('case-overview', { candidateId: cand.id });
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Summary & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#17202A]">Electoral Candidate Directory</h2>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Master register of candidate submissions, credential completeness, and verification status.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5] flex-1 sm:flex-none"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Authorized List</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('candidates/new')}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2337] rounded-md shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5] flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reference, name, office..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F5F7FA] border border-slate-300 rounded-md text-[#17202A] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            />
          </div>

          {/* Election Filter */}
          <div>
            <select
              value={selectedElection}
              onChange={(e) => {
                setSelectedElection(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-[#F5F7FA] border border-slate-300 rounded-md px-3 py-1.5 text-[#17202A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            >
              <option value="ALL">All Elections</option>
              <option value="2026 Pacifica National Assembly">2026 Pacifica National Assembly</option>
              <option value="2026 Capital Territory Gubernatorial">2026 Capital Territory Gubernatorial</option>
              <option value="2026 Western Province Judicial Council">2026 Western Province Judicial Council</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-[#F5F7FA] border border-slate-300 rounded-md px-3 py-1.5 text-[#17202A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="INFO_REQUIRED">Information Required</option>
              <option value="CONTRADICTED">Contradicted</option>
              <option value="RESTRICTED">Restricted Investigation</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {/* Reviewer Filter */}
          <div>
            <select
              value={selectedReviewer}
              onChange={(e) => {
                setSelectedReviewer(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-[#F5F7FA] border border-slate-300 rounded-md px-3 py-1.5 text-[#17202A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            >
              <option value="ALL">All Reviewers</option>
              <option value="Elena Vance">Elena Vance (Analyst)</option>
              <option value="Marcus Chen">Marcus Chen (Sr. Adjudicator)</option>
              <option value="Amina Osei">Amina Osei (Intake Officer)</option>
            </select>
          </div>
        </div>

        {/* Active filter counter summary */}
        <div className="flex items-center justify-between text-xs text-[#5B6777] pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-[#17202A]">{filteredCandidates.length}</strong> registered candidate(s)
          </span>
          {(searchTerm || selectedElection !== 'ALL' || selectedStatus !== 'ALL' || selectedReviewer !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedElection('ALL');
                setSelectedStatus('ALL');
                setSelectedReviewer('ALL');
                setCurrentPage(1);
              }}
              className="text-xs text-[#2F75B5] hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Candidate Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[#5B6777] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Candidate Reference</th>
                <th className="py-3 px-4">Full Legal Name</th>
                <th className="py-3 px-4">Contested Office & Election</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Completeness</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No candidate records match the active criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((cand) => (
                  <tr
                    key={cand.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => handleRowClick(cand)}
                  >
                    {/* Candidate Reference */}
                    <td className="py-3 px-4 font-mono font-semibold text-[#17202A]">
                      {cand.referenceCode}
                    </td>

                    {/* Legal Name & Masked DOB */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#17202A] text-sm">
                        {cand.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        DOB: {maskSensitiveData ? '••••-••-••' : cand.dateOfBirth}
                      </div>
                    </td>

                    {/* Contested Office & Election */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#17202A]">{cand.officeContested}</div>
                      <div className="text-[11px] text-slate-500">{cand.electionName}</div>
                    </td>

                    {/* Submission Date */}
                    <td className="py-3 px-4 font-tabular text-slate-600">
                      {cand.submissionDate}
                    </td>

                    {/* Completeness Bar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              cand.completenessScore === 100
                                ? 'bg-[#237A57]'
                                : cand.completenessScore >= 80
                                ? 'bg-[#B7791F]'
                                : 'bg-[#B83232]'
                            }`}
                            style={{ width: `${cand.completenessScore}%` }}
                          />
                        </div>
                        <span className="font-tabular font-semibold text-slate-700">
                          {cand.completenessScore}%
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <StatusBadge status={cand.status} size="sm" />
                    </td>

                    {/* Assigned Reviewer */}
                    <td className="py-3 px-4 text-slate-700">
                      {cand.assignedReviewerName}
                    </td>

                    {/* Last Updated */}
                    <td className="py-3 px-4 font-tabular text-slate-500 text-[11px]">
                      {cand.lastUpdated}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveActionMenuId(activeActionMenuId === cand.id ? null : cand.id)
                          }
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
                          aria-label="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeActionMenuId === cand.id && (
                          <div 
                            className="origin-top-right absolute right-0 mt-1 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 divide-y divide-slate-100 animate-fade-in"
                            onMouseLeave={() => setActiveActionMenuId(null)}
                          >
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  handleRowClick(cand);
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#2F75B5]" />
                                <span>Inspect Case File</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCandidateId(cand.id);
                                  const matchingCase = cases.find((c) => c.candidateId === cand.id);
                                  if (matchingCase) setActiveCaseId(matchingCase.id);
                                  navigateTo('workbench', { candidateId: cand.id });
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#16838D]" />
                                <span>Review Documents</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-[#5B6777]">
          <span>
            Page <strong className="text-[#17202A]">{currentPage}</strong> of{' '}
            <strong className="text-[#17202A]">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        exportType="CANDIDATES"
        recordCount={filteredCandidates.length}
      />
    </div>
  );
};
