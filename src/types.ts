/**
 * Core TypeScript definitions for CredentialVerify
 * Electoral Candidate Credential Verification Platform
 */

export type UserRole = 
  | 'INTAKE_OFFICER'
  | 'VERIFICATION_ANALYST'
  | 'SENIOR_ADJUDICATOR'
  | 'ADMINISTRATOR'
  | 'AUDITOR';

export interface UserAccount {
  is_demo?: boolean;
  id: string;
  name: string;
  email: string;
  staffId: string;
  role: UserRole;
  jurisdiction: string;
  mfaEnabled: boolean;
  lastLogin: string;
  accessReviewDate?: string;
  isActive?: boolean;
  status?: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED';
}

export type VerificationStatus = 
  | 'VERIFIED'
  | 'NEEDS_REVIEW'
  | 'INFO_REQUIRED'
  | 'CONTRADICTED'
  | 'PENDING'
  | 'RESTRICTED';

export type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'STANDARD';

export type CredentialType = 
  | 'CITIZENSHIP'
  | 'ACADEMIC_DEGREE'
  | 'PROFESSIONAL_LICENSE'
  | 'FINANCIAL_DISCLOSURE'
  | 'SECURITY_CLEARANCE';

export type CorrectionReasonCode = 
  | 'OCR_TYPO_INACCURACY'
  | 'REGISTRAR_RECORDS_AMENDMENT'
  | 'STAMP_OCCLUSION'
  | 'TRANSLATION_NORMALIZATION'
  | 'LEGAL_NAME_VARIATION';

export interface EvidenceRegion {
  page: number;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  label: string;
}

export interface QualityWarning {
  type: 'BLURRY' | 'SKEWED' | 'LOW_RESOLUTION' | 'PARTIAL_TRUNCATION' | 'SUSPICIOUS_ARTIFACT';
  message: string;
  severity: 'WARNING' | 'CRITICAL';
}

export interface ExtractedField {
  id: string;
  fieldKey: string;
  fieldName: string;
  originalValue: string;
  normalizedValue: string;
  correctedValue?: string;
  isCorrected: boolean;
  correctionReasonCode?: CorrectionReasonCode | string;
  correctionReasonNote?: string;
  correctionNote?: string;
  reviewerNote?: string;
  extractionConfidence: number; // 0 to 100 percentage
  status: VerificationStatus;
  evidencePage: number;
  evidenceRegion: EvidenceRegion;
  sourceStatus: 'MATCHED' | 'MISMATCH' | 'PENDING' | 'SOURCE_UNAVAILABLE' | 'VERIFIED';
  verifiedAgainstSource?: string;
  isUnreadable?: boolean;
  isUnsupported?: boolean;
}

export interface SubmittedDocument {
  id: string;
  candidateId: string;
  credentialType: CredentialType;
  credentialTitle: string;
  fileName: string;
  fileSizeBytes: number;
  uploadTimestamp: string;
  mimeType: string;
  totalPages: number;
  fileUrl?: string;
  extractedFields: ExtractedField[];
  qualityWarnings: QualityWarning[];
  status: VerificationStatus;
  vectorDocType: 'DEGREE' | 'BAR_LICENSE' | 'CITIZENSHIP_CERT' | 'TAX_DISCLOSURE' | 'SECURITY_CLEARANCE';
}

export type SourceReliabilityTier = 
  | 'TIER_1_STATUTORY_AUTHORITY' 
  | 'TIER_2_OFFICIAL_REGISTRY' 
  | 'TIER_3_THIRD_PARTY_VERIFIER';

export type SourceResultStatus = 
  | 'VERIFIED'
  | 'NO_RECORD'
  | 'UNAVAILABLE'
  | 'AUTH_FAILURE'
  | 'RATE_LIMITED'
  | 'MANUAL_REQUIRED';

export interface SourceCheck {
  is_demo?: boolean;
  id: string;
  caseId: string;
  authorityName: string;
  credentialType: CredentialType;
  checkedTimestamp: string;
  responseTimeMs: number;
  resultStatus: SourceResultStatus;
  reliabilityTier: SourceReliabilityTier;
  connectorStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  evidenceReference: string;
  responsePayloadSummary?: string;
}

export type DiscrepancyStatus = 'SUPPORTED' | 'CONTRADICTED' | 'PENDING' | 'SOURCE_UNAVAILABLE' | 'NOT_APPLICABLE';

export interface DiscrepancyItem {
  is_demo?: boolean;
  id: string;
  caseId: string;
  claimType: string;
  fieldLabel: string;
  candidateDocumentValue: string;
  authoritativeSourceValue: string;
  sourceName: string;
  evidenceLocation: string;
  dateChecked: string;
  reliabilityTier: SourceReliabilityTier;
  status: DiscrepancyStatus;
  resolution?: 'ACCEPTED_DOCUMENT' | 'ACCEPTED_SOURCE' | 'UNRESOLVED' | 'REQUESTED_CLARIFICATION' | 'ESCALATED';
  resolutionNote?: string;
  resolvedBy?: string;
}

export type RecommendationType = 
  | 'REQUIREMENTS_SATISFIED'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'SENIOR_ADJUDICATION_REQUIRED'
  | 'UNABLE_TO_VERIFY'
  | 'RESTRICTED_INVESTIGATION_REQUIRED';

export interface RecommendationRecord {
  recommendationType: RecommendationType;
  reasonCodes: string[];
  rationale: string;
  submittedBy: string;
  submittedTimestamp: string;
  confirmedClaimsCount: number;
  contradictedClaimsCount: number;
  openRisks: string[];
  isFinalAdverseDecision: boolean;
  finalAdjudicatorSignoff?: string;
}

