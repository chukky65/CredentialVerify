/**
 * Verification Service Layer
 * Typed asynchronous service interfaces designed for seamless production backend replacement.
 */

import {
  Candidate,
  VerificationCase,
  SubmittedDocument,
  ExtractedField,
  SourceCheck,
  DiscrepancyItem,
  AuditLogEvent,
  RecommendationRecord,
  SystemConfiguration,
  UserAccount,
  StatutoryRule,
  CandidateRFI,
  RFIStatus,
} from '../types';
import { normalizeElection, isValidElectionOffice } from '../../server/src/elections';
import { reconcileCases } from './reconcileCases';
import { assessAge } from '../../server/src/ageValidation';
import { candidateReviewFlags } from './candidateReview';
import { hasBlockingExtraction } from './extractionQuality';
import { SOURCE_CONNECTORS } from '../data/sourceConnectors';
import { apiClient } from './apiClient';

// Local in-memory state for rapid prototyping and offline development
// Safely initialize from localStorage to survive page refreshes
let casesState: VerificationCase[] = [];
let candidatesState: Candidate[] = [];

let sourceChecksState: SourceCheck[] = [];
let discrepanciesState: DiscrepancyItem[] = [];
let auditLogsState: AuditLogEvent[] = [];
let rfisState: CandidateRFI[] = [];

try {
  const savedCases = localStorage.getItem('credential_verify_cases');
  const savedCandidates = localStorage.getItem('credential_verify_candidates');
  const savedSourceChecks = localStorage.getItem('credential_verify_source_checks');
  const savedDiscrepancies = localStorage.getItem('credential_verify_discrepancies');
  const savedAuditLogs = localStorage.getItem('credential_verify_audit_logs');
  const savedRfis = localStorage.getItem('credential_verify_rfis');

  if (savedCases) casesState = JSON.parse(savedCases);
  if (savedCandidates) candidatesState = JSON.parse(savedCandidates);
  if (savedSourceChecks) sourceChecksState = JSON.parse(savedSourceChecks);
  if (savedDiscrepancies) discrepanciesState = JSON.parse(savedDiscrepancies);
  if (savedAuditLogs) auditLogsState = JSON.parse(savedAuditLogs);
  if (savedRfis) rfisState = JSON.parse(savedRfis);
} catch (e) {
  console.warn("Failed to load mock state from localStorage");
}

const repairStoredRecords = () => {
  candidatesState = candidatesState.map(c => {
    const documents = (c.documents || []).map(doc => {
      const generated = !doc.extractionVersion && doc.extractedFields?.some(f => !f.fieldKey && /^fld_\d+_(name|dob|degree)$/.test(f.id));
      return generated ? { ...doc, extractedFields: doc.extractedFields.filter(f => !!f.fieldKey), extractionStatus: 'NEEDS_REEXTRACTION' as const, status: 'NEEDS_REVIEW' as const } : doc;
    });
    return normalizeElection({ ...c, documents });
  });
  const result = reconcileCases(casesState, casesState.filter(c => !c.id.startsWith('case_')));
  casesState = result.cases.map(c => {
    const candidate = candidatesState.find(candidate => candidate.id === c.candidateId);
    return normalizeElection(candidate ? { ...c, electionName: candidate.electionName, officeContested: candidate.officeContested, jurisdiction: candidate.jurisdiction } : c);
  });
  const relink = <T extends { caseId: string }>(record: T): T => ({ ...record, caseId: result.aliases.get(record.caseId) || record.caseId });
  sourceChecksState = sourceChecksState.map(relink);
  sourceChecksState = sourceChecksState.map(check => /^sc_\d+_\d+$/.test(check.id) && !check.evidenceReference ? {
    ...check, resultStatus: 'UNAVAILABLE', connectorStatus: 'OFFLINE', responseTimeMs: 0,
    responsePayloadSummary: 'Legacy simulated check. No authoritative registry evidence is recorded.',
  } : check);
  discrepanciesState = discrepanciesState.map(relink);
  rfisState = rfisState.map(relink);
};
repairStoredRecords();

const saveStateToStorage = () => {
  // Directory status and dashboard status must describe the same review state.
  candidatesState = candidatesState.map(candidate => {
    const linked = casesState.find(item => item.candidateId === candidate.id);
    return linked ? { ...candidate, status: linked.workflowStatus } : candidate;
  });
  try {
    localStorage.setItem('credential_verify_cases', JSON.stringify(casesState));
    localStorage.setItem('credential_verify_candidates', JSON.stringify(candidatesState));
    localStorage.setItem('credential_verify_source_checks', JSON.stringify(sourceChecksState));
    localStorage.setItem('credential_verify_discrepancies', JSON.stringify(discrepanciesState));
    localStorage.setItem('credential_verify_audit_logs', JSON.stringify(auditLogsState));
    localStorage.setItem('credential_verify_rfis', JSON.stringify(rfisState));
  } catch (e) {
    console.warn("Failed to save mock state to localStorage");
  }
};

