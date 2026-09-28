import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // All records are synthetic, and no test talks to a real API or database.
  await page.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }));
  await page.route('**/api/candidates', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 503, body: 'Offline test' })
    : route.fulfill({ contentType: 'application/json', body: '{"data":[]}' }));
});

async function png(page: Page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 800;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black'; ctx.font = '42px Arial';
    ctx.fillText('BIRTH CERTIFICATE', 100, 150);
    ctx.fillText('Full Name: ADA OKAFOR', 100, 300);
    ctx.fillText('Date of Birth: 30/10/1980', 100, 420);
    return canvas.toDataURL('image/png');
  });
}

function textPdf() {
  const streams = ['BT /F1 18 Tf 50 720 Td (Full Name: ADA OKAFOR) Tj 0 -40 Td (Date of Birth: 30/10/1980) Tj ET', 'BT /F1 18 Tf 50 720 Td (SECOND PAGE ORIGINAL) Tj ET'];
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${streams[0].length} >>\nstream\n${streams[0]}\nendstream`,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
    `<< /Length ${streams[1].length} >>\nstream\n${streams[1]}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let content = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((obj, i) => { offsets.push(Buffer.byteLength(content)); content += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(content);
  content += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { content += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  return Buffer.from(content + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
}

test('real image OCR reads Ada, never the different intake name; preview survives reload', async ({ page }) => {
  await page.goto('/dashboard');
  const image = await png(page);
  const result = await page.evaluate(async (imageData) => {
    const extractionPath = '/src/services/documentExtraction.ts';
    const servicePath = '/src/services/verificationService.ts';
    const { ingestDocument } = await import(extractionPath);
    const { verificationService } = await import(servicePath);
    const blob = await (await fetch(imageData)).blob();
    const doc = await ingestDocument(new File([blob], 'ada-original.png', { type: 'image/png' }), 'BIRTH_CERTIFICATE');
    const candidate = await verificationService.createCandidate({
      referenceCode: 'TEST-2027-101', fullName: 'Goodhope Steve Peter', dateOfBirth: '1970-10-30',
      electionId: 'elec_2027_general', electionName: '2027 General Elections', officeContested: 'President',
      jurisdiction: 'National (All States)', uploadedDocuments: [doc], submissionDate: new Date().toISOString(),
      assignedReviewerName: 'Test Reviewer', assignedReviewerId: 'test',
    });
    const cases = await verificationService.getCases();
    return { doc, candidateId: candidate.id, caseId: cases.find((c: any) => c.candidateId === candidate.id).id };
  }, image);
  expect(result.doc.extractionStatus, result.doc.extractionError).toBe('COMPLETE');
  expect(result.doc.extractedFields.find((f: any) => f.fieldKey === 'FULL_NAME')?.normalizedValue, result.doc.rawText).toBe('ADA OKAFOR');
  expect(result.doc.extractedFields.find((f: any) => f.fieldKey === 'DATE_OF_BIRTH')?.normalizedValue).toBe('1980-10-30');
  expect(result.doc.extractedFields.every((f: any) => f.sourceStatus === 'PENDING')).toBe(true);
  await page.goto(`/cases/${result.caseId}/documents/${result.doc.id}`);
  const preview = page.getByRole('img', { name: /Original document: ada-original/ });
  await expect(preview).toBeVisible();
  expect(await preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText(/differs from intake name/)).toBeVisible();
  await expect(page.getByText(/differs from the intake date/)).toBeVisible();
  await page.reload();
  await expect(preview).toBeVisible();
  await page.goto('/discrepancies');
  await expect(page.getByText('Goodhope Steve Peter', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Contested Office: President/)).toBeVisible();
  await expect(page.getByText('Dr. Arthur Sterling-Morales')).toHaveCount(0);
  await expect(page.getByText('Date of Birth: 1980-10-30 (page 1)')).toBeVisible();
  await page.getByRole('button', { name: 'Open in Document Workbench' }).click();
  await expect(page).toHaveURL(new RegExp(`/cases/${result.caseId}/documents/${result.doc.id}$`));
  await expect(preview).toBeVisible();
});

test('discrepancy review has no fictional records when no candidates are flagged', async ({ page }) => {
  await page.goto('/discrepancies');
  await expect(page.getByText(/No flagged items in this scope/)).toBeVisible();
  await expect(page.getByText('0 Active Review Flags')).toBeVisible();
});

test('PDF upload uses the original pages and reads actual PDF text without fabricated confidence', async ({ page }) => {
  await page.goto('/candidates/new');
  await page.getByRole('button', { name: /Document Intake/ }).click();
  await page.getByTitle('Upload Birth Certificate', { exact: true }).setInputFiles({ name: 'ada-two-pages.pdf', mimeType: 'application/pdf', buffer: textPdf() });
  await expect(page.getByText('ada-two-pages.pdf')).toBeVisible({ timeout: 30000 });
  // Inspect extraction via the same implementation with this known PDF and render both pages.
  const result = await page.evaluate(async (base64) => {
    const extractionPath = '/src/services/documentExtraction.ts';
    const rendererPath = '/src/services/pdfEngine.ts';
    const { ingestDocument } = await import(extractionPath);
    const { openPdf, renderPdfPage } = await import(rendererPath);
    const blob = await (await fetch('data:application/pdf;base64,' + base64)).blob();
    const doc = await ingestDocument(new File([blob], 'two.pdf', { type: 'application/pdf' }), 'BIRTH_CERTIFICATE');
    const pdf = await openPdf(blob);
    const first = (await renderPdfPage(pdf, 1)).canvas.toDataURL();
    const second = (await renderPdfPage(pdf, 2)).canvas.toDataURL();
    await pdf.loadingTask.destroy();
    return { doc, differentPages: first !== second };
  }, textPdf().toString('base64'));
  expect(result.doc.extractionStatus, result.doc.extractionError).toBe('COMPLETE');
  await expect(page.getByText('Extracted; needs review')).toBeVisible();
  expect(result.doc.totalPages).toBe(2);
  expect(result.doc.rawText).toContain('SECOND PAGE ORIGINAL');
  expect(result.doc.extractedFields.every((f: any) => f.extractionConfidence === null)).toBe(true);
  expect(result.differentPages).toBe(true);
});

test('RFI and verified counts persist while offline; SLA card opens matching cases', async ({ page }) => {
  await page.goto('/dashboard');
  const fixture = await page.evaluate(async () => {
    const servicePath = '/src/services/verificationService.ts';
    const { verificationService } = await import(servicePath);
    const c = await verificationService.createCandidate({ referenceCode: 'TEST-2027-102', fullName: 'Test Candidate', dateOfBirth: '1980-01-01', electionId: 'elec_2027_general', electionName: '2027 General Elections', officeContested: 'President', jurisdiction: 'National (All States)', uploadedDocuments: [{ id: 'reviewed-doc', credentialType: 'CITIZENSHIP', credentialTitle: 'Citizenship', fileName: 'reviewed.png', totalPages: 1, extractionStatus: 'COMPLETE', extractionVersion: 2, qualityWarnings: [], extractedFields: [{ id: 'reviewed-name', fieldKey: 'FULL_NAME', fieldName: 'Full Name', originalValue: 'Test Candidate', normalizedValue: 'Test Candidate', isCorrected: false, extractionConfidence: null, extractionMethod: 'MANUAL', status: 'VERIFIED', sourceStatus: 'PENDING', evidencePage: 1, evidenceRegion: { x: 0, y: 0, width: 50, height: 5, page: 1, label: 'Reviewed evidence' } }] }], submissionDate: new Date().toISOString(), assignedReviewerName: 'Test Reviewer' });
    const item = (await verificationService.getCases()).find((i: any) => i.candidateId === c.id);
    await verificationService.createRFI({ caseId: item.id, caseReference: item.caseReference, candidateId: c.id, candidateName: c.fullName, subject: 'Birth record', statutoryBasis: 'Test basis', instructions: 'Provide birth record', curingRequirements: [], credentialType: 'BIRTH_CERTIFICATE', issuedByStaffId: 'test', issuedByName: 'Test', responseDeadline: new Date(Date.now() + 86400_000).toISOString() });
    return { id: item.id };
  });
  await page.reload();
  await expect(page.locator('#metric-info-req')).toContainText('1');
  await page.locator('#metric-info-req').click();
  await expect(page).toHaveURL(/status=INFO_REQUIRED/);
  await expect(page.getByText('Test Candidate').first()).toBeVisible();
  await page.evaluate(async ({ id }) => {
    const servicePath = '/src/services/verificationService.ts';
    const { verificationService } = await import(servicePath);
    await verificationService.recordRecommendation(id, { recommendationType: 'REQUIREMENTS_SATISFIED', rationale: 'Human reviewer test', submittedBy: 'Test', submittedTimestamp: new Date().toISOString(), reasonCodes: [], confirmedClaimsCount: 0, contradictedClaimsCount: 0, openRisks: [], isFinalAdverseDecision: false });
    const cases = JSON.parse(localStorage.getItem('credential_verify_cases')!);
    cases.push({ ...cases[0], id: 'case_due', candidateId: 'due-candidate', candidateName: 'Due Candidate', caseReference: 'CASE-DUE', workflowStatus: 'NEEDS_REVIEW', stage: 'ANALYSIS', recommendation: undefined, slaDeadline: new Date(Date.now() + 3600_000).toISOString() });
    cases[0].slaDeadline = new Date(Date.now() - 3600_000).toISOString();
    localStorage.setItem('credential_verify_cases', JSON.stringify(cases));
  }, fixture);
  await page.goto('/dashboard');
  await expect(page.locator('#metric-info-req')).toContainText('0');
  await expect(page.locator('#metric-completed')).toContainText('1');
  await expect(page.locator('#metric-sla')).toContainText('1');
  await page.locator('#metric-sla').click();
  await expect(page).toHaveURL(/status=SLA/);
  await expect(page.getByText('Due Candidate').first()).toBeVisible();
  await expect(page.getByText('Test Candidate', { exact: true })).toHaveCount(0);
});

test('blank image produces no claims and never passes extraction', async ({ page }) => {
  await page.goto('/dashboard');
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 1000;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 800, 1000);
    const blob = await (await fetch(canvas.toDataURL())).blob();
    const path = '/src/services/documentExtraction.ts';
    const { ingestDocument } = await import(path);
    return ingestDocument(new File([blob], 'blank.png', { type: 'image/png' }), 'ACADEMIC_DEGREE');
  });
  expect(result.extractionStatus).toBe('FAILED');
  expect(result.extractedFields).toHaveLength(0);
  expect(result.extractionError).toBeTruthy();
});

test('Gazette dossier selects the requested candidate and downloads their evidence', async ({ page }) => {
  await page.goto('/dashboard');
  await page.evaluate(async () => {
    const path = '/src/services/verificationService.ts';
    const { verificationService } = await import(path);
    for (const name of ['First Candidate', 'Second Candidate']) {
      await verificationService.createCandidate({ referenceCode: name, fullName: name, dateOfBirth: '1980-01-01', electionId: 'elec_2027_general', electionName: '2027 General Elections', officeContested: 'President', jurisdiction: 'National (All States)', uploadedDocuments: [], submissionDate: new Date().toISOString() });
    }
  });
  await page.goto('/gazette');
  await page.getByRole('button', { name: 'Dossier for Second Candidate' }).click();
  await expect(page.getByText(/Compile recorded evidence for Second Candidate/)).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Printable Binder' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('Statutory_Case_Binder');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const html = Buffer.concat(chunks).toString();
  expect(html).toContain('Second Candidate');
  expect(html).not.toContain('First Candidate');
  expect(html).toContain('Not submitted');
  expect(html).not.toContain('Active Good Standing');
});


test('report downloads CSV without printing and hides notifications in print media', async ({ page }) => {
  await page.goto('/reports');
  await expect(page.locator('#rep-metric-turnaround')).toContainText('Not available');
  await expect(page.getByText('National Population Commission (NPC)')).toBeVisible();
  await page.evaluate(() => { (window as any).printCalls = 0; window.print = () => { (window as any).printCalls++; }; });
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  const stream = await download.createReadStream(); const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toContain('Independent National Electoral Commission (INEC)');
  expect(await page.evaluate(() => (window as any).printCalls)).toBe(0);
  await page.getByRole('button', { name: 'Print Report', exact: true }).click();
  expect(await page.evaluate(() => (window as any).printCalls)).toBe(1);
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('heading', { name: 'Independent National Electoral Commission (INEC)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print Report', exact: true })).toBeHidden();
  expect(await page.evaluate(() => { const toast = document.createElement('div'); toast.className = 'toast-container no-print'; document.body.appendChild(toast); const hidden = getComputedStyle(toast).display === 'none'; toast.remove(); return hidden; })).toBe(true);
});

