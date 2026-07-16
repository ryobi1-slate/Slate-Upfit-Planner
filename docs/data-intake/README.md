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

## References and derived values

Reference every fact as:

`<filename> | PDF p.<number> | printed p.<number-or-N/A> | § <section> | table/figure <identifier-or-N/A>`

Derived values must identify all source fields, include a reproducible formula, retain the source precision, and be independently verified. A derived value cannot have a stronger approval state than its inputs.

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
