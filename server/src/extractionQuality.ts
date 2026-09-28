type CredentialType = string;
interface QualityWarning { type: 'MISSING_FIELD' | 'LOW_CONFIDENCE' | 'AMBIGUOUS_FIELD'; message: string; severity: 'WARNING'; }
interface SubmittedDocument {
  credentialType: string; extractionStatus?: string;
  extractedFields: Array<{ fieldKey: string; fieldName: string; normalizedValue: string; correctedValue?: string; isCorrected: boolean; status: string; extractionMethod?: string; extractionConfidence: number | null }>;
}
import { parseBirthDate } from './ageValidation';

export const MIN_OCR_CONFIDENCE = 80;
const expected: Partial<Record<CredentialType, string[]>> = {
  BIRTH_CERTIFICATE: ['FULL_NAME', 'DATE_OF_BIRTH'],
  ACADEMIC_DEGREE: ['FULL_NAME', 'QUALIFICATION'],
  WAEC_CERTIFICATE: ['FULL_NAME', 'EXAMINATION_NUMBER'],
  NYSC_CERTIFICATE: ['FULL_NAME', 'CERTIFICATE_NUMBER'],
};
export function extractionWarnings(doc: Pick<SubmittedDocument, 'credentialType' | 'extractedFields'>): QualityWarning[] {
  const warnings: QualityWarning[] = [];
  const claims = doc.extractedFields.filter(f => !f.fieldKey.startsWith('DOCUMENT_TEXT_'));
  const add = (type: QualityWarning['type'], message: string) => warnings.push({ type, message, severity: 'WARNING' });
  for (const key of expected[doc.credentialType] || ['FULL_NAME']) {
    if (!claims.some(f => f.fieldKey === key && (f.correctedValue || f.normalizedValue).trim())) add('MISSING_FIELD', `${key.replace(/_/g, ' ')} was not identified. Inspect the original and record the evidence manually; do not copy intake values.`);
  }
  for (const field of claims) {
    const value = field.correctedValue || field.normalizedValue;
    if (!field.isCorrected && field.status !== 'VERIFIED' && field.extractionMethod === 'OCR' && (field.extractionConfidence == null || field.extractionConfidence < MIN_OCR_CONFIDENCE)) add('LOW_CONFIDENCE', `${field.fieldName} has uncertain OCR (${field.extractionConfidence ?? 'unknown'}%). Inspect and confirm or correct the original.`);
    if (field.fieldKey === 'DATE_OF_BIRTH') {
      if (!parseBirthDate(value)) add('AMBIGUOUS_FIELD', 'The extracted date of birth is not a valid calendar date. Review the original.');
      const parts = value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-]\d{4}$/);
      if (!field.isCorrected && field.status !== 'VERIFIED' && parts && +parts[1] <= 12 && +parts[2] <= 12 && parts[1] !== parts[2]) add('AMBIGUOUS_FIELD', `Date of birth "${value}" has ambiguous day/month order. Confirm the date convention before normalizing.`);
    }
  }
  for (const key of new Set(claims.map(f => f.fieldKey))) {
    const values = new Set(claims.filter(f => f.fieldKey === key).map(f => (f.correctedValue || f.normalizedValue).trim().toUpperCase()));
    if (values.size > 1) add('AMBIGUOUS_FIELD', `Multiple different ${key.replace(/_/g, ' ')} values were found. Reconcile them against the original.`);
  }
  return warnings;
}
export function hasBlockingExtraction(doc: SubmittedDocument) {
  return doc.extractionStatus !== 'COMPLETE' || !doc.extractedFields.length || extractionWarnings(doc).length > 0;
}

