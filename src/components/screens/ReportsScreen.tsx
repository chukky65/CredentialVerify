import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from '../common/MetricCard';
import { operationalReport, reportCsv } from '../../services/reportMetrics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

export const ReportsScreen: React.FC = () => {
  const { candidates, cases, currentUser } = useApp();
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');
  const report = operationalReport(candidates, cases, dateRange);
  const format = (value: number | null, suffix: string) => value == null ? 'Not available' : value.toFixed(1) + suffix;
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([reportCsv(report)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `INEC-operational-report-${dateRange}-${report.end.slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="space-y-6 pb-16">
    <div className="print-only border-b-2 pb-4"><h1 className="text-xl font-bold">Independent National Electoral Commission (INEC)</h1><p>Operational Verification Report</p><p>Prepared by {currentUser.name} | Generated {report.end}</p></div>
    <div className="no-print bg-white p-5 rounded-xl border flex flex-wrap justify-between gap-3">
      <h2 className="font-bold">Operational Verification Reporting</h2>
      <div className="flex gap-3 flex-wrap"><select aria-label="Filter report date range" value={dateRange} onChange={e => setDateRange(e.target.value)} className="border rounded p-2 text-xs"><option value="LAST_7_DAYS">Last 7 Days</option><option value="LAST_30_DAYS">Last 30 Days</option><option value="YEAR_TO_DATE">Year to Date</option></select>
      <button className="border rounded p-2 text-xs" onClick={() => window.print()}>Print Report</button><button className="border rounded p-2 text-xs" onClick={exportCsv}>Export CSV</button></div>
    </div>
    <p className="text-xs text-slate-600">Reporting window (UTC): {report.start.slice(0, 10)} through {report.end.slice(0, 10)}. {report.documents} uploaded documents; {report.total} structured claims. Based on available records.</p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard id="rep-metric-turnaround" title="Average Turnaround Time" value={format(report.turnaround, ' hrs')} sublabel="Intake to satisfied recommendation recorded in window" />
      <MetricCard id="rep-metric-accuracy" title="Mean OCR Confidence" value={format(report.confidence, '%')} sublabel="OCR text recognition, not document authenticity" />
      <MetricCard id="rep-metric-corrections" title="Human Correction Rate" value={format(report.correctionRate, '%')} sublabel="Corrected / extracted structured claims" />
      <MetricCard id="rep-metric-sources" title="Source Availability Rate" value="Not measured" sublabel="Registry connections are not configured" />
    </div>
    <p className="text-xs text-slate-600">Extraction and correction metrics use documents uploaded in the selected window and their current review state. PDF text without OCR is not assigned a confidence score. Raw text lines are excluded from structured claim counts. No data is shown as unavailable, not as a successful result.</p>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="report-card border rounded-xl bg-white p-5"><h3 className="font-bold text-sm">Weekly Processing Turnaround Time</h3><p className="text-xs">Hours to satisfied recommendation, grouped by decision week</p>{report.weekly.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={report.weekly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Line dataKey="hours" name="Average hours" stroke="#2F75B5" isAnimationActive={false} /></LineChart></ResponsiveContainer></div> : <p className="p-8 text-sm">No completed recommendations in this window.</p>}</div>
      <div className="report-card border rounded-xl bg-white p-5"><h3 className="font-bold text-sm">Structured Claim Review</h3>{report.breakdown.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.breakdown}><XAxis dataKey="category" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="confirmed" name="Confirmed without correction" fill="#237A57" isAnimationActive={false} /><Bar dataKey="corrected" name="Analyst corrected" fill="#B7791F" isAnimationActive={false} /><Bar dataKey="pending" name="Unconfirmed" fill="#64748b" isAnimationActive={false} /></BarChart></ResponsiveContainer></div> : <p className="p-8 text-sm">No uploaded documents in this window.</p>}</div>
    </div>
    <div className="report-card border rounded-xl bg-white p-4 overflow-x-auto"><h3 className="font-bold text-sm mb-3">Credential Extraction & Analyst Correction Breakdown</h3><table className="w-full text-xs text-left"><thead><tr>{['Credential', 'Structured claims', 'Confirmed without correction', 'Analyst corrected', 'Unconfirmed'].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{report.breakdown.map(r => <tr key={r.category} className="border-t"><td className="p-2">{r.category}</td><td>{r.total}</td><td>{r.confirmed}</td><td>{r.corrected}</td><td>{r.pending}</td></tr>)}</tbody></table></div>
    <div className="report-card border rounded-xl bg-white p-4 overflow-x-auto"><h3 className="font-bold text-sm mb-3">Authoritative Source Registry Summary</h3><table className="w-full text-xs text-left"><thead><tr><th className="p-2">Organization</th><th>Availability</th><th>Average latency</th><th>Status</th></tr></thead><tbody>{report.sources.map(s => <tr key={s.id} className="border-t"><td className="p-2">{s.name}</td><td>Not measured</td><td>Not measured</td><td>Not configured</td></tr>)}</tbody></table></div>
    <p className="print-only text-xs">This report summarizes recorded operational activity. It does not certify credential authenticity, registry availability, or legal eligibility.</p>
  </div>;
};