test('audit and personnel navigation routes render on direct access and reload', async ({ page }) => {
  for (const path of ['/audit-trail', '/audit', '/user-management', '/users']) {
    await page.goto(path);
    await expect(page.getByText('Page not found', { exact: true })).toHaveCount(0);
    await expect(page.locator('main h2').first()).toBeVisible();
    await page.reload();
    await expect(page.locator('main h2').first()).toBeVisible();
  }
  await page.goto('/gazette');
  await expect(page.getByLabel('Blank sign-off fields')).toContainText('Name: ______________________________');
  await expect(page.getByText(/Beatrice Sterling|Julian Vance/)).toHaveCount(0);
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByLabel('Blank sign-off fields')).toBeVisible();
});

test('server original survives browser cache deletion and opens for a second reviewer', async ({ page, browser }) => {
  await page.goto('/dashboard');
  const original = await png(page);
  const bytes = Buffer.from(original.split(',')[1], 'base64');
  const { createHash } = await import('node:crypto');
  const checksum = createHash('sha256').update(bytes).digest('hex');
  let saved: Buffer | undefined;
  const serve = async (route: any) => {
    if (!route.request().headers()['authorization']?.startsWith('Bearer reviewer-')) return route.fulfill({ status: 401, json: { error: 'Sign in' } });
    const method = route.request().method(); const url = route.request().url();
    if (method === 'PUT') { saved = route.request().postDataBuffer(); return route.fulfill({ status: 204 }); }
    if (method === 'POST' && url.endsWith('/complete')) return route.fulfill({ json: { sha256: checksum } });
    if (method === 'POST') return route.fulfill({ json: { id: 'version', chunkSize: 1048576, complete: false } });
    if (url.endsWith('/chunks/0')) return route.fulfill({ contentType: 'application/octet-stream', body: saved! });
    return route.fulfill({ json: { id: 'version', chunkCount: 1, size: bytes.length, mimeType: 'image/png', sha256: checksum } });
  };
  await page.route('**/api/documents/**', serve);
  await page.evaluate(async image => {
    localStorage.setItem('token','reviewer-one');
    const path='/src/services/documentStore.ts'; const {storeOriginal,syncOriginal}=await import(path);
    const blob=await (await fetch(image)).blob(); await storeOriginal('stored-document',blob);
    const doc: any={id:'stored-document',originalStorageStatus:'LOCAL_ONLY'}; await syncOriginal(doc);
    if(doc.originalStorageStatus!=='SYNCED') throw new Error('Original did not sync');
    await new Promise<void>((resolve,reject)=>{const req=indexedDB.deleteDatabase('credential_verify_documents');req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);});
  }, original);
  const second = await browser.newContext(); const reviewer = await second.newPage();
  await reviewer.route('**/api/**', route => route.fulfill({ json: { data: [] } }));
  await reviewer.route('**/api/documents/**', serve);
  await reviewer.goto('/dashboard');
  const retrieved = await reviewer.evaluate(async () => {
    localStorage.setItem('token','reviewer-two');
    const path='/src/services/documentStore.ts'; const {readOriginal}=await import(path);
    const blob=await readOriginal({id:'stored-document',originalStorageStatus:'SYNCED'});
    const img=document.createElement('img'); img.src=URL.createObjectURL(blob); await img.decode();
    return {size:blob.size,width:img.naturalWidth};
  });
  expect(retrieved).toEqual({size:bytes.length,width:1600});
  await second.close();
});

