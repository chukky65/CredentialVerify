import { test, expect } from '@playwright/test';

test('synthetic credential layout and image-quality matrix through actual OCR', async ({ page }) => {
  test.setTimeout(240000);
  await page.route('**/api/**', route => route.fulfill({json:{data:[]}}));
  await page.goto('/dashboard');
  const results = await page.evaluate(async () => {
    const path='/src/services/documentExtraction.ts'; const {ingestDocument}=await import(path);
    const fixtures = [
      {name:'birth-split',type:'BIRTH_CERTIFICATE',lines:['BIRTH CERTIFICATE','Surname: OKAFOR','Given Names: ADA','Date of Birth: 30 October 1980'],width:1600,color:'#111'},
      {name:'degree-narrative',type:'ACADEMIC_DEGREE',lines:['SYNTHETIC UNIVERSITY TEST','This is to certify that','ADA OKAFOR','Bachelor of Science in Economics'],width:1600,color:'#111'},
      {name:'waec-labelled',type:'WAEC_CERTIFICATE',lines:['SYNTHETIC WAEC TEST','Candidate Name: ADA OKAFOR','Examination Number: 1234567890'],width:1600,color:'#111'},
      {name:'nysc-narrative',type:'NYSC_CERTIFICATE',lines:['SYNTHETIC NYSC TEST','This is to certify that ADA OKAFOR has served','Certificate No: A123456789'],width:1600,color:'#111'},
      {name:'birth-missing',type:'BIRTH_CERTIFICATE',lines:['BIRTH CERTIFICATE','Full Name:','Date of Birth: 30 October 1980'],width:1600,color:'#111'},
      {name:'low-resolution',type:'BIRTH_CERTIFICATE',lines:['BIRTH CERTIFICATE','Full Name: ADA OKAFOR','Date of Birth: 30 October 1980'],width:500,color:'#111'},
      {name:'too-faint',type:'BIRTH_CERTIFICATE',lines:['Full Name: ADA OKAFOR','Date of Birth: 30 October 1980'],width:1600,color:'#fdfdfd'},
      {name:'blank',type:'BIRTH_CERTIFICATE',lines:[],width:1600,color:'#111'},
    ];
    const output=[];
    for(const fixture of fixtures){
      const canvas=document.createElement('canvas');canvas.width=fixture.width;canvas.height=Math.round(fixture.width*.65);
      const ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle=fixture.color;ctx.font=`${fixture.width/40}px Arial`;
      fixture.lines.forEach((line,i)=>ctx.fillText(line,fixture.width*.05,fixture.width*(.10+i*.075)));
      const blob=await new Promise<Blob>(resolve=>canvas.toBlob(b=>resolve(b!),'image/png'));
      const doc=await ingestDocument(new File([blob],fixture.name+'.png',{type:'image/png'}),fixture.type);
      output.push({name:fixture.name,doc});
    }
    return output;
  });
  for(const {name,doc} of results){
    if(['blank','too-faint'].includes(name)){expect(doc.extractionStatus,name).toBe('FAILED');expect(doc.extractedFields,name).toHaveLength(0);continue;}
    expect(doc.extractedFields.every((f:any)=>f.status==='NEEDS_REVIEW'&&f.sourceStatus==='PENDING'),name).toBe(true);
    if(name==='birth-missing'){expect(doc.qualityWarnings.some((w:any)=>w.type==='MISSING_FIELD')).toBe(true);continue;}
    if(name==='low-resolution'){expect(doc.qualityWarnings.some((w:any)=>w.type==='LOW_RESOLUTION')).toBe(true);continue;}
    expect(doc.extractionStatus,doc.extractionError).toBe('COMPLETE');
    expect(doc.extractedFields.find((f:any)=>f.fieldKey==='FULL_NAME')?.normalizedValue, name+' '+doc.rawText).toBe('ADA OKAFOR');
    expect(doc.qualityWarnings.filter((w:any)=>w.type==='MISSING_FIELD'),name+' '+doc.rawText).toHaveLength(0);
  }
});

test('image-only PDF uses OCR and corrupt uploads remain failed', async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({json:{data:[]}}));
  await page.goto('/dashboard');
  const result=await page.evaluate(async()=>{
    const path='/src/services/documentExtraction.ts';const {ingestDocument}=await import(path);
    const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,1600,1000);ctx.fillStyle='black';ctx.font='44px Arial';
    ctx.fillText('BIRTH CERTIFICATE - SYNTHETIC TEST',80,140);ctx.fillText('Full Name: ADA OKAFOR',80,260);ctx.fillText('Date of Birth: 30 October 1980',80,380);
    const jpeg=atob(canvas.toDataURL('image/jpeg',0.95).split(',')[1]);
    const stream='q 612 0 0 792 0 0 cm /Im0 Do Q';
    const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,`<< /Type /XObject /Subtype /Image /Width 1600 /Height 1000 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n${jpeg}\nendstream`];
    let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=pdf.length;
    pdf+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes=Uint8Array.from(pdf,c=>c.charCodeAt(0));
    const scanned=await ingestDocument(new File([bytes],'scanned.pdf',{type:'application/pdf'}),'BIRTH_CERTIFICATE');
    const corrupt=await ingestDocument(new File(['%PDF-1.4 corrupt'],'corrupt.pdf',{type:'application/pdf'}),'BIRTH_CERTIFICATE');
    return {scanned,corrupt};
  });
  expect(result.scanned.extractionStatus,result.scanned.extractionError).toBe('COMPLETE');
  expect(result.scanned.extractedFields.find((f:any)=>f.fieldKey==='DATE_OF_BIRTH')?.normalizedValue,result.scanned.rawText).toBe('1980-10-30');
  expect(result.scanned.extractedFields.every((f:any)=>f.extractionMethod==='OCR')).toBe(true);
  expect(result.corrupt.extractionStatus).toBe('FAILED');expect(result.corrupt.extractedFields).toHaveLength(0);
});
