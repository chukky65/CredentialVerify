# API Specification

The REST API will follow OpenAPI 3.1 standards, communicating via JSON.

## Base URL
`/api/v1`

## Endpoints

### Authentication & Users
- `POST /auth/login` - Authenticate via OIDC.
- `POST /auth/logout` - Invalidate session.
- `GET /users/me` - Retrieve current user profile and permissions.
- `GET /users` - List users (Admin).

### Candidates
- `GET /candidates` - List candidates with filters (jurisdiction, election).
- `POST /candidates` - Create a new candidate profile.
- `GET /candidates/:id` - Get candidate details.
- `PATCH /candidates/:id` - Update candidate details.

### Verification Cases
- `GET /cases` - List verification cases (triage queue).
- `GET /cases/:id` - Get case details including linked claims and documents.
- `POST /cases/:id/assign` - Assign a case to a reviewer.

### Documents & Extraction
- `POST /cases/:id/documents` - Initialize document upload.
- `GET /cases/:id/documents/:docId` - Retrieve document metadata and signed URL.
- `GET /cases/:id/documents/:docId/claims` - Retrieve extracted claims.
- `POST /cases/:id/documents/:docId/claims/:claimId/corrections` - Correct an extracted claim (creates a new version).

### Source Checks
- `POST /cases/:id/source-checks` - Trigger a manual authoritative source check.
- `GET /cases/:id/discrepancies` - List discrepancies for a case.
- `POST /cases/:id/discrepancies/:id/resolve` - Resolve a discrepancy.

### Adjudication & Publishing
- `POST /cases/:id/recommendations` - Submit an analyst recommendation.
- `POST /cases/:id/determinations` - Record a senior adjudicator determination.
- `POST /gazette/drafts` - Create a draft publication.
- `POST /gazette/drafts/:id/approve` - Authorize publication (requires 2-approver consensus).

### Audit & Reporting
- `GET /audit` - Retrieve tamper-evident audit logs.
- `GET /reports/metrics` - Retrieve dashboard and operational SLA metrics.
