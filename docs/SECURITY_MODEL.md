# Security Model

The platform enforces strict Role-Based Access Control (RBAC), Jurisdiction Isolation, and Auditability.

## Roles & Permissions

1. **INTAKE_OFFICER**
   - *Can:* Create candidates, upload documents.
   - *Cannot:* Correct claims, adjudicate.

2. **VERIFICATION_ANALYST**
   - *Can:* Review documents, correct extracted claims, record recommendations, view source checks.
   - *Cannot:* Record final legal determinations.

3. **SENIOR_ADJUDICATOR**
   - *Can:* Review escalated cases, record final determinations.
   - *Cannot:* Authorize official gazette publication alone (requires second approver).

4. **COMMISSION_APPROVER**
   - *Can:* Authorize official gazette publication. Two distinct approvers are required per publication.

5. **AUDITOR**
   - *Can:* Read-only access to authorized audit information. Verify the cryptographically linked ledger.

6. **ADMINISTRATOR**
   - *Can:* Manage system configuration, SLA thresholds, rules, provision users.
   - *Cannot:* Silently alter finalized evidence, adjudicate cases.

## Authorization Principles
- **Server-Side Enforcement:** Hiding UI buttons is insufficient. Every API endpoint validates the JWT claims and database permissions.
- **Jurisdiction Isolation:** Users (except cross-jurisdiction Auditors/Admins) can only access records within their authorized jurisdiction.
- **Escalation Prevention:** Users cannot increase their own permissions.

## Audit Ledger
- All sensitive actions (e.g., claim correction, determination) append an event to the `audit_events` table.
- Events use cryptographic hashing (SHA-256) of previous events to create a tamper-evident chain.
- The ledger is strictly append-only.

## Data Protection
- **Document Storage:** Files stored in private cloud buckets. No public read access. Presigned URLs are used with short lifespans (e.g., 15 minutes).
- **PII Masking:** PII (DOB, Phone, etc.) is masked in the frontend by default.
