import type { VerificationCase, Candidate, UserAccount, SourceCheck, AuditLogEvent } from '../types';
import type { DossierOptions } from './dossierService';
import { candidateReviewFlags } from './candidateReview';
import { prerequisiteChecks } from './prerequisiteChecks';

export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

export function buildDossierHtml(caseRecord: VerificationCase, candidate: Candidate, user: UserAccount,
  dateStamp: string, options: DossierOptions, sources: SourceCheck[], audit: AuditLogEvent[]) {
  if (caseRecord.candidateId !== candidate.id) throw new Error('Dossier candidate does not match the selected case');
  const e = escapeHtml;
  const privateValue = (value: unknown) => options.redactPii ? '[REDACTED]' : e(value);
  const documentRows = candidate.documents.map(doc => `<tr><td>${privateValue(doc.fileName)}</td><td>${e(doc.credentialTitle)}</td><td>${doc.totalPages}</td><td>${e(doc.extractionStatus || 'Not extracted')}</td></tr>`).join('');
  const claims = candidate.documents.flatMap(doc => doc.extractedFields.map(f => `<tr><td>${privateValue(doc.fileName)} / page ${f.evidencePage}<br>${e(f.fieldName)}</td><td>${privateValue(f.originalValue)}</td><td>${privateValue(f.correctedValue || f.normalizedValue)}</td><td>${f.extractionConfidence == null ? 'Not scored' : e(f.extractionConfidence) + '%'}</td><td>${e(f.status)}</td><td>${e(f.sourceStatus)}</td></tr>`)).join('');
  const sourceRows = sources.filter(s => s.caseId === caseRecord.id).map(s => `<tr><td>${e(s.authorityName)}</td><td>${e(s.resultStatus)}</td><td>${e(s.evidenceReference || 'No registry evidence reference')}</td><td>${privateValue(s.responsePayloadSummary)}</td></tr>`).join('');
  const auditRows = audit.filter(a => a.caseReference === caseRecord.caseReference || a.caseReference === candidate.referenceCode)
    .map(a => `<tr><td>${e(a.timestamp)}</td><td>${e(a.actorName)}</td><td>${privateValue(a.summary || a.description)}</td></tr>`).join('');
  const flags = candidateReviewFlags(candidate);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Case dossier ${e(caseRecord.caseReference)}</title>
    <style>body{font:13px Arial,sans-serif;color:#17202a;margin:32px}h1,h2{color:#17324d}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #cbd5e1;padding:8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#f1f5f9}.note{padding:12px;background:#fffbeb}section{margin:24px 0}@media print{body{margin:0}tr{break-inside:avoid}}</style></head><body>
    <h1>Candidate Evidence Dossier</h1><p>${e(caseRecord.caseReference)} — ${privateValue(candidate.fullName)}</p>
    <p>Office: ${e(candidate.officeContested)} | Election: ${e(candidate.electionName)} | Jurisdiction: ${e(candidate.jurisdiction)}</p>
    <p>Date of birth (intake): ${privateValue(candidate.dateOfBirth)} | Case status: ${e(caseRecord.workflowStatus)}</p>
    <p>Prepared by ${e(user.name)} at ${e(dateStamp)}. Purpose: ${e(options.hearingPurpose.replace(/_/g, ' '))}.</p>
    <p class="note">This binder records available evidence and reviewer actions. OCR confidence measures text recognition, not authenticity. No ballot clearance or gazette publication is implied. Original documents remain in the application's document viewer; this export includes their index and extracted claims.</p>
    <section><h2>1. Candidate-specific evidence checks</h2><table><tr><th>Evidence category</th><th>Review status</th></tr>${prerequisiteChecks(candidate).map(check => `<tr><td>${e(check.label)}</td><td>${e(check.status)}</td></tr>`).join('')}</table>
    ${flags.length ? `<p class="note">${options.redactPii ? `${flags.length} review flags (details redacted)` : flags.map(e).join('<br>')}</p>` : '<p>No automated review flags recorded. Human eligibility review is still required.</p>'}
    <p>Recommendation: ${e(caseRecord.recommendation?.recommendationType || 'Not recorded')}</p><p>${privateValue(caseRecord.recommendation?.rationale)}</p></section>
    ${options.includeFullDocuments ? `<section><h2>2. Document index and extracted claims</h2><table><tr><th>File</th><th>Credential</th><th>Pages</th><th>Extraction</th></tr>${documentRows || '<tr><td colspan="4">No documents registered.</td></tr>'}</table><table><tr><th>Evidence</th><th>Extracted text</th><th>Reviewed value</th><th>OCR confidence</th><th>Document review</th><th>Source status</th></tr>${claims || '<tr><td colspan="6">No extracted claims.</td></tr>'}</table></section>` : ''}
    ${options.includeSourceRegistryLogs ? `<section><h2>3. Source check records</h2><p>Registry connections are not configured. Legacy simulated results do not establish verification.</p><table><tr><th>Source</th><th>Status</th><th>Reference</th><th>Recorded response</th></tr>${sourceRows || '<tr><td colspan="4">No source checks recorded for this case.</td></tr>'}</table></section>` : ''}
    ${options.includeAuditLedger ? `<section><h2>4. Recorded review events</h2><table><tr><th>Time</th><th>Actor</th><th>Event</th></tr>${auditRows || '<tr><td colspan="3">No recorded case events.</td></tr>'}</table></section>` : ''}
    ${options.includeSignoffCertificate ? '<section><h2>Reviewer sign-off</h2><p>Reviewer: ____________________ Date: ____________________</p><p>Signature: ____________________</p></section>' : ''}
    </body></html>`;
}
