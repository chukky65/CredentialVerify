import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claimsFromLines, type TextLine } from './extractedClaims';
import { extractionWarnings, hasBlockingExtraction } from './extractionQuality';
const lines = (texts: string[], confidence: number | null = 94): TextLine[] => texts.map((text,i)=>({text,confidence,method:confidence==null?'PDF_TEXT':'OCR',region:{x:10,y:5+i*7,width:70,height:4,page:1,label:'test evidence'}}));
const doc = (type: any, text: string[], confidence: number | null = 94) => ({credentialType:type,extractionStatus:'COMPLETE',extractedFields:claimsFromLines('fixture',lines(text,confidence),type)});
test('birth layouts support split labels and split names, without capturing parents or other labels',()=>{
  const birth=doc('BIRTH_CERTIFICATE',['Surname: OKAFOR','Given Names: ADA','Date of Birth','30 October 1980']);
  assert.equal(birth.extractedFields.find(f=>f.fieldKey==='FULL_NAME')?.normalizedValue,'ADA OKAFOR');
  assert.equal(extractionWarnings(birth).length,0);
  const missing=doc('BIRTH_CERTIFICATE',['Full Name:','Date of Birth: 30/10/1980','Mother Name: MARY OKAFOR']);
  assert.ok(extractionWarnings(missing).some(w=>w.type==='MISSING_FIELD'));
  assert.equal(missing.extractedFields.some(f=>f.fieldKey==='FULL_NAME'),false);
});
test('degree, WAEC and NYSC parse credential-specific labels and narrative names',()=>{
  for(const [type,text,key] of [
    ['ACADEMIC_DEGREE',['This is to certify that','ADA OKAFOR','Bachelor of Science in Economics'],'QUALIFICATION'],
    ['WAEC_CERTIFICATE',['Candidate Name: ADA OKAFOR','Examination Number: 1234567890'],'EXAMINATION_NUMBER'],
    ['NYSC_CERTIFICATE',['This is to certify that ADA OKAFOR has served','Certificate No: A123456789'],'CERTIFICATE_NUMBER'],
  ] as const){const result=doc(type,[...text]);assert.equal(extractionWarnings(result).length,0,type);assert.ok(result.extractedFields.some(f=>f.fieldKey===key));assert.ok(result.extractedFields.every(f=>f.status==='NEEDS_REVIEW'&&f.sourceStatus==='PENDING'));}
});
test('low-confidence, invalid, ambiguous and conflicting values require review',()=>{
  assert.ok(hasBlockingExtraction(doc('BIRTH_CERTIFICATE',['Full Name: ADA OKAFOR','Date of Birth: 30/10/1980'],44)));
  for(const value of ['03/04/1980','31/02/1980']) assert.ok(extractionWarnings(doc('BIRTH_CERTIFICATE',['Full Name: ADA OKAFOR','Date of Birth: '+value])).some(w=>w.type==='AMBIGUOUS_FIELD'));
  assert.ok(extractionWarnings(doc('BIRTH_CERTIFICATE',['Full Name: ADA OKAFOR','Full Name: BOLA ADE','Date of Birth: 30/10/1980'])).some(w=>w.type==='AMBIGUOUS_FIELD'));
  assert.ok(hasBlockingExtraction(doc('BIRTH_CERTIFICATE',[])));
  assert.ok(hasBlockingExtraction({...doc('BIRTH_CERTIFICATE',['Full Name: ADA OKAFOR','Date of Birth: 30/10/1980']),extractionStatus:'FAILED'}));
});
test('missing values do not jump across pages or distant regions; PDF text is not given an OCR score',()=>{
  const source=lines(['Full Name:','ADA OKAFOR']);source[1].region.page=2;
  assert.equal(claimsFromLines('x',source).some(f=>f.fieldKey==='FULL_NAME'),false);
  source[1].region.page=1;source[1].region.y=90;
  assert.equal(claimsFromLines('x',source).some(f=>f.fieldKey==='FULL_NAME'),false);
  assert.ok(doc('WAEC_CERTIFICATE',['Candidate Name: ADA OKAFOR','Examination Number: 1234567890'],null).extractedFields.every(f=>f.extractionConfidence===null));
});
