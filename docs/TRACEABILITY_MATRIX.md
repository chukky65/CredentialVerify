# Traceability Matrix

This matrix maps every visible frontend action to its required backend components.

| Frontend Action | API Endpoint | Required Permission | Database Operation | Audit Event | Success State | Failure State | Automated Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Add candidate** | `POST /candidates` | `candidate:create` | `INSERT INTO candidates` | `CANDIDATE_CREATED` | Route to `/candidates/:id` | Show validation errors | `test_candidate_creation()` |
| **Upload document** | `POST /cases/:id/documents` | `document:upload` | `INSERT INTO documents` | `DOCUMENT_UPLOADED` | Show pending scan status | Show "Invalid format" | `test_document_upload()` |
| **Assign reviewer** | `POST /cases/:id/assign` | `case:assign` | `UPDATE cases` | `CASE_ASSIGNED` | UI shows assigned user | "User unavailable" toast | `test_case_assignment()` |
| **Correct extracted field** | `POST /cases/:id/documents/:docId/claims/:claimId/corrections` | `claim:correct` | `INSERT INTO claim_corrections` | `CLAIM_CORRECTED` | Field updates visually | "Permission denied" toast | `test_claim_correction_versioning()` |
| **Request another document (RFI)** | `POST /cases/:id/rfis` | `rfi:create` | `INSERT INTO information_requests` | `RFI_ISSUED` | RFI appears in case feed | "Missing details" error | `test_rfi_issuance()` |
| **Accept corroborated value** | `POST /cases/:id/discrepancies/:id/resolve` | `discrepancy:resolve` | `UPDATE discrepancies` | `DISCREPANCY_RESOLVED` | Discrepancy closed | Update failure alert | `test_discrepancy_resolution()` |
| **Record recommendation** | `POST /cases/:id/recommendations` | `recommendation:create` | `INSERT INTO recommendations` | `RECOMMENDATION_SUBMITTED` | Case status changes | "Incomplete analysis" error | `test_recommendation_submission()` |
| **Approve determination** | `POST /cases/:id/determinations` | `determination:create` | `INSERT INTO determinations` | `DETERMINATION_APPROVED` | Case closed | "Unauthorized" error | `test_adjudicator_determination()` |
| **Approve publication** | `POST /gazette/drafts/:id/approve` | `gazette:approve` | `UPDATE gazette_publications` | `PUBLICATION_APPROVED` | Draft changes to published | "Cannot self-approve" error | `test_dual_approval_requirement()` |
| **Export audit data** | `GET /audit/export` | `audit:export` | `SELECT FROM audit_events` | `AUDIT_EXPORTED` | CSV file downloads | "Unauthorized access" | `test_audit_export_security()` |
| **Test source connection** | `POST /sources/:id/test` | `source:test` | `INSERT INTO source_check_attempts` | `SOURCE_CONNECTION_TESTED` | "Connection successful" | "Connection timeout" | `test_source_connector_failure()` |
