import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessAge, parseBirthDate } from '../../server/src/ageValidation';
import { claimsFromLines } from './extractedClaims';
import { dailyActivity, dashboardMetrics, isSlaApproaching } from './dashboardMetrics';
import type { VerificationCase } from '../types';

test('age checks use the office, exact birthday and a visible assessment date', () => {
  assert.equal(assessAge('1991-09-27', 'President', '2026-09-27').flags.length, 0);
  assert.equal(assessAge('1991-09-28', 'President', '2026-09-27').age, 34);
  assert.match(assessAge('1991-09-28', 'President', '2026-09-27').flags[0], /below the 35/);
  assert.equal(assessAge('2001-09-27', 'House of Representatives Member', '2026-09-27').flags.length, 0);
  assert.equal(assessAge('2001-09-27', 'State House of Assembly Member', '2026-09-27').flags.length, 0);
  assert.match(assessAge('1890-01-01', 'Governor', '2026-09-27').flags[0], /data-quality/);
  for (const date of ['', '2026-02-30', '2027-01-01']) assert.equal(assessAge(date, 'President', '2026-09-27').invalid, true);
  assert.equal(parseBirthDate('30/10/1980'), '1980-10-30');
  assert.equal(parseBirthDate('30 October 1980'), '1980-10-30');
  assert.equal(parseBirthDate('October 30, 1980'), '1980-10-30');
  assert.equal(parseBirthDate('30 Octopus 1980'), null);
  assert.equal(parseBirthDate('29/02/2001'), null);
});

test('claims use only recognized text; name and DOB are unverified with real geometry', () => {
  const lines = ['Full Name: ADA OKAFOR', 'Date of Birth: 30/10/1980'].map((text, i) => ({
    text, confidence: 91, method: 'OCR' as const, region: { x: 10, y: 10 + i * 10, width: 70, height: 5, page: 2, label: 'OCR' },
  }));
  const fields = claimsFromLines('doc', lines);
  assert.equal(fields.find(f => f.fieldKey === 'FULL_NAME')?.normalizedValue, 'ADA OKAFOR');
  assert.equal(fields.find(f => f.fieldKey === 'DATE_OF_BIRTH')?.normalizedValue, '1980-10-30');
  assert.ok(fields.every(f => f.status === 'NEEDS_REVIEW' && f.sourceStatus === 'PENDING' && f.evidencePage === 2));
  assert.deepEqual(claimsFromLines('empty', []), []);
});

test('SLA is deadline-based, includes overdue and the 24h boundary, excludes completed cases', () => {
  const now = Date.parse('2026-09-27T12:00:00Z');
  const item = (hours: number, workflowStatus = 'PENDING') => ({ workflowStatus, stage: workflowStatus === 'VERIFIED' ? 'COMPLETED' : 'ANALYSIS', slaDeadline: new Date(now + hours * 3600_000).toISOString() } as VerificationCase);
  assert.ok(isSlaApproaching(item(-1), now));
  assert.ok(isSlaApproaching(item(24), now));
  assert.equal(isSlaApproaching(item(24.01), now), false);
  assert.equal(isSlaApproaching(item(-1, 'VERIFIED'), now), false);
  assert.equal(isSlaApproaching({ ...item(1), slaDeadline: 'invalid' }, now), false);
  const metrics = dashboardMetrics([item(1, 'INFO_REQUIRED'), item(1, 'VERIFIED'), item(25), item(-1)], now);
  assert.deepEqual(metrics, { pending: 2, needsReview: 0, infoRequested: 1, verified: 1, approachingSla: 2 });
});

test('throughput uses the decision date for verified cases and exactly seven calendar days', () => {
  const c = { submissionDate: '2026-09-01T00:00:00Z', workflowStatus: 'VERIFIED', recommendation: { submittedTimestamp: '2026-09-27T00:00:00Z' } } as VerificationCase;
  const days = dailyActivity([c], Date.parse('2026-09-27T12:00:00Z'));
  assert.equal(days.length, 7);
  assert.equal(days.reduce((n, d) => n + d.intake, 0), 0);
  assert.equal(days[6].verified, 1);
});
