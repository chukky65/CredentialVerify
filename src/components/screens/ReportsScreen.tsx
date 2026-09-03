import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExportDialog } from '../common/ExportDialog';
import { MetricCard } from '../common/MetricCard';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  FileCheck,
  Building,
  Printer,
  ShieldCheck,
  FileText,
  CheckCircle,
  Hash,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export const ReportsScreen: React.FC = () => {
  const { currentUser, auditEvents, addToast } = useApp();
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Performance data
  const turnaroundData = [
    { week: 'Week 1', avgHours: 18.2, targetHours: 24 },
    { week: 'Week 2', avgHours: 14.5, targetHours: 24 },
    { week: 'Week 3', avgHours: 16.1, targetHours: 24 },
    { week: 'Week 4', avgHours: 11.8, targetHours: 24 },
  ];

  const correctionRateData = [
    { category: 'Citizenship Certificates', automatedValid: 180, humanCorrected: 6, total: 186, accuracyPct: '96.8%' },
    { category: 'Degree Qualifications', automatedValid: 140, humanCorrected: 18, total: 158, accuracyPct: '88.6%' },
    { category: 'Bar Licenses', automatedValid: 85, humanCorrected: 4, total: 89, accuracyPct: '95.5%' },
    { category: 'Asset Disclosures', automatedValid: 62, humanCorrected: 11, total: 73, accuracyPct: '84.9%' },
  ];

  const sourceRegistryPerformance = [
    { name: 'National Academic Clearinghouse (NADC)', tier: 'Tier 1 Statutory', ping: '142ms', uptime: '99.4%', status: 'Operational' },
    { name: 'Supreme Judicial Bar Roll (SJBR)', tier: 'Tier 1 Statutory', ping: '188ms', uptime: '98.9%', status: 'Operational' },
    { name: 'National Civil Status Register (NCSR)', tier: 'Tier 1 Statutory', ping: '96ms', uptime: '99.8%', status: 'Operational' },
    { name: 'Federal Revenue & Asset Registry (FRAD)', tier: 'Tier 2 Official', ping: '310ms', uptime: '96.5%', status: 'Degraded Latency' },
  ];

  const handlePrint = () => {
    addToast('Preparing print-friendly audit report...', 'info');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'LAST_7_DAYS':
        return 'Last 7 Days (Oct 18, 2026 - Oct 25, 2026)';
      case 'LAST_30_DAYS':
        return 'Last 30 Days (Sep 26, 2026 - Oct 25, 2026)';
      case 'YEAR_TO_DATE':
        return '2026 General Election Cycle (Jan 1, 2026 - Present)';
      default:
        return 'Active Audit Window';
    }
  };

  const printTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return (
    <div className="space-y-6 pb-16">
      {/* Formal Statutory Print-Only Header */}
      <div className="print-only mb-6 border-b-2 border-[#17324D] pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#17324D] flex items-center justify-center font-bold text-[#17324D] text-lg">
              🏛️
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#17324D] tracking-tight uppercase">
                Electoral Commission of Veridia
              </h1>
              <p className="text-xs font-semibold text-slate-700 tracking-wide">
                Candidate Credential Verification Platform — Statutory Operational Audit Report
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-600">
            <div><strong>Report Ref:</strong> RPT-2026-OP-{dateRange}</div>
            <div><strong>Generated:</strong> {printTimestamp}</div>
            <div><strong>Classification:</strong> OFFICIAL / AUDIT-GRADE</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs bg-slate-100 p-2.5 rounded border border-slate-300 font-sans">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Authorized Auditor</span>
            <span className="font-semibold text-slate-900">{currentUser.name} ({currentUser.staffId})</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Role & Jurisdiction</span>
            <span className="font-semibold text-slate-900">{currentUser.role.replace(/_/g, ' ')} • {currentUser.jurisdiction}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Reporting Window</span>
            <span className="font-semibold text-slate-900">{getDateRangeLabel()}</span>
          </div>
        </div>
      </div>

      {/* Screen Interactive Header */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#17202A]">Operational Verification Reporting</h2>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Audit-grade performance metrics, extraction accuracy, SLA turnaround, and throughput statistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs bg-[#F5F7FA] border border-slate-300 rounded-md px-3 py-2 text-[#17202A] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
            aria-label="Filter report date range"
          >
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="YEAR_TO_DATE">2026 Election Cycle YTD</option>
          </select>

          {/* Print Report Button */}
          <button
            type="button"
            id="print-report-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#112439] border border-[#17324D] rounded-md shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
            title="Generate print-friendly physical copy of this operational audit report"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Print Report</span>
          </button>

          {/* Export Report CSV/JSON */}
          <button
            type="button"
            id="export-report-btn"
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 break-inside-avoid">
        <MetricCard
          id="rep-metric-turnaround"
          title="Average Turnaround Time"
          value="14.2 hrs"
          sublabel="Target SLA: < 24.0 hrs"
          variant="verified"
          icon={<Clock className="w-5 h-5 text-[#237A57]" />}
        />
        <MetricCard
          id="rep-metric-accuracy"
          title="Automated Extraction Fidelity"
          value="93.8%"
          sublabel="Initial OCR & parsing confidence"
          variant="default"
          icon={<FileCheck className="w-5 h-5 text-[#17324D]" />}
        />
        <MetricCard
          id="rep-metric-corrections"
          title="Human Correction Rate"
          value="6.2%"
          sublabel="Non-destructive analyst edits"
          variant="info"
          icon={<TrendingUp className="w-5 h-5 text-[#2F75B5]" />}
        />
        <MetricCard
          id="rep-metric-sources"
          title="Source Availability Rate"
          value="98.4%"
          sublabel="Statutory API uptime"
          variant="verified"
          icon={<Building className="w-5 h-5 text-[#237A57]" />}
        />
      </div>

      {/* Analytics Charts (On Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 break-inside-avoid">
        {/* Turnaround Time Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs report-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#17202A]">Weekly Processing Turnaround Time</h3>
              <p className="text-xs text-[#5B6777]">Average hours from document intake to verified recommendation</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={turnaroundData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#17324D', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="avgHours" name="Actual Turnaround (Hours)" stroke="#2F75B5" strokeWidth={3} />
                <Line type="monotone" dataKey="targetHours" name="Statutory SLA Target (24h)" stroke="#B83232" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Human Corrections by Credential Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs report-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#17202A]">Automated Claims vs Human Corrections</h3>
              <p className="text-xs text-[#5B6777]">Validation volume by statutory credential category</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correctionRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#17324D', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="automatedValid" name="Directly Confirmed" fill="#237A57" radius={[4, 4, 0, 0]} />
                <Bar dataKey="humanCorrected" name="Analyst Corrected" fill="#B7791F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabular Data Breakdown (Essential for Physical Printouts & Audit Documentation) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden report-card break-inside-avoid">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17202A]">Credential Extraction & Analyst Correction Breakdown</h3>
            <p className="text-xs text-[#5B6777]">Granular statutory claim validation counts across all filing streams</p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            Total Claims Evaluated: 506
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-[#17202A] font-semibold border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-4">Statutory Credential Category</th>
                <th className="py-2.5 px-4 font-tabular text-right">Total Filings</th>
                <th className="py-2.5 px-4 font-tabular text-right">Directly Confirmed</th>
                <th className="py-2.5 px-4 font-tabular text-right">Analyst Corrected</th>
                <th className="py-2.5 px-4 font-tabular text-right">Accuracy Fidelity</th>
                <th className="py-2.5 px-4 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {correctionRateData.map((row) => (
                <tr key={row.category} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-medium text-[#17202A]">{row.category}</td>
                  <td className="py-2.5 px-4 font-tabular text-right text-slate-700 font-semibold">{row.total}</td>
                  <td className="py-2.5 px-4 font-tabular text-right text-[#237A57] font-semibold">{row.automatedValid}</td>
                  <td className="py-2.5 px-4 font-tabular text-right text-[#B7791F] font-semibold">{row.humanCorrected}</td>
                  <td className="py-2.5 px-4 font-tabular text-right font-bold text-slate-900">{row.accuracyPct}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      PASSED AUDIT
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authoritative Registry Uptime Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden report-card break-inside-avoid">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-[#17202A]">Authoritative Source Registry Telemetry Summary</h3>
          <p className="text-xs text-[#5B6777]">Statutory uptime, mean response latency, and connector health</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-[#17202A] font-semibold border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-4">Authority & Registry Name</th>
                <th className="py-2.5 px-4">Reliability Tier</th>
                <th className="py-2.5 px-4 font-tabular">Average Response Latency</th>
                <th className="py-2.5 px-4 font-tabular">Statutory Uptime</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {sourceRegistryPerformance.map((source) => (
                <tr key={source.name} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-semibold text-[#17202A]">{source.name}</td>
                  <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">{source.tier}</td>
                  <td className="py-2.5 px-4 font-tabular text-slate-700 font-mono">{source.ping}</td>
                  <td className="py-2.5 px-4 font-tabular font-bold text-[#237A57]">{source.uptime}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                        source.status === 'Operational'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {source.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory Auditor Sign-off and Certification Block (Print-Only) */}
      <div className="print-only mt-8 pt-6 border-t-2 border-slate-400 break-inside-avoid">
        <div className="mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
            Statutory Audit Certification & Non-Repudiation Statement
          </h4>
          <p className="text-[11px] text-slate-700 mt-1 leading-normal">
            This operational report reflects immutable, cryptographic ledger transactions recorded in compliance with
            Section 44 of the Electoral Integrity and Verification Act. All automated extractions, human adjudications,
            and source query responses have been corroborated without autonomous disqualification.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-6 pt-4 text-xs">
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-slate-900">Lead Electoral Auditor</p>
            <p className="text-slate-600 text-[10px] mt-0.5">Signature & Staff ID</p>
            <div className="h-8"></div>
            <p className="font-mono text-[10px] text-slate-500">Date: ________________________</p>
          </div>

          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-slate-900">Senior Adjudication Officer</p>
            <p className="text-slate-600 text-[10px] mt-0.5">Verification Sign-off</p>
            <div className="h-8"></div>
            <p className="font-mono text-[10px] text-slate-500">Date: ________________________</p>
          </div>

          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold text-slate-900">Commission Official Seal</p>
            <p className="text-slate-600 text-[10px] mt-0.5">Verification Stamp</p>
            <div className="h-8 flex items-center">
              <span className="border-2 border-dashed border-slate-400 px-3 py-1 text-[9px] font-mono text-slate-500 uppercase">
                [ OFFICIAL SEAL HERE ]
              </span>
            </div>
            <p className="font-mono text-[10px] text-slate-500">Stamp ID: SEC-VER-2026</p>
          </div>
        </div>
      </div>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        exportType="REPORTS"
        recordCount={4}
      />
    </div>
  );
};

