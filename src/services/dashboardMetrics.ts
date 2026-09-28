import type { VerificationCase } from '../types';

export function timestamp(value?: string) {
  if (!value) return NaN;
  // Legacy timestamps without an offset were written from toISOString(): interpret as UTC.
  const normalized = value.trim().replace(/ UTC$/, 'Z').replace(' ', 'T');
  return Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(normalized) ? normalized : `${normalized}Z`);
}

export function isSlaApproaching(c: VerificationCase, now = Date.now()) {
  const deadline = timestamp(c.slaDeadline);
  return c.workflowStatus !== 'VERIFIED' && c.stage !== 'COMPLETED' && Number.isFinite(deadline) && deadline <= now + 24 * 3600_000;
}

export function dashboardMetrics(cases: VerificationCase[], now = Date.now()) {
  return {
    pending: cases.filter(c => c.workflowStatus === 'PENDING').length,
    needsReview: cases.filter(c => c.workflowStatus === 'NEEDS_REVIEW').length,
    infoRequested: cases.filter(c => c.workflowStatus === 'INFO_REQUIRED').length,
    verified: cases.filter(c => c.workflowStatus === 'VERIFIED').length,
    approachingSla: cases.filter(c => isSlaApproaching(c, now)).length,
  };
}

export function dailyActivity(cases: VerificationCase[], now = Date.now()) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now - (6 - i) * 86400_000).toISOString().slice(0, 10);
    return { date, day: date.slice(5), intake: 0, verified: 0, flagged: 0 };
  });
  for (const c of cases) {
    const intake = days.find(d => d.date === c.submissionDate?.slice(0, 10));
    if (intake) intake.intake++;
    const decision = days.find(d => d.date === c.recommendation?.submittedTimestamp?.slice(0, 10));
    if (decision && c.workflowStatus === 'VERIFIED') decision.verified++;
  }
  return days;
}
