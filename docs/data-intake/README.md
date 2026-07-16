# Vehicle Data Intake Packages

These packages collect the source evidence, measurements, review decisions, and approvals needed before vehicle engineering data can become production-selectable. Templates are kept in CSV and Markdown so changes remain diffable and reviewable.

## Record states

- **Draft**: incomplete working material; never production-selectable.
- **Verified**: evidence and measurements have been independently checked, but production use is not yet approved.
- **Approved**: the designated owner has accepted the complete record and its revisions for production use.

Production-selectable records require `approval_state: approved`. No production JSON may be created until the intake package is complete and approved.

## Source hierarchy

Use the most authoritative applicable source available:

1. OEM body-builder, engineering, and chassis documents.
2. OEM order guides and VIN- or chassis-specific records.
3. Manufacturer installation drawings for installed equipment such as partitions.
4. Calibrated physical measurements with a completed worksheet and photo support.
5. Supplier literature as supporting evidence only, unless engineering explicitly approves it as primary.

Photos support measurements but do not replace source documents or calibrated worksheets.

Large source binaries may remain in an approved external archive when repository policy
does not permit committing them. The source index must retain the original URL when
known or a stable logical `archive_locator` when the original URL is unavailable, plus
the archive filename, retrieval date, publisher, page range, and SHA-256 hash so the
reviewed binary can be identified exactly. Logical locators under
`slate-engineering-source-archive/` identify the controlled external source package;
they are not workstation paths or claims about a public download URL.

## References and derived values

Reference every fact as:

`<filename> | PDF p.<number> | printed p.<number-or-N/A> | § <section> | table/figure <identifier-or-N/A>`

Derived values must identify all source fields, include a reproducible formula, retain the source precision, and be independently verified. A derived value cannot have a stronger approval state than its inputs.

Published OEM summary values, conflicting detail values, Slate-normalized values, and
final approved values remain separate. Source exceptions are never corrected in place.

## Approval workflow

1. Prepare the source index and blank-field worksheets.
2. Record applicable facts without guessing; leave unknown values blank.
3. Verify identity, applicability, coordinate system, geometry, tolerances, rounding, and payload policy.
4. Resolve or explicitly accept every open exception.
5. Complete engineering verification and data approval sign-off.
6. Create production JSON only after approval is complete.

## Naming convention

Use lowercase kebab-case directories for vehicle families and stable descriptive filenames. Source documents retain publisher titles with revision or publication date included. Revisions belong in file contents and source metadata; do not silently replace evidence.

## No guesses

Never infer a measurement, payload, applicability range, citation, or approval. Unknown numeric values remain blank during intake and become `null`, not zero, in records that support pending values.

Payload is configuration-specific even when multiple configurations are candidates to
share one geometry group. Future 2027 payload proposals use
`assumed_model_year_carryover`, remain draft, and require published or VIN-specific
confirmation before final approval.

## Candidate geometry-sharing groups

These groups are intake candidates only; none is approved:

1. `144-standard-roof-single-rear-wheel`
2. `144-standard-roof-dual-rear-wheel`
3. `144-high-roof-single-rear-wheel`
4. `144-high-roof-dual-rear-wheel`
5. `170-high-roof-single-rear-wheel`
6. `170-high-roof-dual-rear-wheel`
7. `170-extended-high-roof-single-rear-wheel`
8. `170-extended-high-roof-dual-rear-wheel`

RWD and AWD may share a candidate group only after explicit source or physical
verification. Payload always remains configuration-specific.

## Schema mapping status

Geometry worksheet rows use one of three mapping states:

- `mapped`: `json_path` is nonblank and appears in the Phase 3 schema allow-list.
- `intake_only`: operational evidence or policy that is not intended for runtime storage;
  `json_path` must be blank.
- `future_schema_candidate`: a potential future domain field; `json_path` must be blank
  until a schema change is approved separately.

Collection mappings use `data.surfaces[]` and `data.surfaces[].zones[]`. The row's
`surface_id` and `zone_id` select the intended record. Ad hoc selectors such as
`[driver_wall]` or `[partition]` are prohibited.

## Candidate geometry planning policy

The candidate-geometry package preserves supplier and OEM values separately, applies
declared conservative normalization rules, and distinguishes planning authorization
from production authorization. See:

- `evidence-and-release-policy.md`
- `sprinter-source-register.csv`
- `sprinter-geometry-source-comparison.csv`
- `sprinter-geometry-discrepancies.csv`
- `sprinter-physical-verification-checklist.csv`
- `candidate-geometry/`

Only `sprinter-144-high-roof` and `sprinter-170-high-roof` are
`approved_for_planning`. Planning approval does not authorize installation. The 144
Standard Roof and 170 Extended High Roof records remain Tier 3 candidates pending an
approved business need. No candidate record is approved for production.

## High-roof physical verification

The controlled shop procedure and blank worksheets for `sprinter-144-high-roof` and
`sprinter-170-high-roof` are in `physical-verification/`. These templates do not
represent completed verification. Runtime PR B remains blocked until both worksheets'
runtime-enabling subsets contain real evidence-backed measurements and review
acceptance. Placement-specific PV-007 attachment structure and PV-010 door/rear
clearance remain production gates after runtime design begins.
