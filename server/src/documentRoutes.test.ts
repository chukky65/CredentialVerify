import { describe, it, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { documentRoutes } from './documentRoutes';
import { CHUNK_SIZE, decryptChunk } from './documentCrypto';

// Stateful repository double; requests exercise real authentication, encryption and chunk validation.
const accounts = new Map<string, any>(); const originals = new Map<string, any>(); const chunks = new Map<string, any>();
const db: any = {
  staffAccount: { findUnique: async ({ where }: any) => accounts.get(where.id) },
  submittedDocument: { findUnique: async ({ where }: any) => where.id === 'document' ? { id: 'document' } : null },
  documentOriginal: {
    deleteMany: async () => {}, count: async () => 0,
    findFirst: async ({ where }: any) => [...originals.values()].filter(o => o.documentId === where.documentId && o.completedAt).sort((a,b) => b.completedAt - a.completedAt)[0],
    create: async ({ data }: any) => { const o = { ...data, id: 'original-' + originals.size, createdAt: new Date(), completedAt: null }; originals.set(o.id, o); return o; },
    findUnique: async ({ where, include }: any) => { const o = originals.get(where.id); return o && (include ? { ...o, chunks: [...chunks.values()].filter(c => c.originalId === o.id).sort((a,b) => a.index-b.index) } : o); },
    update: async ({ where, data }: any) => Object.assign(originals.get(where.id), data),
  },
  documentOriginalChunk: {
    upsert: async ({ create }: any) => { chunks.set(create.originalId + ':' + create.index, create); },
    findUnique: async ({ where }: any) => chunks.get(where.originalId_index.originalId + ':' + where.originalId_index.index),
  },
  $queryRaw: async () => [],
  $transaction: async (fn: any) => fn(db),
};
const app = express(); app.use(express.json()); app.use('/api/documents', documentRoutes(db));
const token = (id: string) => jwt.sign({ sub: id, role: 'ADMINISTRATOR' }, process.env.JWT_SECRET!);
const digest = (data: Buffer) => createHash('sha256').update(data).digest('hex');
async function session(data: Buffer, sha = digest(data)) {
  return request(app).post('/api/documents/document/original').set('Authorization', 'Bearer ' + token('uploader')).send({ size: data.length, mimeType: 'application/pdf', sha256: sha });
}
beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret-32-characters-long-at-least'; process.env.DOCUMENT_STORAGE_KEY = randomBytes(32).toString('base64'); process.env.DEMO_MODE = 'true';
  accounts.clear(); originals.clear(); chunks.clear();
  for (const [id, role] of [['uploader','INTAKE_OFFICER'], ['reviewer','VERIFICATION_ANALYST'], ['auditor','AUDITOR']]) accounts.set(id, { id, active: true, role });
});
describe('durable original endpoints', () => {
  it('encrypts chunks and retrieves identical bytes for another authorized reviewer', async () => {
    const data = Buffer.concat([Buffer.from('%PDF-1.4\n'), randomBytes(CHUNK_SIZE + 30)]);
    const started = await session(data); expect(started.status).toBe(201); const id = started.body.id;
    for (let offset = 0, index = 0; offset < data.length; offset += CHUNK_SIZE, index++) {
      const saved = await request(app).put(`/api/documents/document/original/${id}/chunks/${index}`).set('Authorization', 'Bearer ' + token('uploader')).set('Content-Type','application/octet-stream').send(data.subarray(offset, offset + CHUNK_SIZE));
      expect(saved.status).toBe(204);
    }
    expect(chunks.get(id + ':0').encrypted.equals(data.subarray(0, CHUNK_SIZE))).toBe(false);
    expect((await request(app).get('/api/documents/document/original').set('Authorization','Bearer ' + token('reviewer'))).status).toBe(404);
    expect((await request(app).post(`/api/documents/document/original/${id}/complete`).set('Authorization','Bearer ' + token('uploader'))).status).toBe(200);
    const manifest = await request(app).get('/api/documents/document/original').set('Authorization','Bearer ' + token('reviewer'));
    expect(manifest.body.sha256).toBe(digest(data)); expect(manifest.headers['cache-control']).toBe('no-store');
    const downloaded: Buffer[] = [];
    for (let i=0;i<manifest.body.chunkCount;i++) { const r=await request(app).get(`/api/documents/document/original/${id}/chunks/${i}`).set('Authorization','Bearer ' + token('reviewer')); expect(r.status).toBe(200); downloaded.push(r.body); }
    expect(Buffer.concat(downloaded).equals(data)).toBe(true);
    expect((await request(app).put(`/api/documents/document/original/${id}/chunks/0`).set('Authorization','Bearer '+token('uploader')).set('Content-Type','application/octet-stream').send(data.subarray(0,CHUNK_SIZE))).status).toBe(409);
  });
  it('rejects anonymous, forged and revoked accounts even with demo mode enabled', async () => {
    expect((await request(app).get('/api/documents/document/original')).status).toBe(401);
    expect((await request(app).get('/api/documents/document/original').set('Authorization','Bearer fake')).status).toBe(401);
    accounts.get('reviewer').active=false;
    expect((await request(app).get('/api/documents/document/original').set('Authorization','Bearer '+token('reviewer'))).status).toBe(403);
    expect((await request(app).post('/api/documents/document/original').set('Authorization','Bearer '+token('auditor')).send({})).status).toBe(403);
  });
  it('rejects incomplete and mismatched uploads and cross-document access', async () => {
    const data=Buffer.from('%PDF-1.4 test'); const started=await session(data,'0'.repeat(64)); const id=started.body.id;
    expect((await request(app).post(`/api/documents/document/original/${id}/complete`).set('Authorization','Bearer '+token('uploader'))).status).toBe(409);
    await request(app).put(`/api/documents/document/original/${id}/chunks/0`).set('Authorization','Bearer '+token('uploader')).set('Content-Type','application/octet-stream').send(data);
    expect((await request(app).post(`/api/documents/document/original/${id}/complete`).set('Authorization','Bearer '+token('uploader'))).status).toBe(422);
    expect((await request(app).post(`/api/documents/other/original/${id}/complete`).set('Authorization','Bearer '+token('uploader'))).status).toBe(404);
    const part=chunks.get(id+':0'); part.encrypted[0]^=1;
    expect(()=>decryptChunk(part,id+':0')).toThrow();
  });
});