export interface Candidate {
  is_demo?: boolean;
  id: string;
  referenceCode: string;
  fullName: string;
  otherNames?: string;
  dateOfBirth: string; // Maskable PII
  electionId: string;
  electionName: string;
  officeContested: string;
  jurisdiction: string;
  contactEmail: string;
  contactPhone: string;
  submissionDate: string;
  status: VerificationStatus;
  completenessScore: number; // 0-100%
  assignedReviewerId: string;
  assignedReviewerName: string;
  lastUpdated: string;
  documents: SubmittedDocument[];
}

export interface VerificationCase {
  is_demo?: boolean;
  id: string;
  caseReference: string;
  candidateId: string;
  candidateName: string;
  electionName: string;
  officeContested: string;
  jurisdiction: string;
  workflowStatus: VerificationStatus;
  stage: 'INTAKE' | 'ANALYSIS' | 'SOURCE_CHECK' | 'DISCREPANCY_REVIEW' | 'ADJUDICATION' | 'COMPLETED';
  priority: Priority;
  assignedReviewerId: string;
  assignedReviewerName: string;
  submissionDate: string;
  slaDeadline: string;
  ageHours: number;
  reasonForReview: string;
  documentsCount: number;
  claimsCount: number;
  sourceChecksCount: number;
  discrepanciesCount: number;
  openItemsCount: number;
  recommendation?: RecommendationRecord;
}

export interface AuditLogEvent {
  is_demo?: boolean;
  id: string;
  timestamp: string;
  actorId?: string;
  actorStaffId?: string;
  actorName: string;
  actorRole: UserRole;
  eventType: string;
  action?: string;
  summary?: string;
  description?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  reasonCode?: string;
  notes?: string;
  caseReference?: string;
  eventHash?: string;
  technicalHash?: string;
  severity: 'INFO' | 'AUDIT' | 'WARNING' | 'CRITICAL';
}

export type RFIStatus = 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED' | 'RESPONSE_SUBMITTED' | 'CURED_ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface RFIAttachment {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  description: string;
  sha256Hash?: string;
}

export interface CandidateRFI {
  is_demo?: boolean;
  id: string;
  rfiNumber: string; // e.g. "RFI-PAC-2026-0041"
  caseId: string;
  caseReference: string;
  candidateId: string;
  candidateName: string;
  statutoryBasis: string; // e.g. "Electoral Act § 19.3 & Verification Regulations"
  subject: string;
  discrepancyRef?: string;
  credentialType: CredentialType;
  instructions: string;
  curingRequirements: string[];
  issuedByStaffId: string;
  issuedByName: string;
  issuedTimestamp: string;
  responseDeadline: string; // Statutory clock (e.g. 48 hours or 5 calendar days)
  status: RFIStatus;
  
  // Response from Candidate
  candidateResponseText?: string;
  candidateResponseTimestamp?: string;
  submittedByAgentName?: string;
  attachments?: RFIAttachment[];
  
  // Adjudication of response
  adjudicationNote?: string;
  adjudicatedBy?: string;
  adjudicatedTimestamp?: string;
  resolutionOutcome?: 'DEFECT_CURED' | 'INSUFFICIENT_EVIDENCE' | 'FORMAL_REJECTION';
}

export interface StatutoryRule {
  is_demo?: boolean;
  id: string;
  ruleCode: string;
  name: string;
  description: string;
  targetOffice: string; // 'ALL' | 'President' | 'Governor' | 'Senator' | 'Mayor'
  credentialType: CredentialType | 'ALL';
  fieldKey: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'DATE_BEFORE' | 'DATE_AFTER' | 'IS_EMPTY' | 'NOT_EMPTY';
  expectedValue: string;
  statutoryBasis: string; // e.g. "Veridia Electoral Code § 44.2(a)"
  severity: 'CRITICAL_DISQUALIFICATION' | 'MANDATORY_FLAG' | 'ADVISORY_SCRUTINY';
  actionOnFail: 'AUTO_FLAG_DISCREPANCY' | 'ESCALATE_TO_CHAIR' | 'REQUIRE_AFFIDAVIT' | 'BLOCK_RECOMMENDATION';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface SystemConfiguration {
  elections: Array<{ id: string; name: string; date: string; jurisdiction: string; active: boolean }>;
  offices: Array<{ id: string; title: string; electionId: string; requiredCredentials: CredentialType[] }>;
  credentialTypes: Array<{ type: CredentialType; name: string; statutoryBasis: string; mandatoryClaims: string[] }>;
  approvedAuthorities: Array<{ name: string; tier: SourceReliabilityTier; endpointStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE'; lastPing: string }>;
  slaTargetsHours: Record<Priority, number>;
  reasonCodes: Array<{ code: string; label: string; category: string }>;
  retentionDays: number;
  version: string;
  effectiveDate: string;
  lastModifiedBy: string;
  approvalState: 'APPROVED' | 'PENDING_RATIFICATION';
}

export type AppRoute = 
  | 'sign-in'
  | 'signin'
  | 'dashboard'
  | 'candidates'
  | 'create-candidate'
  | 'queue'
  | 'case-overview'
  | 'cases'
  | 'workbench'
  | 'discrepancies'
  | 'discrepancy-review'
  | 'source-checks'
  | 'audit-trail'
  | 'audit-log'
  | 'reports'
  | 'gazette'
  | 'configuration'
  | 'config'
  | 'user-management'
  | 'users';
