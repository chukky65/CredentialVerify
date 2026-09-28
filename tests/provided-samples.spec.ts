import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Opt-in: personal documents stay outside the repository and results stay in test-results.
test('inspect supplied credential originals through OCR', async ({ page }, testInfo) => {
  test.skip(!process.env.CREDENTIAL_SAMPLE_DIR, 'Set CREDENTIAL_SAMPLE_DIR to the private sample directory');
  test.setTimeout(240000);
  await page.route('**/api/**', route => route.fulfill({ json: { data: [] } }));
  await page.goto('/dashboard');
  const results = [];
  for (const [fileName, type] of [
    ['degree.jpg', 'ACADEMIC_DEGREE'],
    ['NYSC-Certificate-Of-Service.png', 'NYSC_CERTIFICATE'],
    ['photobirth.jpg', 'BIRTH_CERTIFICATE'],
    ['waec.jpg', 'WAEC_CERTIFICATE'],
  ]) {
    const bytes = await readFile(join(process.env.CREDENTIAL_SAMPLE_DIR!, fileName));
    const doc = await page.evaluate(async ({ base64, fileName, type }) => {
      const path = '/src/services/documentExtraction.ts';
      const { ingestDocument } = await import(path);
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      return ingestDocument(new File([bytes], fileName, { type: fileName.endsWith('.png') ? 'image/png' : 'image/jpeg' }), type);
    }, { base64: bytes.toString('base64'), fileName, type });
    results.push({ fileName, doc });
    expect(doc.extractedFields.every((f: any) => f.status === 'NEEDS_REVIEW' && f.sourceStatus === 'PENDING')).toBe(true);
    if (type === 'ACADEMIC_DEGREE') {
      expect(doc.extractedFields.find((f: any) => f.fieldKey === 'QUALIFICATION')?.normalizedValue).toBe('Bachelor of Science');
    } else {
      expect(doc.qualityWarnings.some((w: any) => ['MISSING_FIELD', 'LOW_CONFIDENCE'].includes(w.type))).toBe(true);
    }
  }
  const resultPath = testInfo.outputPath('private-sample-results.json');
  await writeFile(resultPath, JSON.stringify(results, null, 2));
  await testInfo.attach('private-sample-results', { path: resultPath, contentType: 'application/json' });
});
