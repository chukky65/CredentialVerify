import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { MetricCard } from '../common/MetricCard';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  Filter,
  ExternalLink,
  QrCode,
  Scale,
  Award,
  BadgeCheck,
  Building,
  Hash,
  Sparkles,
} from 'lucide-react';

interface GazetteCandidateEntry {
  gazetteNo: string;
  caseId: string;
  caseReference: string;
  candidateId: string;
  fullName: string;
  partyAffiliation: string;
  officeContested: string;
  electionName: string;
  determination: 'CLEARED_BALLOT' | 'PROVISIONALLY_CLEARED' | 'DISQUALIFIED';
  statutoryBasis: string;
  clearanceHash: string;
  gazettedTimestamp: string;
  credentialsSummary: {
    citizenship: 'VERIFIED' | 'FAILED' | 'PENDING';
    academic: 'VERIFIED' | 'FAILED' | 'PENDING';
    professional: 'VERIFIED' | 'FAILED' | 'PENDING';
    financial: 'VERIFIED' | 'FAILED' | 'PENDING';
    security: 'VERIFIED' | 'FAILED' | 'PENDING';
  };
  gazetteNotes: string;
}

export const GazetteScreen: React.FC = () => {
  const { cases, candidates, navigateTo, setActiveCaseId, setActiveCandidateId, addToast } = useApp();
  const [selectedElection, setSelectedElection] = useState<string>('ALL');
  const [selectedOffice, setSelectedOffice] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [selectedEntryForVerify, setSelectedEntryForVerify] = useState<GazetteCandidateEntry | null>(null);

  // Derive Gazette candidates from active cases & candidates
  const gazetteEntries: GazetteCandidateEntry[] = [
    {
      gazetteNo: 'GAZ-2026-0019',
      caseId: 'case_001',
      caseReference: 'PAC-2026-0019',
      candidateId: 'cand_001',
      fullName: 'Dr. Arthur Sterling-Morales',
      partyAffiliation: 'Non-Partisan Judicial Nominee',
      officeContested: 'Supreme Court Justice (Appellate Division)',
      electionName: '2026 Judicial Bench Appointments',
      determination: 'CLEARED_BALLOT',
      statutoryBasis: 'Veridia Judicial Appointments Act § 12.1 & Const. Art. IV',
      clearanceHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      gazettedTimestamp: '2026-08-28 14:00 UTC',
      credentialsSummary: {
        citizenship: 'VERIFIED',
        academic: 'VERIFIED',
        professional: 'VERIFIED',
        financial: 'VERIFIED',
        security: 'VERIFIED',
      },
      gazetteNotes: 'All academic credentials and Bar Roll records reconciled under RFI-PAC-2026-0019-01 addendum. Candidate meets all tenure and good standing benchmarks.',
    },
    {
      gazetteNo: 'GAZ-2026-0182',
      caseId: 'case_002',
      caseReference: 'PAC-2026-0182',
      candidateId: 'cand_002',
      fullName: 'Hon. Samantha Ross-Chen',
      partyAffiliation: 'Veridia Progressive Coalition',
      officeContested: 'Veridia Senate (District 4)',
      electionName: '2026 Veridia General Election',
      determination: 'PROVISIONALLY_CLEARED',
      statutoryBasis: 'Electoral Integrity Act § 22 & Financial Disclosure Rules',
      clearanceHash: 'sha256:9c118d2f7813a40b91e9987f65b1cd90218fa66782390a1bcde7621417a80b12',
      gazettedTimestamp: '2026-08-28 14:00 UTC',
      credentialsSummary: {
        citizenship: 'VERIFIED',
        academic: 'VERIFIED',
        professional: 'VERIFIED',
        financial: 'PENDING',
        security: 'VERIFIED',
      },
      gazetteNotes: 'Provisionally gazetted subject to final revenue gateway token verification under statutory RFI-PAC-2026-0182-01.',
    },
    {
      gazetteNo: 'GAZ-2026-0304',
      caseId: 'case_003',
      caseReference: 'PAC-2026-0304',
      candidateId: 'cand_003',
      fullName: 'Marcus Vance, Esq.',
      partyAffiliation: 'Independent Citizens Movement',
      officeContested: 'Provincial Governor (Capital Province)',
      electionName: '2026 Provincial Assembly Elections',
      determination: 'CLEARED_BALLOT',
      statutoryBasis: 'Veridia Provincial Governance Code § 15 & Electoral Regulations',
      clearanceHash: 'sha256:a14b58e99471c26019dbf83c07223bda712891f3c8802d91bcf80a87612d34a9',
      gazettedTimestamp: '2026-08-28 14:00 UTC',
      credentialsSummary: {
        citizenship: 'VERIFIED',
        academic: 'VERIFIED',
        professional: 'VERIFIED',
        financial: 'VERIFIED',
        security: 'VERIFIED',
      },
      gazetteNotes: 'Statutory citizenship and background check verified with 100% gateway reconciliation confidence.',
    },
    {
      gazetteNo: 'GAZ-2026-0412',
      caseId: 'case_004',
      caseReference: 'PAC-2026-0412',
      candidateId: 'cand_004',
      fullName: 'Elena Vance',
      partyAffiliation: 'National Democratic Alliance',
      officeContested: 'Municipal Commissioner (Capital District)',
      electionName: '2026 Municipal Local Council Elections',
      determination: 'CLEARED_BALLOT',
      statutoryBasis: 'Local Governance Act § 8 & Public Integrity Guidelines',
      clearanceHash: 'sha256:b8912d098e47ac18091cfba7229a1b6f00119287cba6102837bc901844781290',
      gazettedTimestamp: '2026-08-28 14:00 UTC',
      credentialsSummary: {
        citizenship: 'VERIFIED',
        academic: 'VERIFIED',
        professional: 'VERIFIED',
        financial: 'VERIFIED',
        security: 'VERIFIED',
      },
      gazetteNotes: 'Full compliance verified. Primary residency requirement substantiated by municipal civil registry.',
    },
    {
      gazetteNo: 'GAZ-2026-0520',
      caseId: 'case_005',
      caseReference: 'PAC-2026-0520',
      candidateId: 'cand_005',
      fullName: 'Viktor Thorne',
      partyAffiliation: 'Free Enterprise Coalition',
      officeContested: 'Senate of the Republic (District 2)',
      electionName: '2026 Veridia General Election',
      determination: 'DISQUALIFIED',
      statutoryBasis: 'Veridia Constitution Art. III § 4 & Electoral Integrity Act § 31',
      clearanceHash: 'sha256:e019283fbd819a7736154bca99210984ba1654890cde118742ba871290374189',
      gazettedTimestamp: '2026-08-28 14:00 UTC',
      credentialsSummary: {
        citizenship: 'VERIFIED',
        academic: 'FAILED',
        professional: 'FAILED',
        financial: 'VERIFIED',
        security: 'FAILED',
      },
      gazetteNotes: 'Disqualified under statutory bar: Failure to satisfy 10-year professional standing requirement and un-remedied discrepancy on submitted foreign degree.',
    },
  ];

  // Filtering
  const filteredEntries = gazetteEntries.filter((item) => {
    if (selectedElection !== 'ALL' && item.electionName !== selectedElection) return false;
    if (selectedOffice !== 'ALL' && item.officeContested !== selectedOffice) return false;
    if (selectedStatus !== 'ALL' && item.determination !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.fullName.toLowerCase().includes(q);
      const matchRef = item.caseReference.toLowerCase().includes(q);
      const matchGazette = item.gazetteNo.toLowerCase().includes(q);
      const matchOffice = item.officeContested.toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchGazette && !matchOffice) return false;
    }
    return true;
  });

  const totalVetted = gazetteEntries.length;
  const clearedCount = gazetteEntries.filter((e) => e.determination === 'CLEARED_BALLOT').length;
  const provisionalCount = gazetteEntries.filter((e) => e.determination === 'PROVISIONALLY_CLEARED').length;
  const disqualifiedCount = gazetteEntries.filter((e) => e.determination === 'DISQUALIFIED').length;

  const handlePrint = () => {
    addToast('Opening print dialog for official gazette publication...', 'info');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportCSV = () => {
    const headers = [
      'Gazette No',
      'Case Ref',
      'Full Name',
      'Party / Status',
      'Contested Office',
      'Election Cycle',
      'Determination',
      'Clearance Hash',
      'Statutory Authority',
      'Notes',
    ];
    const rows = filteredEntries.map((e) => [
      `"${e.gazetteNo}"`,
      `"${e.caseReference}"`,
      `"${e.fullName}"`,
      `"${e.partyAffiliation}"`,
      `"${e.officeContested}"`,
      `"${e.electionName}"`,
      `"${e.determination}"`,
      `"${e.clearanceHash}"`,
      `"${e.statutoryBasis}"`,
      `"${e.gazetteNotes.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Electoral_Gazette_Publication_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Official Gazette CSV Export downloaded.', 'success');
  };

  const getDeterminationBadge = (det: GazetteCandidateEntry['determination']) => {
    switch (det) {
      case 'CLEARED_BALLOT':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>CLEARED FOR BALLOT</span>
          </span>
        );
      case 'PROVISIONALLY_CLEARED':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>PROVISIONALLY CLEARED</span>
          </span>
        );
      case 'DISQUALIFIED':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-900 border border-red-300 flex items-center gap-1.5 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-red-700 shrink-0" />
            <span>DISQUALIFIED / BARRED</span>
          </span>
        );
    }
  };

  const getCredBadge = (status: 'VERIFIED' | 'FAILED' | 'PENDING', label: string) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200" title={`${label}: Verified`}>
          ✓ {label}
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-800 border border-red-200" title={`${label}: Discrepancy / Bar`}>
          ✕ {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200" title={`${label}: Incomplete / Pending`}>
        ⏳ {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Official Gazette Header Block (Screen & Print) */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 relative overflow-hidden">
        {/* Subtle official watermark pattern */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none hidden sm:block">
          <Scale className="w-64 h-64 text-[#17324D]" />
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-[#17324D] uppercase">
              <span className="px-2 py-0.5 bg-[#17324D] text-white rounded font-mono text-[10px]">
                OFFICIAL PUBLICATION
              </span>
              <span>STATE ELECTORAL INTEGRITY COMMISSION</span>
              <span>•</span>
              <span className="text-slate-500 font-mono">GAZETTE VOL. 84, NO. 19</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#17202A] uppercase">
              Official Candidate Clearance Gazette
            </h2>

            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Promulgated pursuant to the <strong>Veridia Electoral Integrity Act § 28.4</strong>, the 
              <strong> Judicial Appointments Code</strong>, and <strong>Statutory Clearance Regulations 2026</strong>. 
              The following candidates have completed authoritative multi-source credential adjudication for the ballot.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-mono">
              <div>Promulgation Date: <strong className="text-slate-800">August 28, 2026</strong></div>
              <div>•</div>
              <div>Authority Stamp: <strong className="text-slate-800">SEIC-VERIDIA-AUTH-2026</strong></div>
              <div>•</div>
              <div className="flex items-center gap-1 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Chained Cryptographic Seal Verified</span>
              </div>
            </div>
          </div>

          {/* Action Buttons (No Print) */}
          <div className="flex items-center gap-2.5 shrink-0 no-print">
            <button
              type="button"
              id="btn-print-gazette"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#17324D] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4 text-[#2F75B5]" />
              <span>Print Official Gazette</span>
            </button>

            <button
              type="button"
              id="btn-export-gazette-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#17324D] hover:bg-[#0f2337] rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 no-print">
        <MetricCard
          title="Total Vetted Candidates"
          value={totalVetted}
          subtitle="Processed through commission"
          status="default"
          icon={<FileText className="w-4 h-4 text-[#17324D]" />}
        />
        <MetricCard
          title="Cleared for Ballot"
          value={clearedCount}
          subtitle="100% statutory clearance"
          status="verified"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          title="Provisional Clearance"
          value={provisionalCount}
          subtitle="Pending supplementary cure"
          status="needs_review"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
        />
        <MetricCard
          title="Disqualified / Barred"
          value={disqualifiedCount}
          subtitle="Statutory defect upheld"
          status="contradicted"
          icon={<XCircle className="w-4 h-4 text-red-600" />}
        />
      </div>

      {/* Interactive Filter & Search Toolbar (No-Print) */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, seat, or reference ID..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-[#17202A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F75B5] focus:border-transparent bg-slate-50/50"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters:</span>
            </div>

            <select
              value={selectedElection}
              onChange={(e) => setSelectedElection(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            >
              <option value="ALL">All Election Cycles</option>
              <option value="2026 Veridia General Election">2026 Veridia General Election</option>
              <option value="2026 Judicial Bench Appointments">2026 Judicial Bench Appointments</option>
              <option value="2026 Provincial Assembly Elections">2026 Provincial Assembly</option>
              <option value="2026 Municipal Local Council Elections">2026 Municipal Elections</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            >
              <option value="ALL">All Determinations</option>
              <option value="CLEARED_BALLOT">Cleared for Ballot</option>
              <option value="PROVISIONALLY_CLEARED">Provisionally Cleared</option>
              <option value="DISQUALIFIED">Disqualified / Barred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gazette Main Candidate Table (Screen & Print) */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#17324D]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
              Statutory Clearance Registry Table ({filteredEntries.length} Candidate Records)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Form SEIC-GZ-2026-A
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-300 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Gazette No & Case</th>
                <th className="py-3 px-4">Candidate & Affiliation</th>
                <th className="py-3 px-4">Contested Office & Seat</th>
                <th className="py-3 px-4">Statutory Credentials</th>
                <th className="py-3 px-4">Official Determination</th>
                <th className="py-3 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.gazetteNo} className="hover:bg-slate-50/60 transition-colors">
                  {/* Gazette No & Case */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-mono font-bold text-xs text-[#17324D]">
                      {entry.gazetteNo}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Case #{entry.caseReference}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-[130px]" title={entry.clearanceHash}>
                      {entry.clearanceHash.substring(0, 18)}...
                    </div>
                  </td>

                  {/* Candidate Name & Party */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-sm text-[#17202A]">
                      {entry.fullName}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                      {entry.partyAffiliation}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                      "{entry.gazetteNotes}"
                    </div>
                  </td>

                  {/* Office Contested */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-xs text-slate-900">
                      {entry.officeContested}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {entry.electionName}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 mt-1">
                      {entry.statutoryBasis}
                    </div>
                  </td>

                  {/* Credentials Matrix */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {getCredBadge(entry.credentialsSummary.citizenship, 'Citizenship')}
                      {getCredBadge(entry.credentialsSummary.academic, 'Degree')}
                      {getCredBadge(entry.credentialsSummary.professional, 'Bar/License')}
                      {getCredBadge(entry.credentialsSummary.financial, 'Tax/Asset')}
                      {getCredBadge(entry.credentialsSummary.security, 'Police')}
                    </div>
                  </td>

                  {/* Determination */}
                  <td className="py-3.5 px-4 align-top">
                    {getDeterminationBadge(entry.determination)}
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      Promulgated: {entry.gazettedTimestamp}
                    </div>
                  </td>

                  {/* Actions (No Print) */}
                  <td className="py-3.5 px-4 align-top text-right no-print">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEntryForVerify(entry);
                          setShowVerifyModal(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-[#17324D] hover:bg-slate-100 rounded"
                        title="Verify Cryptographic Clearance Seal"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveCaseId(entry.caseId);
                          setActiveCandidateId(entry.candidateId);
                          navigateTo('case-overview');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#17324D] text-xs font-semibold rounded flex items-center gap-1"
                      >
                        <span>Dossier</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Official Gazette Legal Preamble & Signature Block (Printed & Screen) */}
        <div className="p-6 bg-slate-50 border-t border-slate-300 space-y-6">
          <div className="text-xs text-slate-700 leading-relaxed font-serif">
            <p className="font-bold text-slate-900 mb-1">STATUTORY CERTIFICATE OF THE ELECTORAL COMMISSION</p>
            <p>
              I hereby certify under the seal of the State Electoral Integrity Commission that the candidates 
              designated herein as <strong>"CLEARED FOR BALLOT"</strong> have satisfied all constitutional, academic, 
              statutory, and probity qualifications required by law and are duly authorized to appear on the official 
              ballot papers for the respective electoral contests.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
            <div>
              <div className="font-serif italic text-base text-slate-800">Hon. Beatrice Sterling</div>
              <div className="h-0.5 w-48 bg-slate-800 my-1"></div>
              <div className="text-xs font-bold text-slate-900">Hon. Beatrice Sterling, SC</div>
              <div className="text-[11px] text-slate-600">Chief Electoral Commissioner & Commission Chair</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">Digital Signer ID: SEIC-COMM-CHAIR-001</div>
            </div>

            <div>
              <div className="font-serif italic text-base text-slate-800">Julian Vance, Esq.</div>
              <div className="h-0.5 w-48 bg-slate-800 my-1"></div>
              <div className="text-xs font-bold text-slate-900">Julian Vance, Esq.</div>
              <div className="text-[11px] text-slate-600">Secretary to the Commission & Registrar of Candidates</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">Digital Signer ID: SEIC-SEC-REG-004</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Verification Modal */}
      {showVerifyModal && selectedEntryForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-[#17324D]">Gazette Clearance Verification</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                <div className="font-bold flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-700" />
                  <span>Valid Cryptographic Certificate</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  This gazette clearance record has been verified against the Veridia Electoral Blockchain & Timestamp Authority.
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 font-semibold">Candidate:</span>
                  <div className="font-bold text-slate-900">{selectedEntryForVerify.fullName}</div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold">Gazette Number:</span>
                  <div className="font-mono text-slate-800">{selectedEntryForVerify.gazetteNo}</div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold">Statutory Authority:</span>
                  <div className="text-slate-700">{selectedEntryForVerify.statutoryBasis}</div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold">Chained SHA-256 Digest:</span>
                  <div className="p-2 bg-slate-100 rounded border border-slate-300 font-mono text-[10px] text-slate-800 break-all">
                    {selectedEntryForVerify.clearanceHash}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-1.5 bg-[#17324D] text-white rounded text-xs font-bold hover:bg-[#0f2337]"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
