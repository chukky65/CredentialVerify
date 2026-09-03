# CredentialVerify — Electoral Candidate Credential Verification Platform

A secure, institutional web application engineered for authorized electoral commission officials to receive, inspect, corroborate, and adjudicate credentials submitted by electoral candidates.

---

## 🏛️ Product Purpose & Statutory Boundaries

1. **Assisted Human Review**: The platform assists authorized verification analysts and senior adjudicators by extracting structured claims, highlighting documentary evidence, and querying authoritative registers.
2. **No Automated Disqualification**: The system **never** makes final legal eligibility or candidate-disqualification decisions automatically. Adverse determinations strictly require an authorized human reviewer.
3. **Neutral & Objective Terminology**: Neutral descriptions are enforced across all screens. Suspicious anomalies are labeled as *"Potential integrity concern"* or *"Requires investigation"*, avoiding speculative or accusatory phrasing.
4. **Strict Non-Discrimination**: The platform never infers political party alignment, religion, ethnicity, health status, disability, or protected personal characteristics.
5. **No Facial Recognition**: Face detection/biometrics are strictly excluded; identity corroboration is anchored on statutory civil registry records and primary documentation.
6. **Confidence Metrics**: Confidence scores quantify OCR and document parsing clarity—never personal honesty or truthfulness.

---

## 👥 Role-Based Access Control (RBAC)

| Role | Responsibilities & Access Scope |
| :--- | :--- |
| **Intake Officer** | Ingests candidate filings, verifies statutory filing package completeness, inspects document resolution. |
| **Verification Analyst** | Inspects extracted claims in Document Workbench, links claims to visual evidence, applies non-destructive corrections. |
| **Senior Adjudicator** | Adjudicates conflicting claims, reviews escalated cases, records formal statutory recommendations. |
| **Auditor** | Inspects immutable SHA-256 event chains, verifies non-repudiation, exports regulatory compliance packages. |
| **Administrator** | Configures electoral prerequisite rules, SLA turnaround thresholds, and provisions authorized staff. |

---

## 📋 Comprehensive Screen Index

1. **Sign In & MFA Screen (`/sign-in`)**: Institutional authentication with quick-switch persona selectors for testing each authorized role.
2. **Operational Dashboard (`/dashboard`)**: KPI metrics, SLA countdown monitors, throughput velocity charts, and prioritized triage lists.
3. **Candidate Directory (`/candidates`)**: Searchable candidate roster with jurisdiction filters, completeness meters, and credential badges.
4. **Candidate Intake Wizard (`/create-candidate`)**: Multi-step ingestion workflow with instant document quality checks.
5. **Verification Queue (`/queue`)**: Triage workbench supporting single and bulk assignment, statutory age filtering, and SLA deadline tags.
6. **Case Overview (`/case-overview`)**: Comprehensive candidate verification file containing credential checklists and review timelines.
7. **Document Review Workbench (`/workbench`)**: Three-panel inspection suite featuring vector document rendering, evidence bounding boxes, zoom/pan controls, and field correction modals.
8. **Discrepancy Review (`/discrepancies`)**: Side-by-side reconciliation between candidate claims and authoritative government registers.
9. **Authoritative Source Checks (`/source-checks`)**: Real-time telemetry, latency indicators, and manual test pings for government API connectors (NADC, Bar, NRCS, Police, Tax).
10. **Operational Reports (`/reports`)**: SLA turnaround charts, OCR accuracy statistics, and human correction rates.
11. **Audit Trail & Cryptographic Ledger (`/audit-trail`)**: Immutable chronological transaction logs with SHA-256 hashes and statutory reason codes.
12. **System Configuration (`/configuration`)**: Parameter controls for SLA thresholds, confidence limits, and default PII masking.
13. **User Management (`/user-management`)**: Staff provisioning, role assignment, and access credential controls.

---

## 🔒 Security, Privacy & Accessibility Standards

- **Dynamic PII Masking**: Global one-click toggle to redact dates of birth, phone numbers, and residential addresses.
- **Session Lifespan & Auto-Lock**: 15-minute countdown timer with interactive session renewal.
- **Audit Logging**: Every field correction and recommendation generates a cryptographically hashed log entry.
- **Accessibility**: High-contrast institutional color palette compliant with WCAG 2.2 AA standards.
