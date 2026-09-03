# Data Model

The application will use a PostgreSQL relational database. The following entities will be implemented with UUID primary keys, UTC timestamps, and strict foreign-key constraints.

## Core Entities
- `organizations`
- `jurisdictions`
- `elections`
- `offices`
- `credential_types`
- `credential_requirements`

## Candidate & Case Management
- `candidates`: Core candidate demographic and election data.
- `candidate_aliases`
- `candidate_contacts`
- `cases`: The verification workflow tracker for a candidate.
- `case_assignments`: Reviewer assignments.
- `case_state_transitions`: Audit history of case status changes.

## Document Processing
- `documents`: Uploaded credential files.
- `document_pages`: Page-level metadata.
- `file_scan_events`: Malware and integrity scan results.
- `extracted_claims`: The immutable OCR extraction results.
- `claim_versions`: Historical versions of claims.
- `claim_corrections`: Human modifications to claims.
- `evidence_regions`: Bounding boxes for OCR matches.

## Source Verification
- `source_connectors`: Configuration for external government APIs.
- `source_connector_health`: Telemetry for external APIs.
- `source_checks`: Results of authority pings.
- `source_check_attempts`: Individual network requests.
- `discrepancies`: Conflicts between extracted claims and source checks.

## Human Review & Adjudication
- `reviewer_notes`
- `information_requests` (RFIs)
- `information_request_responses`
- `recommendations`: Analyst suggestions.
- `determinations`: Final legal decisions.
- `approval_requests`
- `appeals`
- `appeal_events`

## Publication
- `gazette_publications`: Official approved listings.
- `gazette_entries`: Individual candidate rows in the gazette.

## Security & Audit
- `users`, `roles`, `permissions`, `user_roles`, `user_jurisdictions`
- `audit_events`: Tamper-evident, cryptographically chained logs.
- `asynchronous_jobs`, `outbox_events`
