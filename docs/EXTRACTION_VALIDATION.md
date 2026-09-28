# Extraction validation

## Current behavior

Extraction reads original image/PDF contents; it never receives candidate intake names or dates as hints. English OCR runs locally with bundled Tesseract resources. PDFs use their text layer when available; scanned pages use OCR. Claims remain NEEDS_REVIEW with source verification PENDING, regardless of OCR score.

Supported candidate-field patterns include labels on the same line or a nearby line, surname/given-name pairs, and selected degree/NYSC narrative wording. Credential-specific expected fields are review aids, not legal prerequisites:

| Uploaded category | Expected extracted fields |
| --- | --- |
| Birth certificate | Full name, birth date |
| Degree | Full name, qualification |
| WAEC | Full name, examination number |
| NYSC | Full name, certificate number |

Missing values are not filled from intake. Unknown formats remain available as raw document text with missing-field warnings. OCR below 80% on a structured field requires confirmation/correction; this is a review threshold, not a measured accuracy claim. Dates with ambiguous numeric day/month order remain unnormalized until human review. Different values for the same field are flagged. Parent/registrar labels are not treated as candidate identity. Empty/faint uniform scans and corrupt files fail extraction. Low-resolution images and unreadable pages receive warnings.

A requirements-satisfied recommendation is blocked at both service/API layers when documents are missing, extraction failed, expected fields are missing, or structured values remain uncertain. Original authenticity and authoritative registry validation remain separate. Human corrections need to reference actual document evidence.

Extraction version, status, error, raw text, per-field method and scan warnings are persisted so a server reload does not turn a failed extraction into a successful one. Apply server/prisma/extraction-quality.sql when deploying to another database; the authorized development database has been updated.

## Reproducible tests

- `npx tsx --test src/services/extractionQuality.test.ts src/services/documentWorkflow.test.ts`
- Chrome: set PLAYWRIGHT_CHANNEL=chrome and run `npx playwright test tests/extraction-matrix.spec.ts`
- In server: `npx jest --runInBand`

Synthetic OCR matrix: birth surname/given-name layout, degree narrative layout, WAEC examination-number layout, NYSC narrative/certificate-number layout, missing-name form, 500-pixel image, nearly invisible text, blank image. Additional image-only PDF verifies OCR rather than text-layer extraction; corrupt PDF must fail. Unit cases cover conflicting names, low confidence, ambiguous/invalid dates, distant/page-separated labels and PDF text without fabricated confidence. Persistence and API tests cover blank-document rejection and failure/warning round-trip.

## Real-credential acceptance remains pending

Four user-supplied credential images were tested through actual browser OCR on 2026-09-28. Their authenticity has not been established. Originals remain outside the repository; detailed OCR results containing personal data remain in ignored test-results. These four examples are not a representative credential dataset or a production accuracy benchmark.

| Sample | Observed baseline |
| --- | --- |
| Cropped degree | Name and Bachelor of Science extracted correctly on visual comparison. Course appeared in raw text, not a structured claim. Issuer and cropped award date were not extracted. |
| NYSC | Name misread at 37% OCR confidence; certificate number visible in raw text but not structured. Missing-field and low-confidence review warnings. |
| Handwritten birth certificate | Printed headings read; child name and birth date not extracted. Missing-field review warnings. |
| Tilted WAEC photograph | Fragmentary text; candidate name and examination number not extracted. Missing-field review warnings. |

All four received low-resolution warnings and all claims stayed NEEDS_REVIEW with source PENDING. COMPLETE denotes completion of the reading process, not successful identification or verification. The next work is improving photographed-document reading and field coverage without inventing missing values; handwriting still needs manual review. More university layouts are needed before claiming cross-university reliability.

Repeat privately in PowerShell: set `$env:CREDENTIAL_SAMPLE_DIR` to the directory containing degree.jpg, NYSC-Certificate-Of-Service.png, photobirth.jpg and waec.jpg; set `$env:PLAYWRIGHT_CHANNEL='chrome'`; run `npx playwright test tests/provided-samples.spec.ts`. This opt-in test checks conservative review behavior and a degree qualification baseline, not authenticity or complete extraction accuracy. Do not publish its private JSON attachment.

For acceptance, supply anonymized originals from each category with ground-truth expected fields, including different issuers/layouts, phone photos, scans, faint/blurred copies, skewed pages, stamps overlapping text, missing values and intentionally unrelated/blank documents. Compare field values, missing-field rates, false matches, review flags and evidence coordinates per document. Preserve date/field layout when anonymizing. Handwriting, heavily damaged scans, unsupported languages and unfamiliar unlabeled layouts require manual review. No automatic reading guarantee is made for them.