let configState: SystemConfiguration = {
  maintenanceMode: false,
  autoVerifyEnabled: true,
  maxUploadSizeBytes: 25000000,
  allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  sessionTimeoutMinutes: 30
};
let usersState: UserAccount[] = [];
let statutoryRulesState: StatutoryRule[] = [];

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

async function persistCaseReview(item: VerificationCase) {
  item.syncPending = true;
  saveStateToStorage();
  if (item.id.startsWith('case_')) return; // browser-only case
  try {
    const candidate = candidatesState.find(c => c.id === item.candidateId);
    await apiClient.saveCaseReview(item.id, {
      workflowStatus: item.workflowStatus, stage: item.stage, recommendation: item.recommendation,
      reasonForReview: item.reasonForReview,
      rfis: rfisState.filter(r => r.caseId === item.id),
      documents: candidate?.documents.map(({ fileUrl, ...doc }) => doc) || [],
    });
    if (candidate) {
      const { syncOriginal } = await import('./documentStore');
      for (const doc of candidate.documents) await syncOriginal(doc);
    }
    item.syncPending = false;
    saveStateToStorage();
  } catch { saveStateToStorage(); /* local change stays durable and retries on refresh */ }
}
async function persistReviewForCandidate(candidateId: string) {
  const candidate = candidatesState.find(c => c.id === candidateId);
  const item = casesState.find(c => c.candidateId === candidateId);
  if (item && candidate) {
    item.claimsCount = candidate.documents.reduce((n, doc) => n + doc.extractedFields.length, 0);
    item.documentsCount = candidate.documents.length;
    await persistCaseReview(item);
  } else saveStateToStorage();
}

