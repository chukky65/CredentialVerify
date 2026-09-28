import type { Prisma } from '@prisma/client';

function date(value: string) {
  const normalized = value?.trim().replace(/ UTC$/, 'Z').replace(' ', 'T');
  const parsed = new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(normalized) ? normalized : `${normalized}Z`);
  if (!Number.isFinite(parsed.getTime())) throw new Error('Invalid review timestamp');
  return parsed;
}

export async function saveDocuments(tx: Prisma.TransactionClient, candidateId: string, documents: any[]) {
  for (const doc of documents) {
    const existing = await tx.submittedDocument.findUnique({ where: { id: doc.id } });
    if (existing && existing.candidateId !== candidateId) throw new Error('Document does not belong to this candidate');
    const fields = (doc.extractedFields || []).map((f: any) => ({
      id: f.id, fieldKey: f.fieldKey, fieldName: f.fieldName, originalValue: f.originalValue,
      normalizedValue: f.normalizedValue, correctedValue: f.correctedValue || null,
      isCorrected: !!f.isCorrected, correctionReasonCode: f.correctionReasonCode,
      correctionNote: f.correctionNote, extractionConfidence: f.extractionConfidence == null ? -1 : Math.round(f.extractionConfidence),
      status: f.status, evidencePage: f.evidencePage,
      evidenceRegionX: f.evidenceRegion?.x, evidenceRegionY: f.evidenceRegion?.y,
      evidenceRegionW: f.evidenceRegion?.width, evidenceRegionH: f.evidenceRegion?.height,
      evidenceRegionLabel: f.evidenceRegion?.label, sourceStatus: f.sourceStatus,
    }));
    const data = {
      credentialType: doc.credentialType, credentialTitle: doc.credentialTitle, fileName: doc.fileName,
      fileSizeBytes: doc.fileSizeBytes, uploadTimestamp: date(doc.uploadTimestamp), mimeType: doc.mimeType,
      totalPages: doc.totalPages, status: doc.status, vectorDocType: doc.vectorDocType,
      extractionMetadata: { status: doc.extractionStatus || 'PENDING', error: doc.extractionError || null, version: doc.extractionVersion || null, rawText: doc.rawText || '', methods: Object.fromEntries((doc.extractedFields || []).map((f: any) => [f.id, f.extractionMethod || null])) },
    };
    const warnings = (doc.qualityWarnings || []).map((w: any) => ({ type: w.type, message: w.message, severity: w.severity }));
    await tx.submittedDocument.upsert({ where: { id: doc.id },
      create: { id: doc.id, candidateId, ...data, extractedFields: { create: fields }, qualityWarnings: { create: warnings } },
      update: { ...data, extractedFields: { deleteMany: {}, create: fields }, qualityWarnings: { deleteMany: {}, create: warnings } },
    });
  }
}

export async function saveRfis(tx: Prisma.TransactionClient, item: { id: string; caseReference: string; candidateId: string; candidateName: string }, rfis: any[]) {
  for (const rfi of rfis) {
    const existing = await tx.candidateRFI.findUnique({ where: { id: rfi.id } });
    if (existing && existing.caseId !== item.id) throw new Error('RFI does not belong to this case');
    const data = {
      rfiNumber: rfi.rfiNumber, caseReference: item.caseReference,
      candidateId: item.candidateId, candidateName: item.candidateName,
      statutoryBasis: rfi.statutoryBasis, subject: rfi.subject, discrepancyRef: rfi.discrepancyRef,
      credentialType: rfi.credentialType, instructions: rfi.instructions, curingRequirements: rfi.curingRequirements || [],
      issuedByStaffId: rfi.issuedByStaffId, issuedByName: rfi.issuedByName,
      issuedTimestamp: date(rfi.issuedTimestamp), responseDeadline: date(rfi.responseDeadline), status: rfi.status,
      candidateResponseText: rfi.candidateResponseText,
      candidateResponseTimestamp: rfi.candidateResponseTimestamp ? date(rfi.candidateResponseTimestamp) : null,
      submittedByAgentName: rfi.submittedByAgentName, adjudicationNote: rfi.adjudicationNote,
      adjudicatedBy: rfi.adjudicatedBy, adjudicatedTimestamp: rfi.adjudicatedTimestamp ? date(rfi.adjudicatedTimestamp) : null,
      resolutionOutcome: rfi.resolutionOutcome,
    };
    const attachments = (rfi.attachments || []).map((a: any) => ({
      id: a.id, fileName: a.fileName, fileSizeBytes: a.fileSizeBytes, uploadedAt: date(a.uploadedAt),
      description: a.description, sha256Hash: a.sha256Hash,
    }));
    await tx.candidateRFI.upsert({ where: { id: rfi.id },
      create: { id: rfi.id, caseId: item.id, ...data, attachments: { create: attachments } },
      update: { ...data, attachments: { deleteMany: {}, create: attachments } },
    });
  }
}

export function serializeCandidate(candidate: any) {
  return { ...candidate, documents: (candidate.documents || []).map((doc: any) => ({
    originalStorageStatus: doc.originals?.length ? 'SYNCED' : 'PENDING',
    ...doc, extractionVersion: doc.extractionMetadata?.version || 1, extractionStatus: doc.extractionMetadata?.status || 'NEEDS_REEXTRACTION', extractionError: doc.extractionMetadata?.error || undefined, rawText: doc.extractionMetadata?.rawText || '',
    extractedFields: (doc.extractedFields || []).filter((f: any) => f.fieldKey).map((f: any) => ({
      ...f, extractionConfidence: f.extractionConfidence < 0 ? null : f.extractionConfidence,
      extractionMethod: doc.extractionMetadata?.methods?.[f.id] || (f.id.startsWith('fld_custom') ? 'MANUAL' : f.extractionConfidence < 0 ? 'PDF_TEXT' : 'OCR'),
      evidenceRegion: { page: f.evidencePage, x: f.evidenceRegionX || 0, y: f.evidenceRegionY || 0,
        width: f.evidenceRegionW || 0, height: f.evidenceRegionH || 0, label: f.evidenceRegionLabel || '' },
    })),
  })) };
}
