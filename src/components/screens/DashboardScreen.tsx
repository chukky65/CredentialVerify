import React, { useState } from 'react';
import { dashboardMetrics, dailyActivity, timestamp } from '../../services/dashboardMetrics';
import { SOURCE_CONNECTORS } from '../../data/sourceConnectors';
import { NIGERIA_JURISDICTIONS } from '../../data/jurisdictions';
import { electionOptions, scopeRecords } from '../../services/electionScope';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import {
  Users,
  FileCheck2,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Shield,
  Activity,
  Server,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardScreen: React.FC = () => {
  const { cases, candidates, navigateTo, addToast, setActiveCaseId, refreshData } = useApp();
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('ALL');
  const [selectedElection, setSelectedElection] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      addToast('Dashboard refreshed from available records.', 'info');
    } catch {
      addToast('Unable to refresh dashboard records.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const scoped = scopeRecords(candidates, cases, selectedElection, selectedJurisdiction);
  const filteredCases = scoped.cases;
  const elections = electionOptions([...candidates, ...cases]);
  const jurisdictions = Array.from(new Set(['National (All States)', ...NIGERIA_JURISDICTIONS.map(s => s.state), ...candidates.map(c => c.jurisdiction), ...cases.map(c => c.jurisdiction)])).filter(Boolean);

  const totalSubmissions = scoped.candidates.length;
  const metrics = dashboardMetrics(filteredCases);
  const pendingCount = metrics.pending;
  const needsReviewCount = metrics.needsReview;
  const infoReqCount = metrics.infoRequested;
  const completedCount = metrics.verified;
  const urgentCount = metrics.approachingSla;
  const activityData = dailyActivity(filteredCases);
  const openQueue = (status: string) => navigateTo('queue?' + new URLSearchParams({ status, election: selectedElection, jurisdiction: selectedJurisdiction }));

  // Distribution chart data
  const statusPieData = [
    { name: 'Verified', value: completedCount, color: '#237A57' },
    { name: 'Needs Review', value: needsReviewCount, color: '#B7791F' },
    { name: 'Info Required', value: infoReqCount, color: '#C56A1A' },
    { name: 'Contradicted', value: filteredCases.filter((c) => c.workflowStatus === 'CONTRADICTED').length, color: '#B83232' },
    { name: 'Restricted', value: filteredCases.filter((c) => c.workflowStatus === 'RESTRICTED').length, color: '#7C3AED' },
    { name: 'Pending Extraction', value: pendingCount, color: '#64748B' },
  ].filter(d => d.value > 0);

  // Workload by officer (dynamically calculated)
  const workloadMap: Record<string, any> = {};
  filteredCases.forEach((c) => {
    if (!c.assignedReviewerName) return;
    if (!workloadMap[c.assignedReviewerName]) {
      workloadMap[c.assignedReviewerName] = { name: c.assignedReviewerName, role: 'Reviewer', active: 0, completed: 0, overdue: 0 };
    }
    const wl = workloadMap[c.assignedReviewerName];
    if (c.workflowStatus === 'VERIFIED' && c.recommendation?.submittedTimestamp?.slice(0, 10) === new Date().toISOString().slice(0, 10)) wl.completed++;
    if (c.workflowStatus !== 'VERIFIED') wl.active++;
    // Very simple overdue check (just string comparison for demo)
    if (c.workflowStatus !== 'VERIFIED' && timestamp(c.slaDeadline) < Date.now()) wl.overdue++;
  });
  const officerWorkload = Object.values(workloadMap);

  // Source connectors health summary
  const sourceConnectors = SOURCE_CONNECTORS;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#17202A]">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Scope Filter:</span>
          </div>

          <select
            id="dashboard-election-filter"
            value={selectedElection}
            onChange={(e) => setSelectedElection(e.target.value)}
            className="text-xs bg-[#F5F7FA] border border-slate-300 rounded-md px-3 py-1.5 text-[#17202A] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
          >
            <option value="ALL">All Elections</option>
            {elections.map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <select
            id="dashboard-jurisdiction-filter"
            value={selectedJurisdiction}
            onChange={(e) => setSelectedJurisdiction(e.target.value)}
            className="text-xs bg-[#F5F7FA] border border-slate-300 rounded-md px-3 py-1.5 text-[#17202A] focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
          >
            <option value="ALL">All Jurisdictions</option>
            {jurisdictions.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
          <button 
              type="button"
              onClick={() => navigateTo('candidates/new')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#17324D] text-white rounded-md hover:bg-[#0F2236] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5] shadow-xs text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Intake New Candidate</span>
            </button>
        </div>
      </div>

      {cases.some(c => c.syncPending) && <p role="status" className="text-xs text-blue-900 bg-blue-50 p-2 rounded">Some reviews are saved on this device and awaiting server sync. Refresh Feed retries synchronization.</p>}
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          id="metric-total"
          title="Total Submissions"
          value={totalSubmissions}
          sublabel="Filing window active"
          icon={<Users className="w-5 h-5 text-[#17324D]" />}
          onClick={() => navigateTo('candidates')}
        />
        <MetricCard
          id="metric-pending"
          title="Pending Analysis"
          value={pendingCount}
          sublabel="In automated intake"
          variant="default"
          icon={<Clock className="w-5 h-5 text-slate-600" />}
          onClick={() => openQueue('PENDING')}
        />
        <MetricCard
          id="metric-needs-review"
          title="Needs Review"
          value={needsReviewCount}
          sublabel="Analyst check needed"
          variant="warning"
          icon={<AlertTriangle className="w-5 h-5 text-[#B7791F]" />}
          onClick={() => openQueue('NEEDS_REVIEW')}
        />
        <MetricCard
          id="metric-info-req"
          title="Info Requested"
          value={infoReqCount}
          sublabel="Awaiting candidate"
          variant="info"
          icon={<HelpCircle className="w-5 h-5 text-[#C56A1A]" />}
          onClick={() => openQueue('INFO_REQUIRED')}
        />
        <MetricCard
          id="metric-completed"
          title="Verified Cases"
          value={completedCount}
          sublabel="Prerequisites met"
          variant="verified"
          icon={<CheckCircle2 className="w-5 h-5 text-[#237A57]" />}
          onClick={() => openQueue('COMPLETED')}
        />
        <MetricCard
          id="metric-sla"
          title="Approaching SLA"
          value={urgentCount}
          sublabel="Due within 24h or overdue"
          variant="alert"
          icon={<Clock className="w-5 h-5 text-[#B83232]" />}
          onClick={() => openQueue('SLA')}
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Activity Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#17202A]">Daily Verification Throughput</h2>
              <p className="text-xs text-[#5B6777]">Candidate intake vs verified decisions over 7 days</p>
            </div>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">
              72h review target
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5B6777' }} />
                <YAxis tick={{ fontSize: 11, fill: '#5B6777' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#17324D', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="intake" name="New Submissions" fill="#2F75B5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="verified" name="Verified Satisfied" fill="#237A57" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#17202A]">Active Queue Distribution</h2>
            <p className="text-xs text-[#5B6777]">Breakdown by current verification stage</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#17324D', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-2 border-t border-slate-100">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-tabular font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Recent Cases Table & Source Connector Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases Priority Queue Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-sm font-semibold text-[#17202A]">Cases Awaiting Review</h2>
              <p className="text-xs text-[#5B6777]">Prioritized by statutory deadline and discrepancy status</p>
            </div>
            <button
              type="button"
              onClick={() => openQueue('ALL')}
              className="text-xs font-semibold text-[#2F75B5] hover:text-[#17324D] flex items-center gap-1"
            >
              <span>View Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#5B6777] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Case Reference</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned Officer</th>
                  <th className="py-2.5 px-3">SLA Deadline</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">No cases match the selected scope.</td></tr>}
                {filteredCases.slice(0, 5).map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => {
                      setActiveCaseId(item.id);
                      navigateTo('case-overview', { caseId: item.id, candidateId: item.candidateId });
                    }}
                  >
                    <td className="py-3 px-3">
                      <StatusBadge status={item.priority} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-[#17202A]">
                      {item.caseReference}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#17202A]">{item.candidateName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {item.officeContested}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={item.workflowStatus} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.assignedReviewerName}
                    </td>
                    <td className="py-3 px-3 font-tabular text-slate-600">
                      {item.slaDeadline}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCaseId(item.id);
                          navigateTo('workbench', { caseId: item.id, candidateId: item.candidateId });
                        }}
                        className="px-2.5 py-1 bg-[#2F75B5]/10 text-[#2F75B5] hover:bg-[#2F75B5] hover:text-white rounded font-medium text-xs transition-colors"
                      >
                        Workbench
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Source-Service Live Availability Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#2F75B5]" />
              <h2 className="text-sm font-semibold text-[#17202A]">Authoritative Source Status</h2>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('source-checks')}
              className="text-xs text-[#2F75B5] hover:underline"
            >
              Details
            </button>
          </div>

          <p className="text-xs text-[#5B6777]">
            Connection status of configured authoritative sources.
          </p>

          <div className="space-y-2.5">
            {sourceConnectors.map((src) => (
              <div
                key={src.name}
                className="p-2.5 bg-[#F5F7FA] rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-[#17202A] truncate" title={src.name}>
                    {src.name}
                  </p>
                  <p className="text-[11px] text-slate-500">{src.tier}</p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={src.status} size="sm" />
                  <span className="block text-[10px] text-slate-400 font-tabular mt-0.5">
                    {src.avgLatency}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
            <strong>Operational Note:</strong> Source connections are not configured. Health measurements and registry responses are not yet available.
          </div>
        </div>
      </div>

      {/* Reviewer Workload Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#17202A]">Review Team Workload & Allocation</h2>
            <p className="text-xs text-[#5B6777]">Assigned case distribution across authorized personnel</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {officerWorkload.map((officer) => (
            <div key={officer.name} className="p-3.5 rounded-lg border border-slate-200 bg-[#F5F7FA]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17202A]">{officer.name}</span>
                <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {officer.role}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-tabular">
                <div>
                  <span className="text-slate-500 block text-[10px]">Active In-Flight</span>
                  <span className="font-bold text-[#17202A] text-base">{officer.active}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Completed Today</span>
                  <span className="font-bold text-[#237A57] text-base">{officer.completed}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Overdue SLA</span>
                  <span className={`font-bold text-base ${officer.overdue > 0 ? 'text-[#B83232]' : 'text-slate-400'}`}>
                    {officer.overdue}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