export const verificationService = {
  async syncCandidateOriginals(candidateId: string) {
    const item = casesState.find(c => c.candidateId === candidateId);
    if (!item || item.id.startsWith('case_')) throw new Error('This candidate has not been saved to the backend. Sign in and register the candidate on the server first.');
    await persistReviewForCandidate(candidateId);
    const candidate = candidatesState.find(c => c.id === candidateId);
    if (item.syncPending || candidate?.documents.some(doc => doc.originalStorageStatus !== 'SYNCED')) throw new Error(candidate?.documents.find(doc => doc.originalStorageError)?.originalStorageError || 'Originals are not fully saved on the server. Check your connection and reattach any missing original.');
  },
  async extractDocumentClaims(candidateId: string, documentId: string, progress?: (message: string) => void) {
    const candidate = candidatesState.find(c => c.id === candidateId);
    const index = candidate?.documents.findIndex(d => d.id === documentId) ?? -1;
    if (!candidate || index < 0) throw new Error('Document not found');
    const { extractDocument } = await import('./documentExtraction');
    const previous = candidate.documents[index];
    const result = await extractDocument(previous, progress);
    if (result.extractionStatus === 'COMPLETE') {
      // Preserve analyst edits while replacing automated output on an explicit retry.
      result.extractedFields = [...result.extractedFields, ...previous.extractedFields.filter(f => f.extractionMethod === 'MANUAL' || f.isCorrected).map(f => ({ ...f, id: f.id + '_retained' }))];
      delete result.fileUrl; // original has been migrated to IndexedDB
    } else {
      result.extractedFields = previous.extractedFields.filter(f => f.extractionMethod === 'MANUAL');
    }
    candidate.documents[index] = result;
    const item = casesState.find(c => c.candidateId === candidateId);
    if (item && (item.workflowStatus === 'PENDING' || item.workflowStatus === 'VERIFIED')) {
      item.workflowStatus = 'NEEDS_REVIEW'; item.stage = 'ANALYSIS'; item.recommendation = undefined;
    }
    await persistReviewForCandidate(candidateId);
    return result;
  },
  async reattachDocument(candidateId: string, documentId: string, file: File) {
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) || file.size > 25_000_000 || !file.size) throw new Error('Choose a PDF, JPEG or PNG no larger than 25 MB.');
    const candidate = candidatesState.find(c => c.id === candidateId);
    const doc = candidate?.documents.find(d => d.id === documentId);
    if (!doc) throw new Error('Document not found');
    const { storeOriginal } = await import('./documentStore');
    await storeOriginal(doc.id, file);
    doc.fileName = file.name; doc.mimeType = file.type; doc.fileSizeBytes = file.size;
    doc.uploadTimestamp = new Date().toISOString(); doc.fileUrl = undefined;
    doc.originalStorageStatus = 'LOCAL_ONLY'; doc.originalStorageError = undefined;
    doc.extractionStatus = 'NEEDS_REEXTRACTION'; doc.extractedFields = []; doc.rawText = undefined;
    const item = casesState.find(c => c.candidateId === candidateId);
    if (item) { item.workflowStatus = 'NEEDS_REVIEW'; item.stage = 'ANALYSIS'; item.recommendation = undefined; }
    await persistReviewForCandidate(candidateId);
  },
  // Candidate Queries & Mutations
  async getCandidates(): Promise<Candidate[]> {
    try {
      const candidates = await apiClient.getCandidates();
      // Merge backend candidates with local state, but ALWAYS preserve local documents
      // because the backend API returns shallow objects without documents
      const merged = [...candidatesState];
      candidates.forEach(backendCandidate => {
        const localIndex = merged.findIndex(m => m.id === backendCandidate.id);
        if (localIndex === -1) {
          // Brand new from backend, add it
          merged.push(backendCandidate);
        } else {
          // Already exists locally - keep local version to preserve documents, cases etc.
          // Only update top-level status fields from backend
          merged[localIndex] = {
            ...merged[localIndex],
            status: backendCandidate.status ?? merged[localIndex].status,
            // Preserve local documents - never overwrite with empty backend array
            documents: (merged[localIndex].documents && merged[localIndex].documents.length > 0)
              ? merged[localIndex].documents
              : (backendCandidate.documents || []),
          };
        }
      });
      candidatesState = merged.map(normalizeElection);
      repairStoredRecords();
      saveStateToStorage();
    } catch (e) {
      console.warn("Backend failed to load candidates, keeping local state.");
    }
    return [...candidatesState];
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    await delay(150);
    const cand = candidatesState.find((c) => c.id === id);
    return cand ? { ...cand } : null;
  },

  async createCandidate(candidateData: any): Promise<Candidate> {
    candidateData = normalizeElection(candidateData);
    if (!isValidElectionOffice(candidateData)) throw new Error('Invalid election and contested office combination');
    let newCandidate: Candidate & { cases?: VerificationCase[] };

    const age = assessAge(candidateData.dateOfBirth, candidateData.officeContested);
    if (age.invalid) throw new Error(age.flags[0]);
    const documents: SubmittedDocument[] = (candidateData.uploadedDocuments || []).map((doc: SubmittedDocument) => ({
      ...doc, extractedFields: doc.extractedFields || [], qualityWarnings: doc.qualityWarnings || [],
      extractionStatus: doc.extractionStatus || 'PENDING', status: 'NEEDS_REVIEW',
    }));
    try {
      newCandidate = await apiClient.createCandidate(candidateData);
    } catch {
      newCandidate = { ...candidateData, id: 'cand_' + crypto.randomUUID(), status: 'PENDING',
        completenessScore: 0, lastUpdated: new Date().toISOString(), documents: [] };
    }
    newCandidate.documents = documents.map(doc => ({ ...doc, candidateId: newCandidate.id }));
    const reviewFlags = candidateReviewFlags(newCandidate);
    const intakeStatus = documents.length || reviewFlags.length ? 'NEEDS_REVIEW' : 'PENDING';
    newCandidate.status = intakeStatus;

    // Reuse the server case identity; create one local case only when offline.
    const serverCase = newCandidate.cases?.[0];
    const caseId = serverCase?.id || `case_${crypto.randomUUID()}`;
    const newCase: VerificationCase = {
      id: caseId,
      caseReference: `CASE-2026-${candidateData.referenceCode.split('-').pop()}-IN`,
      candidateId: newCandidate.id,
      candidateName: newCandidate.fullName,
      electionName: newCandidate.electionName,
      officeContested: newCandidate.officeContested,
      jurisdiction: newCandidate.jurisdiction,

      priority: 'STANDARD',
      assignedReviewerId: newCandidate.assignedReviewerId,
      assignedReviewerName: newCandidate.assignedReviewerName,
      submissionDate: newCandidate.submissionDate || new Date().toISOString(),
      slaDeadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      ageHours: 1,
      documentsCount: newCandidate.documents.length,
      sourceChecksCount: newCandidate.documents.length,
      discrepanciesCount: 0,
      openItemsCount: 1,
      recommendation: undefined,
      is_demo: true,
      sourceChecks: [],
      discrepancies: [],
      rfis: [],
      ...serverCase,
      workflowStatus: intakeStatus,
      stage: documents.length ? 'ANALYSIS' : 'INTAKE',
      reasonForReview: reviewFlags.join(' ') || (documents.length ? 'Document extraction complete or awaiting attention. Analyst review required.' : 'Awaiting document intake.'),
      claimsCount: documents.reduce((count, doc) => count + doc.extractedFields.length, 0),
    } as VerificationCase;

    // Unconfigured registry connections cannot verify uploaded documents.
    newCandidate.documents.forEach((doc, idx) => {
      let authName = 'Generic Verification Authority';
      if (doc.credentialType === 'ACADEMIC_DEGREE') authName = SOURCE_CONNECTORS.find(s => s.acronym === 'NUC')!.name;
      if (doc.credentialType === 'BIRTH_CERTIFICATE') authName = SOURCE_CONNECTORS.find(s => s.acronym === 'NPC')!.name;
      if (doc.credentialType === 'NYSC_CERTIFICATE') authName = 'National Youth Service Corps (NYSC)';
      if (doc.credentialType === 'WAEC_CERTIFICATE') authName = SOURCE_CONNECTORS.find(s => s.acronym === 'WAEC')!.name;
      if (doc.credentialType === 'CITIZENSHIP') authName = SOURCE_CONNECTORS.find(s => s.acronym === 'NIMC')!.name;
      if (doc.credentialType === 'PARTY_NOMINATION') authName = SOURCE_CONNECTORS.find(s => s.acronym === 'INEC')!.name;

      const mockCheck: SourceCheck = {
        id: `sc_${Date.now()}_${idx}`,
        caseId: caseId,
        credentialType: doc.credentialType,
        authorityName: authName,
        connectorStatus: 'OFFLINE',
        resultStatus: 'UNAVAILABLE',
        reliabilityTier: 'TIER_1_STATUTORY_AUTHORITY',
        evidenceReference: '',
        checkedTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        responseTimeMs: 0,
        responsePayloadSummary: 'Source connection is not configured. No authoritative verification has been performed.'
      };
      sourceChecksState.unshift(mockCheck);
    });

    candidatesState = [newCandidate, ...candidatesState];
    casesState = [newCase, ...casesState];
    saveStateToStorage();
    if (serverCase) await persistCaseReview(newCase);
    
    return newCandidate;
  },

  // Case & Queue Queries
  async getCases(): Promise<VerificationCase[]> {
    for (const item of casesState.filter(c => c.syncPending)) await persistCaseReview(item);
    try {
      const cases = await apiClient.getCases();
      // Merge backend cases with local mock cases to ensure UI doesn't lose data
      const merged = [...casesState];
      cases.forEach(c => {
        const receivedRfis = (c as VerificationCase & { rfis?: CandidateRFI[] }).rfis;
        if (receivedRfis && !casesState.find(local => local.id === c.id)?.syncPending) {
          rfisState = [...rfisState.filter(rfi => rfi.caseId !== c.id), ...receivedRfis];
        }
        const index = merged.findIndex(m => m.id === c.id);
        if (index < 0) merged.push(c);
        else if (merged[index].syncPending === false) merged[index] = { ...merged[index], ...c, syncPending: false };
      });
      casesState = merged;
      repairStoredRecords();
      saveStateToStorage();
    } catch (e) {
      console.warn("Backend failed to load cases, keeping local state.");
    }
    repairStoredRecords();
    return [...casesState];
  },

  async getCaseById(caseId: string): Promise<VerificationCase | null> {
    await delay(150);
    const item = casesState.find((c) => c.id === caseId || c.caseReference === caseId);
    return item ? { ...item } : null;
  },

  // Document & Workbench Mutations
  async updateExtractedField(
    candidateId: string,
    documentId: string,
    fieldId: string,
    updates: Partial<ExtractedField>,
    actorName: string = 'Elena Vance',
    actorRole: any = 'VERIFICATION_ANALYST'
  ): Promise<ExtractedField | null> {
    await delay(250);
    const candidate = candidatesState.find((c) => c.id === candidateId);
    if (!candidate) return null;

    const doc = candidate.documents.find((d) => d.id === documentId);
    if (!doc) return null;

    const fieldIndex = doc.extractedFields.findIndex((f) => f.id === fieldId);
    if (fieldIndex === -1) return null;

    const oldField = doc.extractedFields[fieldIndex];
    const updatedField = { ...oldField, ...updates };
    doc.extractedFields[fieldIndex] = updatedField;

    // Record audit entry
    if (updates.isCorrected && updates.correctedValue !== oldField.correctedValue) {
      auditLogsState.unshift({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        actorId: 'usr_analyst_01',
        actorName,
        actorRole,
        eventType: 'FIELD_VALUE_CORRECTED',
        summary: `Corrected field [${oldField.fieldName}] from "${oldField.normalizedValue}" to "${updates.correctedValue}"`,
        previousValue: oldField.normalizedValue,
        newValue: updates.correctedValue,
        reason: `${updates.correctionReasonCode || 'OTHER'}: ${updates.correctionReasonNote || 'No explanation provided'}`,
        caseReference: candidate.referenceCode,
        technicalHash: `sha256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
        severity: 'INFO',
      });
    }

    await persistReviewForCandidate(candidateId);
    return updatedField;
  },

  async addExtractedField(
    candidateId: string,
    documentId: string,
    newField: Omit<ExtractedField, 'id'>,
    actorName: string = 'Elena Vance',
    actorRole: any = 'VERIFICATION_ANALYST'
  ): Promise<ExtractedField | null> {
    await delay(200);
    const candidate = candidatesState.find((c) => c.id === candidateId);
    if (!candidate) return null;

    const doc = candidate.documents.find((d) => d.id === documentId);
    if (!doc) return null;

    const field: ExtractedField = {
      ...newField,
      id: `fld_custom_${Date.now()}`,
    };

    doc.extractedFields.push(field);

    // Record audit ledger entry
    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_analyst_01',
      actorName,
      actorRole,
      eventType: 'EVIDENCE_REGION_DRAWN',
      summary: `Manual bounding box mapped: Added custom field [${field.fieldName}] on page ${field.evidencePage}`,
      newValue: `Value: "${field.originalValue}", Region: [${field.evidenceRegion.x.toFixed(1)}%, ${field.evidenceRegion.y.toFixed(1)}%, ${field.evidenceRegion.width.toFixed(1)}%x${field.evidenceRegion.height.toFixed(1)}%]`,
      reason: `Analyst manual evidence annotation (${field.evidenceRegion.label || 'Document Evidence'})`,
      caseReference: candidate.referenceCode,
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      severity: 'INFO',
    });

    await persistReviewForCandidate(candidateId);
    return field;
  },

  async deleteExtractedField(
    candidateId: string,
    documentId: string,
    fieldId: string,
    actorName: string = 'Elena Vance',
    actorRole: any = 'VERIFICATION_ANALYST'
  ): Promise<boolean> {
    await delay(150);
    const candidate = candidatesState.find((c) => c.id === candidateId);
    if (!candidate) return false;

    const doc = candidate.documents.find((d) => d.id === documentId);
    if (!doc) return false;

    const index = doc.extractedFields.findIndex((f) => f.id === fieldId);
    if (index === -1) return false;

    const removed = doc.extractedFields.splice(index, 1)[0];

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_analyst_01',
      actorName,
      actorRole,
      eventType: 'EVIDENCE_REGION_REMOVED',
      summary: `Removed field annotation [${removed.fieldName}]`,
      previousValue: removed.originalValue,
      reason: 'Analyst manual bounding box removal.',
      caseReference: candidate.referenceCode,
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'INFO',
    });

    await persistReviewForCandidate(candidateId);
    return true;
  },

  // Source Checks
  async getSourceChecks(caseId?: string): Promise<SourceCheck[]> {
    await delay(200);
    if (caseId) {
      return sourceChecksState.filter((s) => s.caseId === caseId);
    }
    return [...sourceChecksState];
  },

  async retrySourceCheck(sourceId: string): Promise<SourceCheck | null> {
    await delay(600); // simulate upstream query
    const index = sourceChecksState.findIndex((s) => s.id === sourceId);
    if (index === -1) return null;

    // No configured source adapter is available; retries cannot assert a match.
    const updated: SourceCheck = {
      ...sourceChecksState[index],
      checkedTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      resultStatus: 'UNAVAILABLE',
      connectorStatus: 'OFFLINE',
      responseTimeMs: 0,
      responsePayloadSummary: 'Source connection is not configured. No query was sent.',
    };
    sourceChecksState[index] = updated;

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_analyst_01',
      actorName: 'Elena Vance',
      actorRole: 'VERIFICATION_ANALYST',
      eventType: 'SOURCE_QUERY_RETRY',
      summary: `Manual retry unavailable for connector [${updated.authorityName}]`,
      newValue: 'Status: UNAVAILABLE (connection not configured)',
      reason: 'Analyst initiated manual source connection ping.',
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'INFO',
    });

    saveStateToStorage();
    if ('caseId' in updated) {
      const linkedCase = casesState.find(c => c.id === updated.caseId);
      if (linkedCase) await persistCaseReview(linkedCase);
    }
    return updated;
  },

  // Discrepancy Management
  async getDiscrepancies(caseId?: string): Promise<DiscrepancyItem[]> {
    await delay(150);
    if (caseId) {
      return discrepanciesState.filter((d) => d.caseId === caseId);
    }
    return [...discrepanciesState];
  },

  async resolveDiscrepancy(
    discrepancyId: string,
    resolution: DiscrepancyItem['resolution'],
    resolutionNote: string,
    actorName: string = 'Elena Vance'
  ): Promise<DiscrepancyItem | null> {
    await delay(300);
    const index = discrepanciesState.findIndex((d) => d.id === discrepancyId);
    if (index === -1) return null;

    discrepanciesState[index] = {
      ...discrepanciesState[index],
      resolution,
      resolutionNote,
      resolvedBy: actorName,
    };

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_analyst_01',
      actorName,
      actorRole: 'VERIFICATION_ANALYST',
      eventType: 'DISCREPANCY_RESOLVED',
      summary: `Updated Discrepancy [${discrepanciesState[index].claimType}] to resolution ${resolution}`,
      newValue: `Resolution: ${resolution}`,
      reason: resolutionNote,
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'INFO',
    });

    return discrepanciesState[index];
  },

  // Decision & Recommendation Submission
  async recordRecommendation(
    caseId: string,
    recommendation: RecommendationRecord
  ): Promise<VerificationCase | null> {
    await delay(400);
    const caseItem = casesState.find((c) => c.id === caseId);
    if (!caseItem) return null;

    if (recommendation.recommendationType === 'REQUIREMENTS_SATISFIED') {
      const candidate = candidatesState.find(c => c.id === caseItem.candidateId);
      if (!candidate?.documents.length || candidate.documents.some(hasBlockingExtraction)) throw new Error('Resolve missing, failed or uncertain extracted evidence before recording requirements satisfied.');
    }
    caseItem.recommendation = recommendation;
    if (recommendation.recommendationType === 'REQUIREMENTS_SATISFIED') {
      caseItem.workflowStatus = 'VERIFIED';
      caseItem.stage = 'COMPLETED';
    } else if (recommendation.recommendationType === 'ADDITIONAL_INFO_REQUIRED') {
      caseItem.workflowStatus = 'INFO_REQUIRED';
    } else if (recommendation.recommendationType === 'SENIOR_ADJUDICATION_REQUIRED') {
      caseItem.workflowStatus = 'RESTRICTED';
      caseItem.stage = 'ADJUDICATION';
    } else if (recommendation.recommendationType === 'RESTRICTED_INVESTIGATION_REQUIRED') {
      caseItem.workflowStatus = 'RESTRICTED';
    }

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_analyst_01',
      actorName: recommendation.submittedBy,
      actorRole: 'VERIFICATION_ANALYST',
      eventType: 'RECOMMENDATION_RECORDED',
      summary: `Recorded recommendation [${recommendation.recommendationType}] for Case ${caseItem.caseReference}`,
      newValue: `Recommendation: ${recommendation.recommendationType}`,
      reason: recommendation.rationale,
      caseReference: caseItem.caseReference,
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'INFO',
    });

    await persistCaseReview(caseItem);
    return { ...caseItem };
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEvent[]> {
    await delay(200);
    return [...auditLogsState];
  },

  // Configuration & Users
  async getConfiguration(): Promise<SystemConfiguration> {
    await delay(150);
    return { ...configState };
  },

  async getUsers(): Promise<UserAccount[]> {
    await delay(150);
    return [...usersState];
  },

  // Statutory Rules Engine
  async getStatutoryRules(): Promise<StatutoryRule[]> {
    await delay(150);
    return [...statutoryRulesState];
  },

  async createStatutoryRule(
    ruleData: Omit<StatutoryRule, 'id' | 'createdAt'>,
    actorName: string = 'Elena Vance',
    actorRole: any = 'VERIFICATION_ANALYST'
  ): Promise<StatutoryRule> {
    await delay(250);
    const newRule: StatutoryRule = {
      ...ruleData,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    statutoryRulesState.unshift(newRule);

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_admin_01',
      actorName,
      actorRole,
      eventType: 'STATUTORY_RULE_CONFIGURED',
      summary: `Enacted new statutory rule: [${newRule.ruleCode}] ${newRule.name}`,
      newValue: `Basis: ${newRule.statutoryBasis}, Severity: ${newRule.severity}, Action: ${newRule.actionOnFail}`,
      reason: 'Rule promulgated into verification automation engine.',
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'AUDIT',
    });

    return newRule;
  },

  async updateStatutoryRule(
    ruleId: string,
    updates: Partial<StatutoryRule>,
    actorName: string = 'Elena Vance',
    actorRole: any = 'VERIFICATION_ANALYST'
  ): Promise<StatutoryRule | null> {
    await delay(200);
    const index = statutoryRulesState.findIndex((r) => r.id === ruleId);
    if (index === -1) return null;

    const previous = statutoryRulesState[index];
    const updated = { ...previous, ...updates };
    statutoryRulesState[index] = updated;

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_admin_01',
      actorName,
      actorRole,
      eventType: 'STATUTORY_RULE_UPDATED',
      summary: `Updated statutory rule: [${updated.ruleCode}] ${updated.name}`,
      previousValue: `Active: ${previous.isActive}, Severity: ${previous.severity}`,
      newValue: `Active: ${updated.isActive}, Severity: ${updated.severity}`,
      reason: 'Rule parameters modified in system configuration ledger.',
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'INFO',
    });

    saveStateToStorage();
    if ('caseId' in updated) {
      const linkedCase = casesState.find(c => c.id === updated.caseId);
      if (linkedCase) await persistCaseReview(linkedCase);
    }
    return updated;
  },

  async deleteStatutoryRule(
    ruleId: string,
    actorName: string = 'Elena Vance',
    actorRole: any = 'VERIFICATION_ANALYST'
  ): Promise<boolean> {
    await delay(150);
    const index = statutoryRulesState.findIndex((r) => r.id === ruleId);
    if (index === -1) return false;

    const removed = statutoryRulesState.splice(index, 1)[0];

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_admin_01',
      actorName,
      actorRole,
      eventType: 'STATUTORY_RULE_REVOKED',
      summary: `Revoked statutory rule: [${removed.ruleCode}] ${removed.name}`,
      previousValue: `Code: ${removed.ruleCode}, Basis: ${removed.statutoryBasis}`,
      reason: 'Rule rescinded by authorized administrator.',
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'WARNING',
    });

    return true;
  },

  // Candidate RFI & Clarification Workflow Engine
  async getRFIs(filter?: { caseId?: string; candidateId?: string }): Promise<CandidateRFI[]> {
    await delay(150);
    if (!filter) return [...rfisState];
    return rfisState.filter((r) => {
      if (filter.caseId && r.caseId !== filter.caseId) return false;
      if (filter.candidateId && r.candidateId !== filter.candidateId) return false;
      return true;
    });
  },

  async getRFIById(id: string): Promise<CandidateRFI | null> {
    await delay(100);
    return rfisState.find((r) => r.id === id) || null;
  },

  async createRFI(
    rfiData: Omit<CandidateRFI, 'id' | 'rfiNumber' | 'issuedTimestamp' | 'status'>,
    actorName: string = 'Elena Vance',
    actorRole: any = 'VERIFICATION_ANALYST'
  ): Promise<CandidateRFI> {
    await delay(250);
    const count = rfisState.filter((r) => r.caseId === rfiData.caseId).length + 1;
    const rfiNumber = `RFI-${rfiData.caseReference || 'PAC'}-${String(count).padStart(2, '0')}`;
    
    const newRFI: CandidateRFI = {
      ...rfiData,
      id: `rfi_${Date.now()}`,
      rfiNumber,
      issuedTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'ISSUED',
    };

    rfisState.unshift(newRFI);

    // Update case status if needed
    const caseIndex = casesState.findIndex((c) => c.id === rfiData.caseId);
    if (caseIndex !== -1) {
      casesState[caseIndex].workflowStatus = 'INFO_REQUIRED';
    }

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_analyst_01',
      actorName,
      actorRole,
      eventType: 'CANDIDATE_RFI_ISSUED',
      summary: `Dispatched formal statutory RFI: [${rfiNumber}] to ${newRFI.candidateName}`,
      newValue: `Subject: ${newRFI.subject}, Deadline: ${newRFI.responseDeadline}`,
      reason: `Statutory clarification initiated under ${newRFI.statutoryBasis}.`,
      caseReference: newRFI.caseReference,
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'INFO',
    });

    const linkedCase = casesState.find(c => c.id === newRFI.caseId);
    if (linkedCase) { linkedCase.stage = 'DISCREPANCY_REVIEW'; await persistCaseReview(linkedCase); }
    return newRFI;
  },

  async submitCandidateRFIResponse(
    rfiId: string,
    responsePayload: {
      responseText: string;
      agentName: string;
      attachments?: Array<{ fileName: string; fileSizeBytes: number; description: string }>;
    }
  ): Promise<CandidateRFI | null> {
    await delay(300);
    const index = rfisState.findIndex((r) => r.id === rfiId);
    if (index === -1) return null;

    const current = rfisState[index];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const attachmentsFormatted = (responsePayload.attachments || []).map((att, i) => ({
      id: `att_${Date.now()}_${i}`,
      fileName: att.fileName,
      fileSizeBytes: att.fileSizeBytes,
      uploadedAt: timestamp,
      description: att.description,
      sha256Hash: `sha256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
    }));

    const updated: CandidateRFI = {
      ...current,
      status: 'RESPONSE_SUBMITTED',
      candidateResponseText: responsePayload.responseText,
      candidateResponseTimestamp: timestamp,
      submittedByAgentName: responsePayload.agentName,
      attachments: attachmentsFormatted,
    };

    rfisState[index] = updated;

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_candidate_portal',
      actorName: responsePayload.agentName || updated.candidateName,
      actorRole: 'INTAKE_OFFICER' as any,
      eventType: 'CANDIDATE_RFI_RESPONSE_FILED',
      summary: `Candidate response filed for [${updated.rfiNumber}]: ${attachmentsFormatted.length} evidence attachments uploaded`,
      newValue: `Response text length: ${responsePayload.responseText.length} chars`,
      caseReference: updated.caseReference,
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'INFO',
    });

    saveStateToStorage();
    if ('caseId' in updated) {
      const linkedCase = casesState.find(c => c.id === updated.caseId);
      if (linkedCase) await persistCaseReview(linkedCase);
    }
    return updated;
  },

  async adjudicateRFI(
    rfiId: string,
    outcome: 'DEFECT_CURED' | 'INSUFFICIENT_EVIDENCE' | 'FORMAL_REJECTION',
    adjudicationNote: string,
    adjudicatorName: string = 'Elena Vance',
    adjudicatorRole: any = 'VERIFICATION_ANALYST'
  ): Promise<CandidateRFI | null> {
    await delay(300);
    const index = rfisState.findIndex((r) => r.id === rfiId);
    if (index === -1) return null;

    const current = rfisState[index];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newStatus: RFIStatus = outcome === 'DEFECT_CURED' ? 'CURED_ACCEPTED' : outcome === 'FORMAL_REJECTION' ? 'REJECTED' : 'RESPONSE_SUBMITTED';

    const updated: CandidateRFI = {
      ...current,
      status: newStatus,
      resolutionOutcome: outcome,
      adjudicationNote,
      adjudicatedBy: adjudicatorName,
      adjudicatedTimestamp: timestamp,
    };

    rfisState[index] = updated;

    // If defect cured, update case workflow status
    if (outcome === 'DEFECT_CURED') {
      const caseIndex = casesState.findIndex((c) => c.id === current.caseId);
      if (caseIndex !== -1) {
        const awaitingResponse = rfisState.some(r => r.caseId === current.caseId && ['ISSUED', 'ACKNOWLEDGED', 'EXPIRED'].includes(r.status));
        casesState[caseIndex].workflowStatus = awaitingResponse ? 'INFO_REQUIRED' : 'NEEDS_REVIEW';
        if (casesState[caseIndex].discrepanciesCount > 0) {
          casesState[caseIndex].discrepanciesCount = Math.max(0, casesState[caseIndex].discrepanciesCount - 1);
        }
      }
    }

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_analyst_01',
      actorName: adjudicatorName,
      actorRole: adjudicatorRole,
      eventType: 'CANDIDATE_RFI_ADJUDICATED',
      summary: `RFI Determination recorded for [${updated.rfiNumber}]: ${outcome.replace(/_/g, ' ')}`,
      previousValue: `Status: ${current.status}`,
      newValue: `Status: ${newStatus}, Outcome: ${outcome}`,
      reason: adjudicationNote,
      caseReference: updated.caseReference,
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: outcome === 'DEFECT_CURED' ? 'AUDIT' : 'WARNING',
    });

    saveStateToStorage();
    if ('caseId' in updated) {
      const linkedCase = casesState.find(c => c.id === updated.caseId);
      if (linkedCase) await persistCaseReview(linkedCase);
    }
    return updated;
  },
};
