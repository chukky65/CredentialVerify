import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
export const CHUNK_SIZE = 1024 * 1024;
export const MAX_SIZE = 25_000_000;
export function storageKey() {
  const encoded = process.env.DOCUMENT_STORAGE_KEY || '';
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64') !== encoded) throw new Error('Document storage encryption is not configured');
  return key;
}
export function encryptChunk(data: Buffer, identity: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', storageKey(), iv);
  cipher.setAAD(Buffer.from(identity));
  return { encrypted: Buffer.concat([cipher.update(data), cipher.final()]), iv, tag: cipher.getAuthTag() };
}
export function decryptChunk(chunk: { encrypted: Uint8Array; iv: Uint8Array; tag: Uint8Array }, identity: string) {
  const cipher = createDecipheriv('aes-256-gcm', storageKey(), chunk.iv);
  cipher.setAAD(Buffer.from(identity)); cipher.setAuthTag(Buffer.from(chunk.tag));
  return Buffer.concat([cipher.update(chunk.encrypted), cipher.final()]);
}
export function detectedMime(bytes: Buffer) {
  if (bytes.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  return null;
}
