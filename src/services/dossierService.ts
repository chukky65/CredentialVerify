/**
 * Adjudication Evidence Dossier & Case Binder Generation Service
 * Assembles a comprehensive, multi-section printable statutory case binder for commission hearings.
 */

import { buildDossierHtml } from './dossierHtml';
import { verificationService } from './verificationService';
import { VerificationCase, Candidate, UserAccount } from '../types';

export interface DossierOptions {
  includeFullDocuments?: boolean;
  includeSourceRegistryLogs?: boolean;
  includeAuditLedger?: boolean;
  includeSignoffCertificate?: boolean;
  redactPii?: boolean;
  hearingPurpose: 'PRELIMINARY_SCRUTINY' | 'COMMISSION_HEARING' | 'STATUTORY_APPEAL' | 'PUBLIC_INSPECTION';
}

export interface DossierResult {
  success: boolean;
  filename: string;
  totalSections: number;
  fileSizeBytes: number;
  downloadUrl: string;
  sha256Digest: string;
  generatedTimestamp: string;
}

export async function generateEvidenceDossierPayload(
  caseRecord: VerificationCase,
  candidate: Candidate,
  user: UserAccount,
  options: DossierOptions
): Promise<DossierResult> {
  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dateStamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const [sources, audit] = await Promise.all([verificationService.getSourceChecks(caseRecord.id), verificationService.getAuditLogs()]);
  const htmlContent = buildDossierHtml(caseRecord, candidate, user, dateStamp, options, sources, audit);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `Statutory_Case_Binder_${caseRecord.caseReference.replace(/[^a-zA-Z0-9_-]/g, '_')}_${timestampStr}.html`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(htmlContent));
  const shaDigest = 'sha256:' + Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Download the printable binder; avoid popup blocking after asynchronous compilation.
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  return {
    success: true,
    filename,
    totalSections: 1 + [options.includeFullDocuments, options.includeSourceRegistryLogs, options.includeAuditLedger, options.includeSignoffCertificate].filter(Boolean).length,
    fileSizeBytes: blob.size,
    downloadUrl: url,
    sha256Digest: shaDigest,
    generatedTimestamp: dateStamp,
  };
}
