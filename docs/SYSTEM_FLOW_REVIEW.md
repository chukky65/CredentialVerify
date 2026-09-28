# System flow review — 27 September 2026

This review traces the implementation, not the proposed architecture in older documents. Screenshots were treated as evidence of the reported behavior.

## Actual flow

1. React Router mounts `AppProvider`, which loads candidates, cases and audit events through `verificationService`. The service restores browser localStorage first, then merges candidate/case API responses. Refresh repeats these reads.
2. Sign-in selects a local persona without calling the Express JWT endpoint. UI role switching is separate from API token authentication. The API login endpoint accepts any nonempty email/password; frontend routes have no authentication gate. This is prototype authentication.
3. Intake collects identity, election, office and jurisdiction. Credential uploads in the active checklist are encoded into browser storage. The upload API is also a stub; it does not persist document bytes. Fingerprint capture, scan results and OCR are simulated.
4. Candidate creation calls the API. PostgreSQL/Prisma stores a candidate and an initial verification case. On API failure the frontend currently falls back to a browser-only registration. Documents and generated OCR fields are retained locally.
5. The dashboard and queue read cases from context; the directory reads candidates. Case overview and workbench resolve these records and allow local field corrections, source checks, requests for information and recommendations.
6. RFI issuance sets a case to `INFO_REQUIRED`. Candidate responses and adjudication use local service state; an accepted response can move it to `NEEDS_REVIEW`. Recommendations move cases to `VERIFIED`, `INFO_REQUIRED` or `RESTRICTED`, with adjudication/completion stages where applicable.
7. Audit entries and most review mutations are generated in the browser. Most mutations do not save immediately; persistence can depend on a subsequent refresh. The server workflow helper is tested separately but is not wired into API review endpoints.
8. Reports use hard-coded chart examples alongside context audit data. Discrepancy Review and Gazette also contain independent hard-coded example records, so they are not fully connected to registered candidates. Rules and user management use local service state rather than persistent server endpoints. Exports consume those available screen/service records.

## Reported problems and corrections

- Intake stored values such as `President`, `Presidential` and `Governorship` in `electionName`, with an unrelated fixed 2026 ID. Dashboard options used 2027 election names, while the directory used fictional 2026 elections. A shared catalogue now supplies intake/API validation and reporting options. The office selector is constrained to the selected election.
- The configured General Elections scope covers President, Senator and House of Representatives Member; the other two scopes cover Governor and State House of Assembly Member respectively. These are application reporting categories, not a newly asserted election schedule.
- Known malformed legacy office-as-election records are normalized on read. Unknown and historical elections are preserved and remain selectable. No database records are bulk rewritten. Read normalization deliberately supports rollout against existing records.
- Jurisdiction is now required and selectable for every office. State filtering includes recorded senatorial districts. Assembly registrations currently use a state-level scope because an authoritative constituency catalogue is not present.
- Total Submissions used every candidate regardless of scope. Candidates and cases now use the same election/jurisdiction predicate; case scope follows the candidate registration. Charts, counts and workload use the filtered case collection. No-match scopes show an explicit empty state.
- Registration created one server case and one local case, and refresh merged by ID only. The API now creates candidate and case in one transaction and returns the case; the browser reuses that ID. Existing browser/server copies are reconciled only when candidate ID and case reference match. Local review state is retained and source-check, discrepancy and RFI case IDs are relinked. Distinct case references are retained.
- Refresh Feed previously only waited and displayed a success message. It now calls the context's data refresh. The existing service still falls back to local data if the API is unavailable.
- Dashboard and connector screen had separate source lists and invented health telemetry. Both now use NUC, NPC, NIMC, INEC, NYSC and WAEC with the labels requested. No real registry adapters, endpoints or credentials exist; connections therefore display `Not configured`, with no invented uptime or latency. New source checks/retries report unavailable rather than claiming a verified match.

## Remaining work outside these corrections

- Replace permissive authentication and UI-only role controls with real identity verification and server authorization.
- Persist uploaded documents and review mutations on the server; replace simulated OCR, malware scans and biometrics. OCR generation still creates example claims and must not be treated as real extraction.
- Connect discrepancies, gazette, statutory rules and audit records to one persisted workflow. Current random audit strings are not a cryptographic event chain.
- Supply approved constituency/jurisdiction data and registry integrations. NUC's presence in the connector catalogue alone does not establish individual degree verification capability; do not infer a live credential API from the label.
- Clarify operational metric definitions: the existing SLA card uses priority/discrepancy status rather than a deadline calculation, and chart/workload labels mention daily windows that their current calculations do not enforce.
- Existing stored source-check results are historical prototype data; this change does not rewrite them into authentic verification evidence.

Verification is performed against local fixtures and mocked API/database boundaries. Live stored production records and upstream registries are not accessed by this review.

## Checks

- `npm run build`: production build passes (existing large-bundle warning).
- `npx tsx --test src/services/scopeRegression.test.ts`: seven passing checks covering legacy normalization, historical elections, every configured scope, jurisdiction combinations, duplicate reconciliation, linked records and server case identity reuse.
- In `server`, `npx tsc --noEmit`: passes.
- In `server`, `npx jest --runInBand src/intake.test.ts src/workflow.test.ts`: eight passing checks for API intake validation, transactional case creation and workflow transitions. Prisma is mocked for intake tests.
- Full-project `npm run lint` remains blocked by existing type errors in persona records, mock data, configuration and older Jest test globals. Those broader issues are not part of the scope/connector corrections.

## Follow-up: document evidence and Ground Zero corrections (2026-09-27)

This section supersedes the earlier OCR, review persistence, SLA and Gazette findings.

