import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { randomUUID, randomBytes, createHash } from 'crypto';
import assert from 'node:assert/strict';
import { hashPassword } from './passwords';
import { CHUNK_SIZE } from './documentCrypto';

// Explicit opt-in: creates synthetic fixtures, then removes only their exact IDs.
async function main() {
  if (process.env.RUN_STORAGE_LIVE_CHECK !== 'true') throw new Error('Set RUN_STORAGE_LIVE_CHECK=true to test the configured development database');
  process.env.NODE_ENV = 'test';
  const { default: app } = await import('./index');
  const db = new PrismaClient();
  const run = randomUUID(); const candidateId = randomUUID(); const documentId = randomUUID();
  const staff = [randomUUID(), randomUUID()]; const password = randomBytes(24).toString('hex');
  const file = Buffer.concat([Buffer.from('%PDF-1.4\n% Synthetic storage transport test\n'), randomBytes(CHUNK_SIZE + 32)]);
  try {
    for (const [i,id] of staff.entries()) await db.staffAccount.create({ data: { id, name:'Storage integration test', email:`storage-test-${run}-${i}@example.invalid`, staffId:`test-${run}-${i}`, role:'VERIFICATION_ANALYST', passwordHash:hashPassword(password) } });
    await db.candidate.create({ data: { id:candidateId, referenceCode:`STORAGE-TEST-${run}`, fullName:'Synthetic storage test', dateOfBirth:'1980-01-01', electionId:'elec_2027_general', electionName:'2027 General Elections', officeContested:'President', jurisdiction:'National (All States)', contactEmail:'test@example.invalid', contactPhone:'', submissionDate:new Date(), status:'PENDING', completenessScore:0, assignedReviewerId:staff[0], assignedReviewerName:'Storage integration test', is_demo:true } });
    await db.submittedDocument.create({ data: { id:documentId, candidateId, credentialType:'BIRTH_CERTIFICATE', credentialTitle:'Synthetic test', fileName:'synthetic.pdf', fileSizeBytes:file.length, uploadTimestamp:new Date(), mimeType:'application/pdf', totalPages:1, status:'PENDING', vectorDocType:'STANDARD_CERTIFICATE' } });
    const tokens: string[]=[];
    for(let i=0;i<2;i++) { const r=await request(app).post('/api/auth/login').send({email:`storage-test-${run}-${i}@example.invalid`,password}); assert.equal(r.status,200); tokens.push(r.body.token); }
    const path=`/api/documents/${documentId}/original`;
    assert.equal((await request(app).get(path)).status,401);
    const digest=createHash('sha256').update(file).digest('hex');
    const started=await request(app).post(path).set('Authorization','Bearer '+tokens[0]).send({size:file.length,mimeType:'application/pdf',sha256:digest});
    assert.equal(started.status,201); const id=started.body.id;
    for(let offset=0,index=0;offset<file.length;offset+=CHUNK_SIZE,index++) assert.equal((await request(app).put(`${path}/${id}/chunks/${index}`).set('Authorization','Bearer '+tokens[0]).set('Content-Type','application/octet-stream').send(file.subarray(offset,offset+CHUNK_SIZE))).status,204);
    assert.equal((await request(app).get(path).set('Authorization','Bearer '+tokens[1])).status,404);
    assert.equal((await request(app).post(`${path}/${id}/complete`).set('Authorization','Bearer '+tokens[0])).status,200);
    const manifest=await request(app).get(path).set('Authorization','Bearer '+tokens[1]); assert.equal(manifest.status,200);
    const parts: Buffer[]=[];
    for(let index=0;index<manifest.body.chunkCount;index++){ const r=await request(app).get(`${path}/${id}/chunks/${index}`).set('Authorization','Bearer '+tokens[1]);assert.equal(r.status,200);parts.push(r.body); }
    assert.ok(Buffer.concat(parts).equals(file));
    const stored=await db.documentOriginalChunk.findFirst({where:{originalId:id},orderBy:{index:'asc'}}); assert.ok(stored); assert.ok(!Buffer.from(stored.encrypted).equals(file.subarray(0,CHUNK_SIZE)));
    const exposed:any[]=await db.$queryRawUnsafe("SELECT table_name FROM information_schema.role_table_grants WHERE grantee IN ('anon','authenticated','PUBLIC') AND table_name IN ('StaffAccount','DocumentOriginal','DocumentOriginalChunk')"); assert.equal(exposed.length,0);
    console.log('PASS: real database encrypted upload, complete-only visibility, second-account byte-identical download, authentication, and private-table grants.');
  } finally {
    await db.documentOriginal.deleteMany({where:{documentId}});
    await db.submittedDocument.deleteMany({where:{id:documentId,candidateId}});
    await db.candidate.deleteMany({where:{id:candidateId,referenceCode:`STORAGE-TEST-${run}`}});
    await db.staffAccount.deleteMany({where:{id:{in:staff},email:{startsWith:`storage-test-${run}-`}}});
    await db.$disconnect();
    console.log('Synthetic integration fixtures cleaned up.');
  }
}
main().then(()=>process.exit(0)).catch(error=>{ console.error('Storage live check failed:',error instanceof assert.AssertionError ? error.message : 'Database/API error (credentials omitted)'); process.exit(1); });
