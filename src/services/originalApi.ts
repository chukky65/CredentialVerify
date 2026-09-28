/// <reference types="vite/client" />
const base = import.meta.env?.VITE_API_URL || '/api';
export class OriginalAccessError extends Error { constructor(message: string, public status: number) { super(message); } }
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(base + '/documents/' + path, { ...init, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}`, ...init.headers }, cache: 'no-store' });
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new OriginalAccessError(data.error || 'Original document could not be synchronized', response.status); }
  return response;
}
export async function sha256(blob: Blob) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))).map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function uploadOriginal(id: string, blob: Blob) {
  const prefix = encodeURIComponent(id) + '/original';
  const checksum = await sha256(blob);
  const session = await (await request(prefix, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ size: blob.size, mimeType: blob.type, sha256: checksum }) })).json();
  if (!session.id || !Number.isInteger(session.chunkSize) || session.chunkSize < 1) throw new Error('Invalid upload session');
  if (!session.complete) {
    for (let offset = 0, index = 0; offset < blob.size; offset += session.chunkSize, index++) {
      await request(`${prefix}/${encodeURIComponent(session.id)}/chunks/${index}`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: blob.slice(offset, offset + session.chunkSize) });
    }
    const result = await (await request(`${prefix}/${encodeURIComponent(session.id)}/complete`, { method: 'POST' })).json();
    if (result.sha256 !== checksum) throw new Error('Server checksum did not match the original');
  }
  return checksum;
}
export async function downloadOriginal(id: string) {
  const prefix = encodeURIComponent(id) + '/original';
  const manifest = await (await request(prefix)).json();
  if (!manifest.id || !Number.isInteger(manifest.chunkCount) || manifest.chunkCount < 1 || manifest.chunkCount > 24 || manifest.size > 25_000_000) throw new Error('Invalid original document manifest');
  const chunks: Blob[] = [];
  for (let index = 0; index < manifest.chunkCount; index++) chunks.push(await (await request(`${prefix}/${encodeURIComponent(manifest.id)}/chunks/${index}`)).blob());
  const blob = new Blob(chunks, { type: manifest.mimeType });
  if (blob.size !== manifest.size || await sha256(blob) !== manifest.sha256) throw new Error('Original document integrity check failed');
  return blob;
}
