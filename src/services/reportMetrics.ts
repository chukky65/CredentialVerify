import type { Candidate, VerificationCase } from '../types';
import { SOURCE_CONNECTORS } from '../data/sourceConnectors';
import { timestamp } from './dashboardMetrics';

export function operationalReport(candidates: Candidate[], cases: VerificationCase[], range: string, now = new Date()) {
  const end = now.getTime();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (range === 'YEAR_TO_DATE') startDate.setUTCMonth(0, 1);
  else startDate.setUTCDate(startDate.getUTCDate() - (range === 'LAST_7_DAYS' ? 6 : 29));
  const start = startDate.getTime();
  const within = (value: string) => { const time = timestamp(value); return time >= start && time <= end; };
  const documents = candidates.flatMap(c => c.documents || []).filter(d => within(d.uploadTimestamp));
  const groups = new Map<string, { category: string; total: number; confirmed: number; corrected: number; pending: number }>();
  const confidence: number[] = [];
  for (const doc of documents) {
    const row = groups.get(doc.credentialType) || { category: doc.credentialTitle || doc.credentialType, total: 0, confirmed: 0, corrected: 0, pending: 0 };
    for (const field of doc.extractedFields) {
      // Raw OCR lines are the confidence sample; do not count derived labels twice.
      if (field.fieldKey?.startsWith('DOCUMENT_TEXT_')) {
        if (field.extractionMethod === 'OCR' && Number.isFinite(field.extractionConfidence) && field.extractionConfidence! >= 0) confidence.push(field.extractionConfidence!);
        continue;
      }
      if (!field.fieldKey) continue;
      row.total++;
      if (field.isCorrected) row.corrected++;
      else if (field.status === 'VERIFIED') row.confirmed++;
      else row.pending++;
    }
    groups.set(doc.credentialType, row);
  }
  const breakdown = [...groups.values()];
  const total = breakdown.reduce((n, r) => n + r.total, 0);
  const corrected = breakdown.reduce((n, r) => n + r.corrected, 0);
  const decisions = cases.filter(c => c.workflowStatus === 'VERIFIED' && c.recommendation?.recommendationType === 'REQUIREMENTS_SATISFIED' && within(c.recommendation.submittedTimestamp)).map(c => ({ date: c.recommendation!.submittedTimestamp, hours: (timestamp(c.recommendation!.submittedTimestamp) - timestamp(c.submissionDate)) / 3600000 })).filter(d => Number.isFinite(d.hours) && d.hours >= 0);
  const weekly = new Map<string, number[]>();
  decisions.forEach(d => { const bucket = new Date(start + Math.floor((timestamp(d.date) - start) / 604800000) * 604800000).toISOString().slice(0, 10); weekly.set(bucket, [...(weekly.get(bucket) || []), d.hours]); });
  const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  return { start: startDate.toISOString(), end: now.toISOString(), documents: documents.length, total, breakdown,
    turnaround: average(decisions.map(d => d.hours)), confidence: average(confidence), correctionRate: total ? corrected / total * 100 : null,
    weekly: [...weekly.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, hours]) => ({ week, hours: average(hours) })), sources: SOURCE_CONNECTORS };
}
export function reportCsv(report: ReturnType<typeof operationalReport>) {
  const rows: unknown[][] = [['Section', 'Item', 'Value', 'Unit', 'Window start UTC', 'Window end UTC']];
  const row = (section: string, item: string, value: unknown, unit = '') => rows.push([section, item, value ?? 'Not available', unit, report.start, report.end]);
  row('Report', 'Organization', 'Independent National Electoral Commission (INEC)');
  row('KPI', 'Average turnaround', report.turnaround, 'hours');
  row('KPI', 'Mean OCR confidence', report.confidence, 'percent');
  row('KPI', 'Human correction rate', report.correctionRate, 'percent');
  row('KPI', 'Source availability', 'Not measured');
  row('Volume', 'Uploaded documents', report.documents);
  row('Volume', 'Structured claims', report.total);
  report.breakdown.forEach(r => { for (const key of ['total', 'confirmed', 'corrected', 'pending'] as const) row('Credential', r.category + ' / ' + key, r[key], 'claims'); });
  report.weekly.forEach(r => row('Turnaround', r.week, r.hours, 'hours'));
  report.sources.forEach(s => row('Source', s.name, 'Not configured'));
  return '\uFEFF' + rows.map(r => r.map(value => { let text = String(value ?? ''); if (/^[\s]*[=+@-]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
}
