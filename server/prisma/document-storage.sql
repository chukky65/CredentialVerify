BEGIN;
CREATE TABLE IF NOT EXISTS "StaffAccount" (
 "id" TEXT PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL,
 "staffId" TEXT NOT NULL UNIQUE, "role" TEXT NOT NULL, "passwordHash" TEXT NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS "DocumentOriginal" (
 "id" TEXT PRIMARY KEY, "documentId" TEXT NOT NULL REFERENCES "SubmittedDocument"("id") ON DELETE CASCADE,
 "uploadedBy" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "size" INTEGER NOT NULL,
 "sha256" TEXT NOT NULL, "chunkCount" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "completedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "DocumentOriginal_documentId_completedAt_idx" ON "DocumentOriginal"("documentId", "completedAt");
CREATE TABLE IF NOT EXISTS "DocumentOriginalChunk" (
 "originalId" TEXT NOT NULL REFERENCES "DocumentOriginal"("id") ON DELETE CASCADE,
 "index" INTEGER NOT NULL, "encrypted" BYTEA NOT NULL, "iv" BYTEA NOT NULL, "tag" BYTEA NOT NULL,
 PRIMARY KEY ("originalId", "index")
);
-- These tables must never be exposed through Supabase's public REST roles.
ALTER TABLE "StaffAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentOriginal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentOriginalChunk" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "StaffAccount", "DocumentOriginal", "DocumentOriginalChunk" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "StaffAccount", "DocumentOriginal", "DocumentOriginalChunk" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "StaffAccount", "DocumentOriginal", "DocumentOriginalChunk" FROM authenticated;
  END IF;
END $$;
COMMIT;
