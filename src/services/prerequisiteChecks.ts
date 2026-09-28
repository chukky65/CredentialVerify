import type { Candidate, CredentialType } from '../types';
import { hasBlockingExtraction } from './extractionQuality';

const requirements: Array<{ type: CredentialType; label: string }> = [
  { type: 'CITIZENSHIP', label: 'Citizenship evidence' },
  { type: 'BIRTH_CERTIFICATE', label: 'Birth / age evidence' },
  { type: 'ACADEMIC_DEGREE', label: 'Academic qualifications' },
  { type: 'NYSC_CERTIFICATE', label: 'NYSC certificate' },
  { type: 'FINANCIAL_DISCLOSURE', label: 'Assets declaration' },
  { type: 'PARTY_NOMINATION', label: 'Party nomination' },
];
export function prerequisiteChecks(candidate: Candidate) {
  const types = [...requirements];
  for (const doc of candidate.documents) if (!types.some(r => r.type === doc.credentialType)) {
    types.push({ type: doc.credentialType, label: doc.credentialTitle });
  }
  return types.map(requirement => {
    const docs = candidate.documents.filter(d => d.credentialType === requirement.type);
    const label = !docs.length ? 'Not submitted' :
      docs.some(hasBlockingExtraction) ? 'Extraction / manual review needed' :
      docs.every(d => d.extractedFields.every(f => f.status === 'VERIFIED')) ? 'Document reviewed' : 'Claims need review';
    return { ...requirement, label: requirement.label, status: label, documents: docs };
  });
}
