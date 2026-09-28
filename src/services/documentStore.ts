import { downloadOriginal, uploadOriginal } from './originalApi';
const DB_NAME = 'credential_verify_documents';
function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('originals');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Document cache could not be opened.'));
  });
}
async function cached(id: string): Promise<Blob | undefined> {
  const db = await openStore();
  try { return await new Promise((resolve, reject) => {
    const request = db.transaction('originals').objectStore('originals').get(id);
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  }); } finally { db.close(); }
}
export async function storeOriginal(id: string, blob: Blob): Promise<void> {
  const db = await openStore();
  try { await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('originals', 'readwrite'); tx.objectStore('originals').put(blob, id);
    tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(new Error('Document could not be cached. Check available browser storage.'));
  }); } finally { db.close(); }
}
type OriginalDocument = { id: string; fileUrl?: string; originalStorageStatus?: 'LOCAL_ONLY' | 'SYNCED' | 'PENDING'; originalStorageError?: string };
export async function syncOriginal(doc: OriginalDocument): Promise<void> {
  if (doc.originalStorageStatus === 'SYNCED') return;
  let blob = await cached(doc.id);
  if (!blob && doc.fileUrl?.startsWith('data:')) { blob = await (await fetch(doc.fileUrl)).blob(); await storeOriginal(doc.id, blob); }
  if (!blob) return;
  doc.originalStorageStatus = 'PENDING';
  try { await uploadOriginal(doc.id, blob); doc.originalStorageStatus = 'SYNCED'; doc.originalStorageError = undefined; }
  catch (error) { doc.originalStorageError = error instanceof Error ? error.message : 'Original upload pending'; throw error; }
}
export async function readOriginal(doc: OriginalDocument): Promise<Blob> {
  // Server-backed files are always authorized and refreshed; stale browser copies cannot override them.
  if (doc.originalStorageStatus === 'SYNCED') {
    const blob = await downloadOriginal(doc.id);
    await storeOriginal(doc.id, blob).catch(() => {}); return blob;
  }
  const blob = await cached(doc.id);
  if (blob) return blob;
  if (doc.fileUrl?.startsWith('data:')) {
    const migrated = await (await fetch(doc.fileUrl)).blob(); await storeOriginal(doc.id, migrated); return migrated;
  }
  return downloadOriginal(doc.id);
}
