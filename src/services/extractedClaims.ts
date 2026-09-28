import type { CredentialType, EvidenceRegion, ExtractedField } from '../types';
import { parseBirthDate } from '../../server/src/ageValidation';
export interface TextLine { text: string; confidence: number | null; region: EvidenceRegion; method: 'OCR' | 'PDF_TEXT'; }
const labels = [
  ['FULL_NAME', 'Full Name', /^(?:full(?:\s+legal)?\s+name|name\s+of\s+(?:candidate|holder|child|graduate|corps\s+member)|candidate(?:'s)?\s+name|child(?:'s)?\s+name|name)\b\s*[:\-]?\s*(.*)$/i],
  ['DATE_OF_BIRTH', 'Date of Birth', /^(?:date\s+of\s+birth|birth\s+date|d\.?\s*o\.?\s*b\.?)\s*[:\-]?\s*(.*)$/i],
  ['SURNAME', 'Surname', /^(?:surname|family\s+name)\b\s*[:\-]?\s*(.*)$/i],
  ['GIVEN_NAMES', 'Given Names', /^(?:first\s+names?|given\s+names?|other\s+names?|forenames?)\b\s*[:\-]?\s*(.*)$/i],
  ['QUALIFICATION', 'Qualification', /^(?:qualification|degree(?:\s+awarded)?|award)\b\s*[:\-]?\s*(.*)$/i],
  ['EXAMINATION_NUMBER', 'Examination Number', /^(?:examination|exam|candidate)\s*(?:number|no\.?|#)\s*[:\-]?\s*(.*)$/i],
  ['CERTIFICATE_NUMBER', 'Certificate Number', /^(?:certificate|discharge|exemption)\s*(?:number|no\.?|#)\s*[:\-]?\s*(.*)$/i],
] as const;
const matchesLabel = (text: string) => labels.some(([, , re]) => re.test(text)) || /^(?:father|mother|registrar|signature|sex|gender|place of birth|date of (?:issue|registration)|school|institution)\b/i.test(text);
function nameLike(value: string) { return /^[\p{L}][\p{L}\s.'\u2019,-]{2,100}$/u.test(value) && !matchesLabel(value) && !/\b(?:father|mother|parent|institution|certificate|university|council|registrar|hereby|certify|awarded|bachelor|degree)\b/i.test(value); }
function dateValue(value: string) {
  const parts = value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-]\d{4}$/);
  if (parts && +parts[1] <= 12 && +parts[2] <= 12 && +parts[1] !== +parts[2]) return value;
  return parseBirthDate(value) || value;
}
// Deliberately takes no intake values. All proposed claims retain document evidence.
export function claimsFromLines(documentId: string, lines: TextLine[], type?: CredentialType): ExtractedField[] {
  const visible = lines.filter(l => l.text.trim());
  const fields: ExtractedField[] = visible.map((line, i) => ({ id: `${documentId}_text_${i}`, fieldKey: `DOCUMENT_TEXT_${i+1}`, fieldName: 'Document Text', originalValue: line.text.trim(), normalizedValue: line.text.trim(), isCorrected: false, extractionConfidence: line.confidence, extractionMethod: line.method, status: 'NEEDS_REVIEW', sourceStatus: 'PENDING', evidencePage: line.region.page, evidenceRegion: line.region }));
  const add = (key: string, name: string, value: string, source: TextLine, suffix: string) => fields.push({ id: `${documentId}_claim_${suffix}`, fieldKey: key, fieldName: name, originalValue: value, normalizedValue: key === 'DATE_OF_BIRTH' ? dateValue(value) : value, isCorrected: false, extractionConfidence: source.confidence, extractionMethod: source.method, status: 'NEEDS_REVIEW', sourceStatus: 'PENDING', evidencePage: source.region.page, evidenceRegion: source.region });
  const nextValue = (i: number, narrative = false) => {
    const label = visible[i]; const next = visible[i+1];
    if (!next || next.region.page !== label.region.page || matchesLabel(next.text.trim())) return;
    const below = next.region.y - (label.region.y + label.region.height);
    const aligned = Math.abs(next.region.x - label.region.x) < 15 || (narrative && next.region.x < label.region.x+label.region.width && next.region.x+next.region.width > label.region.x);
    const sameRow = Math.abs(next.region.y-label.region.y) < Math.max(label.region.height,next.region.height) && next.region.x >= label.region.x + label.region.width - 2;
    if (sameRow || (aligned && below >= -2 && below <= Math.max(narrative ? 18 : 6, label.region.height*2))) return next;
  };
  visible.forEach((line,i) => {
    const text = line.text.trim();
    for (const [key, name, re] of labels) {
      const match = text.match(re); if (!match) continue;
      const source = match[1].trim() ? line : nextValue(i);
      const value = match[1].trim() || source?.text.trim();
      if (source && value && !matchesLabel(value) && (!['FULL_NAME','SURNAME','GIVEN_NAMES'].includes(key) || nameLike(value))) add(key,name,value,source,`${i}_${key}`);
      return;
    }
    if (type === 'ACADEMIC_DEGREE' && /^(?:Bachelor|Master|Doctor|Higher National Diploma|National Diploma)\b/i.test(text)) add('QUALIFICATION','Qualification',text,line,`${i}_award`);
    if (['ACADEMIC_DEGREE','NYSC_CERTIFICATE','WAEC_CERTIFICATE'].includes(type || '')) {
      const narrative = text.match(/^(?:this\s+is\s+to\s+certify\s+that|it\s+is\s+hereby\s+certified\s+that)\s*(.*)$/i);
      if (narrative) {
        const source = narrative[1].trim() ? line : nextValue(i, true);
        const value = narrative[1].trim().replace(/\s+(?:has|having|was)\s+.*$/i,'') || source?.text.trim();
        if (source && value && nameLike(value)) add('FULL_NAME','Full Name',value,source,`${i}_narrative`);
      }
    }
  });
  // Combine split names only when a single given-name/surname pair occurs on one page.
  if (!fields.some(f => f.fieldKey === 'FULL_NAME')) {
    const surnames=fields.filter(f=>f.fieldKey==='SURNAME'), given=fields.filter(f=>f.fieldKey==='GIVEN_NAMES');
    if(surnames.length===1 && given.length===1 && surnames[0].evidencePage===given[0].evidencePage) {
      const a=surnames[0], b=given[0];
      fields.push({...a,id:`${documentId}_claim_combined_name`,fieldKey:'FULL_NAME',fieldName:'Full Name',originalValue:`${b.originalValue} ${a.originalValue}`,normalizedValue:`${b.normalizedValue} ${a.normalizedValue}`,extractionConfidence:a.extractionConfidence==null||b.extractionConfidence==null?null:Math.min(a.extractionConfidence,b.extractionConfidence), evidenceRegion:{...a.evidenceRegion,x:Math.min(a.evidenceRegion.x,b.evidenceRegion.x),y:Math.min(a.evidenceRegion.y,b.evidenceRegion.y),width:Math.max(a.evidenceRegion.x+a.evidenceRegion.width,b.evidenceRegion.x+b.evidenceRegion.width)-Math.min(a.evidenceRegion.x,b.evidenceRegion.x),height:Math.max(a.evidenceRegion.y+a.evidenceRegion.height,b.evidenceRegion.y+b.evidenceRegion.height)-Math.min(a.evidenceRegion.y,b.evidenceRegion.y)}});
    }
  }
  return fields;
}