- Replaced intake-derived mock claims with Tesseract OCR for images/scanned PDFs and PDF.js text extraction. Recognition never receives intake values. Blank/unreadable files fail extraction. PDF text has no invented confidence; OCR confidence measures recognition, not authenticity. Bundled local resources are prepared by predev/prebuild; no desktop OCR installation is required.
- Labeled names and birth dates are compared against intake. Unstructured text remains available for manual review; arbitrary certificate layouts can require field selection/correction.
- Actual originals and PDF pages replace fictional certificate templates. Originals are stored in this browser's IndexedDB, not synchronized to other devices. Old claims require Re-extract; missing files require Reattach original.
- Review metadata, claims, RFIs and recommendations have server persistence. Offline changes remain local with pending synchronization. Server boundaries are tested with mocks, not a live database. Production authentication and concurrent multi-user changes still require hardening.
- Dashboard/queue counts share scoped case state. SLA uses deadlines, includes overdue, excludes completed. Throughput uses actual submission/decision dates over seven days.
- Age checks use office-specific minimums and today's assessment date. Ages over 120 are data-quality flags, not statutory maximums. An approved qualification date is not configured. Reference: https://www.inecnigeria.org/wp-content/uploads/2023/02/FAQ-Inner.pdf.
- Prerequisites derive from each candidate's evidence. Simulated legacy claims are removed; simulated registry checks are unavailable. Six registry adapters remain unconfigured.
- Gazette uses actual cases and downloads the selected candidate's escaped HTML evidence binder with a real SHA-256 digest. No publication/ballot clearance is implied; original files remain in the viewer.
- Checks: production build, backend typecheck, 11 Node tests, 9 backend Jest tests, and 5 Chrome browser tests pass. Browser tests cover actual image OCR, intake mismatch, two-page PDF, dashboard persistence/SLA, blank image, and selected Gazette dossier. Full-project typecheck retains the earlier unrelated persona/mock/config/Jest-global errors.

## Discrepancy screen follow-up

Removed the three hardcoded fictional discrepancy candidates and simulated resolution toast. The screen derives current name/DOB mismatches, extraction failures, legacy extraction warnings and age flags from registered candidates. Case-specific routes restrict the list to that case. Document flags open the correct case/document URL; intake-only flags open the candidate case. RFI actions retain the selected real case identity. Flags remain visible while the underlying evidence still conflicts; they are not automatically treated as resolved by a workflow status change. Registry corroboration remains unconfigured. NPC's display label is now National Population Commission.

Rechecked DOB extraction with a real synthetic credential: document DOB 1980-10-30 remains distinct from intake DOB 1970-10-30, appears in discrepancy review, and opens the correct original. Six browser tests and eleven Node tests pass; production build passes. Existing unrelated project typecheck errors remain.

## Operational reporting follow-up

Replaced fixed report KPIs, charts and credential totals with available candidate documents and case recommendations. UTC date ranges are calculated from the current date. Turnaround uses satisfied recommendations recorded during the window; extraction/correction summaries use documents uploaded during that window and their current review state. OCR confidence samples raw OCR lines once; structured claim totals exclude those raw lines. Missing samples display Not available. Source availability remains Not measured for the six unconfigured registry connections.

Export CSV now downloads a real escaped UTF-8 CSV of the same selected report window, including metrics, credential breakdown, weekly turnaround and six source statuses. It does not open a print dialog. Print Report is a separate action. Report headers use Independent National Electoral Commission (INEC); notifications are excluded from print media. Removed fabricated audit certification, fixed dates and passed-audit labels. Added deterministic report calculation tests and a browser test for CSV content, separate print action, INEC heading and print-only visibility.

## Audit/personnel routes and blank Gazette signatures

Added /audit-trail and /user-management routes matching sidebar navigation, retaining /audit and /users compatibility. Gazette already derives rows from actual registered cases and passes the selected case/candidate to dossier generation; revalidated with two newly created synthetic candidates. Added print action and blank Prepared by / Reviewed by name, signature and date lines, without prefilled leadership names or digital signer IDs. Browser regression covers direct access and reload for all four routes, selected-candidate dossier content and print-visible blank sign-off fields.

## Permanent original storage implementation (activation pending)

See DOCUMENT_STORAGE.md. Added encrypted PostgreSQL originals, authenticated chunk upload/download, final size/type/checksum validation, real server-managed staff sign-in, browser cache recovery and explicit storage synchronization status. This supersedes the earlier browser-only original-storage limitation once activated. The configured development database currently rejects the connection with tenant/user not found; activation has not yet occurred and no live durability result is claimed.

Development database activation: corrected the Session pooler connection, applied the additive storage/account SQL, and passed a live two-account encrypted upload/download test with byte equality and private table grants. Synthetic fixtures were cleaned up. Permanent staff account setup is still pending user identity/password setup; hosted deployment remains separate.

## Credential extraction quality follow-up (2026-09-28)

Added credential-specific structured fields and WAEC intake, split labels/names and selected narrative patterns, missing/uncertain/conflicting value warnings, conservative numeric DOB ambiguity handling, faint/blank-page detection and low-resolution warnings. Both frontend and API reject requirements-satisfied recommendations for missing, failed or unresolved extraction. Extraction metadata and scan warnings now persist; added the extractionMetadata column to the authorized development database and regenerated Prisma. Synthetic OCR matrix and image-only PDF/corrupt-file tests pass, alongside 16 Node regressions and 15 backend tests. Eleven browser tests pass. Real-credential acceptance is pending anonymized original samples; see EXTRACTION_VALIDATION.md for scope and limitations.
