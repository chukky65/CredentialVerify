import { test, expect } from '@jest/globals';
import { serializeCandidate, saveDocuments } from './reviewPersistence';

test('failed extraction and scan warnings survive persistence; empty fields are never reconstructed as complete', async () => {
  let stored: any;
  const tx: any = { submittedDocument: { findUnique: async () => null, upsert: async (value: any) => { stored = value.create; } } };
  const doc = { id:'doc',credentialType:'BIRTH_CERTIFICATE',credentialTitle:'Birth Certificate',fileName:'blank.png',fileSizeBytes:123,uploadTimestamp:'2026-09-28T00:00:00Z',mimeType:'image/png',totalPages:1,status:'NEEDS_REVIEW',vectorDocType:'BIRTH_CERT',extractionStatus:'FAILED',extractionVersion:2,extractionError:'No readable text',extractedFields:[],qualityWarnings:[{type:'NO_TEXT',message:'Page 1 is blank',severity:'CRITICAL'}] };
  await saveDocuments(tx,'candidate',[doc]);
  const restored = serializeCandidate({ documents:[{...stored,extractedFields:[],qualityWarnings:stored.qualityWarnings.create}] }).documents[0];
  expect(restored.extractionStatus).toBe('FAILED');
  expect(restored.extractionVersion).toBe(2);
  expect(restored.extractionError).toBe('No readable text');
  expect(restored.qualityWarnings[0].type).toBe('NO_TEXT');
  expect(serializeCandidate({documents:[{extractedFields:[]}]}).documents[0].extractionStatus).toBe('NEEDS_REEXTRACTION');
});
