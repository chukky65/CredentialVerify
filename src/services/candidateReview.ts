import type { Candidate } from '../types';
import { assessAge, parseBirthDate } from '../../server/src/ageValidation';
import { extractionWarnings } from './extractionQuality';

export function candidateReviewFlags(candidate: Candidate, asOf?: string): string[] {
  const flags = [...assessAge(candidate.dateOfBirth, candidate.officeContested, asOf).flags];
  const normalizeName = (name: string) => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
  for (const doc of candidate.documents || []) {
    flags.push(...extractionWarnings(doc).map(w => `${doc.fileName}: ${w.message}`));
    flags.push(...(doc.qualityWarnings || []).filter(w => !['MISSING_FIELD','LOW_CONFIDENCE','AMBIGUOUS_FIELD'].includes(w.type)).map(w => `${doc.fileName}: ${w.message}`));
    if (doc.extractionStatus === 'NEEDS_REEXTRACTION') flags.push(`${doc.fileName}: legacy example claims were removed; run document extraction.`);
    if (doc.extractionStatus === 'FAILED') flags.push(`${doc.fileName}: ${doc.extractionError || 'Extraction failed; review the original.'}`);
    for (const field of doc.extractedFields || []) {
      const value = field.correctedValue || field.normalizedValue;
      if (field.fieldKey === 'FULL_NAME' && normalizeName(value) !== normalizeName(candidate.fullName)) {
        flags.push(`${doc.fileName}: document name “${value}” differs from intake name “${candidate.fullName}”. Review the original and any documented name variation.`);
      }
      if (field.fieldKey === 'DATE_OF_BIRTH') {
        if (parseBirthDate(value) !== parseBirthDate(candidate.dateOfBirth)) flags.push(`${doc.fileName}: document date of birth “${value}” differs from the intake date ${candidate.dateOfBirth}.`);
        flags.push(...assessAge(value, candidate.officeContested, asOf).flags.map(flag => `${doc.fileName}: ${flag}`));
      }
    }
  }
  return [...new Set(flags)];
}
