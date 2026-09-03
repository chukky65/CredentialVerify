# Fix Plan

This plan details the phased approach to converting the CredentialVerify prototype into a production-ready application, per the requested implementation checkpoints.

## Checkpoint 1: Audit (Completed)
- Inspect project structure and identify current architecture.
- Locate mock datasets (`src/services/mockData.ts`).
- Identify routing approach (state-based via `AppContext.tsx`).
- Generate required documentation (`CURRENT_STATE_AUDIT.md`, `ARCHITECTURE.md`, etc.).

## Checkpoint 2: Frontend Routing & Demo Mode
- **Task:** Install `react-router-dom`.
- **Task:** Refactor `AppContext.tsx` to use URL-based routes instead of local state for `currentScreen`.
- **Task:** Map all required paths (e.g., `/dashboard`, `/candidates/:id`, `/queue`).
- **Task:** Standardize the mock dataset. Separate Pacifica/Veridia records appropriately, ensuring stable candidate/case IDs (`CAND-*`, `CASE-*`).
- **Task:** Retain mock dataset strictly for "Demo Mode" and introduce a mechanism to isolate it from Production Mode.
- **Task:** Fix frontend navigation (Back/Forward buttons, direct linking, refresh preservation).
- **Task:** Audit all event handlers for loading/success/error states.

## Checkpoint 3: Backend & Database Foundations
- **Task:** Scaffold the backend (Fastify/NestJS).
- **Task:** Initialize PostgreSQL database schema using migrations.
- **Task:** Implement Identity Platform OIDC authentication.
- **Task:** Establish authorization middleware enforcing roles (INTAKE_OFFICER, VERIFICATION_ANALYST, etc.).
- **Task:** Build Candidates and Cases REST APIs.

## Checkpoint 4: Document Storage & Processing
- **Task:** Set up Google Cloud Storage bucket.
- **Task:** Implement secure document upload initialization and signed URLs.
- **Task:** Validate file MIME, size, and calculate SHA-256.
- **Task:** Build immutable OCR extraction schema and claim versioning system.

## Checkpoint 5: Source Connectors & Adjudication
- **Task:** Implement authority API connector framework (timeout, retries, circuit breakers).
- **Task:** Expose endpoints for discrepancy identification and resolution.
- **Task:** Implement the recommendation and final determination workflow enforcing permission boundaries.

## Checkpoint 6: Audit Ledger & Reports
- **Task:** Build the append-only, tamper-evident cryptographic audit ledger.
- **Task:** Build metrics endpoints calculating real data instead of hard-coded totals.
- **Task:** Implement the dual-approval Gazette publication workflow.

## Checkpoint 7: Security & Testing
- **Task:** Add comprehensive E2E and integration tests.
- **Task:** Perform security hardening and IAM reviews.
- **Task:** Finalize infrastructure-as-code and staging deployment docs.
