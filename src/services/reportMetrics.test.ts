import { test } from 'node:test';
import assert from 'node:assert/strict';
import { operationalReport, reportCsv } from './reportMetrics';

test('report metrics use date-filtered documents, actual corrections and decision timestamps', () => {
  const candidates: any[] = [{ documents: [{ uploadTimestamp: '2026-09-25T00:00:00Z', credentialType: 'BIRTH_CERTIFICATE', credentialTitle: 'Birth Certificate', extractedFields: [
    { fieldKey: 'DOCUMENT_TEXT_1', extractionMethod: 'OCR', extractionConfidence: 80 },
    { fieldKey: 'FULL_NAME', extractionConfidence: 80, status: 'VERIFIED', isCorrected: false },
    { fieldKey: 'DATE_OF_BIRTH', status: 'NEEDS_REVIEW', isCorrected: true },
  ] }, { uploadTimestamp: '2026-08-01T00:00:00Z', extractedFields: [] }] }];
  const cases: any[] = [{ submissionDate: '2026-09-24T00:00:00Z', workflowStatus: 'VERIFIED', recommendation: { recommendationType: 'REQUIREMENTS_SATISFIED', submittedTimestamp: '2026-09-25T12:00:00Z' } }];
  const report = operationalReport(candidates, cases, 'LAST_7_DAYS', new Date('2026-09-27T12:00:00Z'));
  assert.equal(report.documents, 1); assert.equal(report.total, 2); assert.equal(report.confidence, 80); assert.equal(report.correctionRate, 50); assert.equal(report.turnaround, 36);
  assert.equal(report.sources.length, 6); assert.equal(report.breakdown[0].confirmed, 1);
  const csv = reportCsv(report); assert.match(csv, /Independent National Electoral Commission/); assert.match(csv, /"Average turnaround","36"/); assert.doesNotMatch(csv, /Veridia|PASSED AUDIT/);
  const empty = operationalReport([], [], 'YEAR_TO_DATE', new Date('2026-09-27'));
  assert.equal(empty.turnaround, null); assert.equal(empty.confidence, null); assert.equal(empty.correctionRate, null); assert.match(empty.start, /^2026-01-01/);
});
