import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { CHUNK_SIZE, MAX_SIZE, storageKey, encryptChunk, decryptChunk, detectedMime } from './documentCrypto';

const readers = ['INTAKE_OFFICER', 'VERIFICATION_ANALYST', 'SENIOR_ADJUDICATOR', 'AUDITOR', 'ADMINISTRATOR'];
const writers = readers.filter(role => role !== 'AUDITOR');
export function documentRoutes(prisma: PrismaClient) {
  const router = express.Router();
  router.use(async (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store'); res.set('X-Content-Type-Options', 'nosniff');
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.length < 32) return res.status(503).json({ error: 'Secure staff authentication is not configured' });
      const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!token) return res.status(401).json({ error: 'Sign in to access original documents' });
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || !payload.sub) return res.status(401).json({ error: 'A verified staff account is required' });
      const account = await prisma.staffAccount.findUnique({ where: { id: payload.sub } });
      if (!account?.active || !readers.includes(account.role)) return res.status(403).json({ error: 'Document access denied' });
      if (req.method !== 'GET' && !writers.includes(account.role)) return res.status(403).json({ error: 'Document upload access denied' });
      res.locals.staffId = account.id; storageKey(); next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) return res.status(401).json({ error: 'Sign in again to access documents' });
      res.status(503).json({ error: 'Secure document storage is unavailable' });
    }
  });
  const wrap = (fn: (req: Request, res: Response) => Promise<any>) => async (req: Request, res: Response) => {
    try { await fn(req, res); } catch { res.status(503).json({ error: 'Document storage operation failed. Please retry.' }); }
  };
  router.post('/:documentId/original', wrap(async (req, res) => {
    const { size, mimeType, sha256 } = req.body;
    if (!Number.isInteger(size) || size <= 0 || size > MAX_SIZE || !['application/pdf','image/jpeg','image/png'].includes(mimeType) || !/^[a-f0-9]{64}$/.test(sha256 || '')) return res.status(400).json({ error: 'Invalid document type, size or checksum' });
    const doc = await prisma.submittedDocument.findUnique({ where: { id: String(req.params.documentId) } });
    if (!doc) return res.status(404).json({ error: 'Save the candidate and document record before uploading the original' });
    // Expired incomplete sessions are safe to remove; completed originals are retained.
    await prisma.documentOriginal.deleteMany({ where: { completedAt: null, createdAt: { lt: new Date(Date.now() - 86400000) } } });
    const existing = await prisma.documentOriginal.findFirst({ where: { documentId: doc.id, completedAt: { not: null } }, orderBy: { completedAt: 'desc' } });
    if (existing && existing.sha256 === sha256) return res.json({ id: existing.id, complete: true, chunkSize: CHUNK_SIZE });
    const pending = await prisma.documentOriginal.count({ where: { uploadedBy: res.locals.staffId, completedAt: null } });
    if (pending >= 30) return res.status(429).json({ error: 'Too many incomplete uploads. Retry after unfinished uploads expire.' });
    const original = await prisma.documentOriginal.create({ data: { documentId: doc.id, uploadedBy: res.locals.staffId, mimeType, size, sha256, chunkCount: Math.ceil(size / CHUNK_SIZE) } });
    res.status(201).json({ id: original.id, complete: false, chunkSize: CHUNK_SIZE });
  }));
  router.put('/:documentId/original/:originalId/chunks/:index', express.raw({ type: 'application/octet-stream', limit: CHUNK_SIZE }), wrap(async (req, res) => {
    const outcome = await prisma.$transaction(async tx => {
      await tx.$queryRaw(Prisma.sql`SELECT id FROM "DocumentOriginal" WHERE id = ${String(req.params.originalId)} FOR UPDATE`);
      const original = await tx.documentOriginal.findUnique({ where: { id: String(req.params.originalId) } });
      const index = Number(req.params.index);
      if (!original || original.documentId !== req.params.documentId || original.uploadedBy !== res.locals.staffId) return { status: 404, error: 'Upload session not found' };
      if (original.completedAt || Date.now() - original.createdAt.getTime() > 86400000) return { status: 409, error: 'Upload session is closed or expired' };
      const expected = Math.min(CHUNK_SIZE, original.size - index * CHUNK_SIZE);
      if (!Number.isInteger(index) || index < 0 || index >= original.chunkCount || !Buffer.isBuffer(req.body) || req.body.length !== expected) return { status: 400, error: 'Invalid document chunk' };
      const data = encryptChunk(req.body, `${original.id}:${index}`);
      await tx.documentOriginalChunk.upsert({ where: { originalId_index: { originalId: original.id, index } }, create: { originalId: original.id, index, ...data }, update: data });
      return { status: 204 };
    });
    if (outcome.error) return res.status(outcome.status).json({ error: outcome.error });
    res.status(204).end();
  }));
  router.post('/:documentId/original/:originalId/complete', wrap(async (req, res) => {
    const outcome = await prisma.$transaction(async tx => {
      await tx.$queryRaw(Prisma.sql`SELECT id FROM "DocumentOriginal" WHERE id = ${String(req.params.originalId)} FOR UPDATE`);
      const original = await tx.documentOriginal.findUnique({ where: { id: String(req.params.originalId) }, include: { chunks: { orderBy: { index: 'asc' } } } });
      if (!original || original.documentId !== req.params.documentId || original.uploadedBy !== res.locals.staffId) return { status: 404, error: 'Upload session not found' };
      if (original.completedAt) return { status: 200, sha256: original.sha256 };
      if (Date.now() - original.createdAt.getTime() > 86400000 || original.chunks.length !== original.chunkCount) return { status: 409, error: 'Upload is incomplete or expired' };
      const bytes = Buffer.concat(original.chunks.map(c => decryptChunk(c, `${original.id}:${c.index}`)));
      if (bytes.length !== original.size || createHash('sha256').update(bytes).digest('hex') !== original.sha256 || detectedMime(bytes) !== original.mimeType) return { status: 422, error: 'Document content does not match its type, size or checksum' };
      await tx.documentOriginal.update({ where: { id: original.id }, data: { completedAt: new Date() } });
      return { status: 200, sha256: original.sha256 };
    }, { timeout: 15000 });
    res.status(outcome.status).json(outcome.error ? { error: outcome.error } : { sha256: outcome.sha256 });
  }));  router.get('/:documentId/original', wrap(async (req, res) => {
    const original = await prisma.documentOriginal.findFirst({ where: { documentId: String(req.params.documentId), completedAt: { not: null } }, orderBy: { completedAt: 'desc' } });
    if (!original) return res.status(404).json({ error: 'No original is saved on the server. Reattach it from the original device.' });
    res.json({ id: original.id, mimeType: original.mimeType, size: original.size, sha256: original.sha256, chunkCount: original.chunkCount });
  }));
  router.get('/:documentId/original/:originalId/chunks/:index', wrap(async (req, res) => {
    const index = Number(req.params.index);
    if (!Number.isInteger(index) || index < 0) return res.status(400).json({ error: 'Invalid chunk index' });
    const original = await prisma.documentOriginal.findUnique({ where: { id: String(req.params.originalId) } });
    if (!original?.completedAt || original.documentId !== req.params.documentId) return res.status(404).json({ error: 'Original not found' });
    const chunk = await prisma.documentOriginalChunk.findUnique({ where: { originalId_index: { originalId: original.id, index } } });
    if (!chunk) return res.status(404).json({ error: 'Chunk not found' });
    res.type('application/octet-stream').send(decryptChunk(chunk, `${original.id}:${index}`));
  }));
  router.use((err: any, _req: Request, res: Response, _next: NextFunction) => res.status(err.type === 'entity.too.large' ? 413 : 400).json({ error: 'Invalid or oversized document upload' }));
  return router;
}

