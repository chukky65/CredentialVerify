# Permanent original document storage

## Implementation

Original PDFs, JPEGs and PNGs (maximum 25 MB) are stored as encrypted PostgreSQL chunks. Browser IndexedDB is a staging cache. A completed original is retrieved using authenticated API requests, never a public file URL. Transfers use 1 MiB chunks to avoid serverless request/response size limits. AES-256-GCM protects every chunk with its original ID/index as authenticated context; SHA-256 and magic-byte validation are checked before completion. An interrupted upload is not readable. Completed versions are retained, and pending sessions expire after 24 hours.

Access requires a signed token for an active StaffAccount, checked on every original request. Intake officers, analysts, senior adjudicators, auditors and administrators can read; auditors cannot upload. This is agency-wide access, not per-case or per-jurisdiction authorization. Demo identities never grant original access. Production still needs broader account management, login throttling, MFA and retention policies.

## Development activation

1. Update `server/.env` DATABASE_URL and DIRECT_URL with working development PostgreSQL connection strings. Both may use the Supabase Session pooler for local Windows development. Use TLS (`sslmode=require`) when connecting to Supabase.
2. Keep JWT_SECRET (at least 32 characters) and DOCUMENT_STORAGE_KEY (base64 of exactly 32 random bytes) private. Local keys have been prepared in ignored `server/.env`. Do not regenerate the storage key after uploading files: losing it makes the files unreadable. Back up it separately from database backups. The same key must be present on every application server.
3. From `server`, run `npx prisma generate`, then `npx prisma db execute --file prisma/document-storage.sql --schema prisma/schema.prisma`. The additive SQL only creates storage/account tables and an index; it does not reset or delete candidate records.
4. Provision a real account: set STAFF_INITIAL_PASSWORD in the local process environment, then run `npx tsx src/provisionStaff.ts reviewer@example.com "Reviewer Name" STAFF-001 VERIFICATION_ANALYST` from `server` (tsx is installed in the parent project). Passwords require at least 12 characters and are hashed with scrypt. Remove the environment variable afterward. Do not put passwords in command arguments or source control.
5. Start the backend and sign in with the provisioned account. Save a candidate; the original uploads after the candidate/document metadata transaction. Failed uploads remain visibly pending. Use **Sync originals to server** in the workbench to retry or migrate cached originals for existing server-backed candidates. Browser-only offline candidates must first be registered on the backend. Missing originals must be reattached on the device that has them.
6. Confirm **Original saved on server**, then sign in as another provisioned reviewer in a separate browser and open the document. Only then remove old browser data.

Apply the same SQL and set server-only keys in the hosting environment before deployment. Never use VITE_ variables for these secrets. Use database backups and test restoration together with the encryption key. Database storage grows with original file sizes and retained versions; capacity must be monitored. This storage does not scan files for malware or establish credential authenticity.

## Validation and current activation status

Repository tests exercise encrypted chunk transfer, authorization, incomplete uploads, checksum failures, immutable completed chunks, and cross-document denial against a stateful database double. A browser test uploads a synthetic image, deletes IndexedDB and retrieves it in a second isolated browser context through mocked API boundaries. These tests do not establish live database durability.

The existing development database initially returned `tenant/user not found`; no database schema has been changed yet. Live migration and two-account testing must be completed after correcting that connection.

## Development activation completed

The corrected Supabase Session pooler address connected successfully using the password already present in the local environment. Applied `document-storage.sql` to the authorized development database. A live test created isolated synthetic candidate/document and two staff accounts, uploaded encrypted chunks, finalized the upload, retrieved identical bytes through the second account, confirmed anonymous access was denied and public Supabase table grants were absent, then removed its exact fixtures. Existing candidate records were not changed. Browser originals must still be explicitly synced before their local copies can be safely cleared. A permanent real staff account is the remaining user setup step. Hosted deployment requires the server environment keys and updated app code; the local setup does not update Vercel automatically.
