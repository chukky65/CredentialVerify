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
import { apiClient } from './apiClient';

// In-memory persistent state for the active session (for endpoints not yet fully built on backend)
let candidatesState: Candidate[] = [];
let casesState: VerificationCase[] = [];
let sourceChecksState: SourceCheck[] = [];
let discrepanciesState: DiscrepancyItem[] = [];
let auditLogsState: AuditLogEvent[] = [];
let configState: SystemConfiguration = {
  maintenanceMode: false,
  autoVerifyEnabled: true,
  maxUploadSizeBytes: 25000000,
  allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  sessionTimeoutMinutes: 30
};
let usersState: UserAccount[] = [];
let statutoryRulesState: StatutoryRule[] = [];
let rfisState: CandidateRFI[] = [];

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const verificationService = {
  // Candidate Queries & Mutations
  async getCandidates(): Promise<Candidate[]> {
    try {
      const candidates = await apiClient.getCandidates();
      const merged = [...candidatesState];
      candidates.forEach(c => {
        if (!merged.find(m => m.id === c.id)) merged.push(c);
      });
      candidatesState = merged;
    } catch (e) {
      console.warn("Backend failed to load candidates, keeping local state.");
    }
    return candidatesState;
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    await delay(150);
    const cand = candidatesState.find((c) => c.id === id);
    return cand ? { ...cand } : null;
  },

  async createCandidate(candidateData: any): Promise<Candidate> {
    let newCandidate: Candidate;
    try {
      // Actually call the API to persist it to Supabase
      newCandidate = await apiClient.createCandidate(candidateData);
    } catch (error) {
      // If backend fails, fallback to creating a mock so the UI still works
      newCandidate = {
        ...candidateData,
        id: `cand_${Date.now()}`,
        status: 'PENDING',
        completenessScore: 100,
        documents: [],
        cases: []
      } as Candidate;
    }
    
    // Also locally mock the case so it appears instantly in the UI
    const newCase: VerificationCase = {
      id: `case_${Date.now()}`,
      caseReference: `CASE-2026-${candidateData.referenceCode.split('-').pop()}-IN`,
      candidateId: newCandidate.id,
      candidateName: newCandidate.fullName,
      electionName: newCandidate.electionName,
      officeContested: newCandidate.officeContested,
      jurisdiction: newCandidate.jurisdiction,
      workflowStatus: 'PENDING',
      stage: 'INTAKE',
      priority: 'STANDARD',
      assignedReviewerId: newCandidate.assignedReviewerId,
      assignedReviewerName: newCandidate.assignedReviewerName,
      submissionDate: newCandidate.submissionDate || new Date().toISOString(),
      slaDeadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      ageHours: 1,
      reasonForReview: 'New candidate intake. Automated extraction pending verification.',
      documentsCount: candidateData.documentIds ? candidateData.documentIds.length : 0,
      claimsCount: 0,
      sourceChecksCount: 0,
      discrepanciesCount: 0,
      openItemsCount: 1,
      recommendation: undefined,
      is_demo: true,
      sourceChecks: [],
      discrepancies: [],
      rfis: []
    };

    // Add to local state immediately so UI updates instantly
    candidatesState = [newCandidate, ...candidatesState];
    casesState = [newCase, ...casesState];
    
    return newCandidate;
  },

  // Case & Queue Queries
  async getCases(): Promise<VerificationCase[]> {
    try {
      const cases = await apiClient.getCases();
      // Merge backend cases with local mock cases to ensure UI doesn't lose data
      const merged = [...casesState];
      cases.forEach(c => {
        if (!merged.find(m => m.id === c.id)) merged.push(c);
      });
      casesState = merged;
    } catch (e) {
      console.warn("Backend failed to load cases, keeping local state.");
    }
    return casesState;
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

    // Simulate recovery to healthy verified state
    const updated: SourceCheck = {
      ...sourceChecksState[index],
      checkedTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      resultStatus: 'VERIFIED',
      connectorStatus: 'HEALTHY',
      responseTimeMs: Math.floor(Math.random() * 200) + 150,
      responsePayloadSummary: 'Manual retry query completed. Authoritative registry verified active match.',
    };
    sourceChecksState[index] = updated;

    auditLogsState.unshift({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      actorId: 'usr_analyst_01',
      actorName: 'Elena Vance',
      actorRole: 'VERIFICATION_ANALYST',
      eventType: 'SOURCE_QUERY_RETRY',
      summary: `Manual retry succeeded for connector [${updated.authorityName}]`,
      newValue: 'Status: VERIFIED (200 OK)',
      reason: 'Analyst initiated manual source connection ping.',
      technicalHash: `sha256:${Math.random().toString(36).substring(2)}`,
      severity: 'INFO',
    });

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
        casesState[caseIndex].workflowStatus = 'NEEDS_REVIEW';
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

    return updated;
  },
};
