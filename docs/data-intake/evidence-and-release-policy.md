# Candidate Geometry Evidence and Release Policy

This policy permits incomplete but source-backed Sprinter geometry to support planning
without representing it as verified production geometry. It does not change a runtime
schema or authorize production vehicle records.

## Evidence states

- `published`: a source value reproduced without normalization for the source's stated applicability.
- `verified`: a value checked against an authoritative drawing or controlled physical measurement.
- `derived_conservative`: a planning value selected from preserved source values by an approved conservative rule.
- `candidate`: credible supporting evidence whose applicability or datum is not fully established.
- `unresolved`: sources or datums cannot be safely normalized.

Normalized values are never labeled `published`. Every source value remains in the
comparison matrix.

## Operational approval

`candidate` records are documentation-only and are not planning-authorized.

`approved_for_planning` permits preliminary layouts, fitment analysis, payload
estimates, and build-sheet preparation. Candidate or controlled carryover values are
allowed only when their source, limitation, warnings, and final-verification
requirement remain visible. Planning approval does not authorize installation.

`approved_for_production` requires the actual VIN and configuration, final payload
review, installer or engineering review, acknowledgment of unresolved candidate
geometry, and physical verification wherever candidate data affects placement. No
record in this package has production approval.

## Normalization rules

- Usable length and height use the lowest credible supported value.
- Partition intrusion uses the highest credible supported value.
- Wheel-well and obstruction dimensions use the largest credible supported value.
- Required clearances use the largest credible supported value.
- Single-source values remain candidate.
- Unsupported or unclear datums remain unresolved.

## Controlled carryover

Westcan geometry pages state applicability through MY2025. Upfit Supply does not state
a model-year range, and Sterling warns that dimensions can vary by model year. MY2026
and future MY2027 planning use is therefore a controlled carryover assumption based on
the documented continuity of the 2019-2027 Sprinter body dimensions. Fitment-critical
values require placement-specific physical verification before production. RWD/AWD
geometry sharing remains candidate until checked; payload never shares through a
geometry assumption.

## Required warnings

- Candidate geometry
- Verify before production
- VIN payload required
- Supplier applicability carried forward
- Physical fitment review required

Warnings must remain visible in planning exports and cannot be interpreted as
production approval.

## Exception acknowledgment

Only exceptions applicable to the active body/configuration or actual placement block
production. They may remain open for planning if they are visible and a conservative
value is used. Production requires a recorded resolution, explicit acceptance, or
placement-specific mitigation. Unrelated E001-E016 exceptions are not planning gates.

## Scope of physical verification

Physical verification is limited to the checklist in
`sprinter-physical-verification-checklist.csv`. Full contour mapping and complete
structural-body digitization are not required.
