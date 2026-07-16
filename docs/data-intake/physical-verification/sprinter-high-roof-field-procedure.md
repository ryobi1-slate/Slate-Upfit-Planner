# Sprinter High-Roof Field Procedure

## Scope and controls

Use this procedure only for `sprinter-144-high-roof` and `sprinter-170-high-roof`. It is non-destructive: no drilling, destructive disassembly, or inferred hidden structure. Record the vehicle exactly as installed.

The current 9-inch wheel-well-depth candidate applies only to the documented 2500/3500XD supplier group. A 3500 or 4500 vehicle must not validate that candidate. A 3500 or 4500 observation may be retained separately, but its chassis limitation remains unresolved until separately governed.

## Vehicle eligibility record

Before measuring, record:

- VIN last 8;
- model year, wheelbase, roof, chassis, and drivetrain;
- partition presence, manufacturer/type when known, and installed condition;
- installed floor condition and type;
- installed floor thickness when measurable;
- installed liner condition and type; and
- installed liner thickness when measurable.

Reject the session for the selected body worksheet if wheelbase or roof does not match. Do not represent RWD/AWD geometry sharing as verified from a vehicle that was not measured.

## Required tools

- calibrated or condition-checked tape measure marked in inches;
- laser distance meter when its reference face can be documented;
- straightedge, square, plumb line, and removable low-tack datum tape;
- non-marring thickness gauge or caliper where accessible;
- camera capable of legible overview and close-up photographs;
- blank worksheet and photo-index template; and
- temporary labels for session, datum, side, and evidence IDs.

Record the tool identifier or description in worksheet notes. Do not invent a tolerance from tool resolution.

## Vehicle preparation

1. Park on a level, stable surface; secure the vehicle and provide safe lighting.
2. Remove loose cargo only. Do not remove installed floors, liners, partitions, or trim.
3. Record driver and passenger sides explicitly.
4. Photograph the initial installed condition.
5. Confirm doors can be safely opened for measurement.
6. Identify obstructions that prevent access and record them rather than estimating through them.

## Coordinate convention and datum

The repository convention is inches with X origin `cargo_front`, positive X toward the rear, and positive Y from the floor. For this session, document the physical `cargo_front` reference plane, label it, and photograph how it is reproduced on both sides.

X = 0 is the physically documented `cargo_front` reference plane. Positive X increases toward the rear. Do not derive an X coordinate by adding or subtracting incompatible supplier segments.

The physical partition rear face is not the supplier partition zone. Shelving-space length is not door-opening-to-rear length. Usable wall height is not standing height or OEM maximum interior height.

## Measurement sequence

1. Complete vehicle eligibility and session identification.
2. Establish PV-001 `cargo_front`; photograph overview, reference contact points, and side labels.
3. Record PV-002 partition presence. If present, measure its physical rear face X; if absent, document absence with evidence.
4. Measure PV-003 driver and passenger wheel-well X start/end, then accessible length, height, and depth without inferring concealed contours.
5. Measure PV-004 passenger sliding-door clear-opening X start/end and clear width with the door fully open.
6. Establish PV-005 driver and passenger rear usable boundaries and separately measure the applicable shelving-space envelope.
7. Record PV-006 visible major no-mount zones and usable wall height. Add repeatable rows for multiple visible zones; do not claim hidden structure was inspected.
8. Record PV-008 installed floor type, thickness, and measurement reference. If thickness cannot be measured, explain why and attach evidence.
9. Record PV-009 liner type, thickness, and mounting impact. If thickness cannot be measured, explain why and attach evidence.
10. Leave PV-007 and PV-010 `not_applicable` until an actual product placement exists. They remain production-only checks.

## Repeat measurements

For every numeric row:

1. Reset or reposition the measuring tool.
2. Record observation 1 and observation 2 independently.
3. Preserve both observations.
4. If they agree sufficiently for reviewer judgment, set `measurement_status` to `ready_for_review`; do not populate `accepted_value` until review.
5. If they differ materially, set `needs_recheck`. Do not average automatically and do not invent an engineering tolerance.

Use inches consistently. Categorical rows record independent confirmation in the two observation fields when practical.

## Photo and evidence requirements

Create enough photographs to reproduce the datum and understand each measurement:

- vehicle/session overview and VIN/configuration evidence;
- datum overview and close-ups;
- driver-side and passenger-side wheel-well views;
- fully open sliding-door view;
- rear-boundary and rear-door views;
- partition face or partition-absence views;
- floor edge/reference and liner views; and
- each visible no-mount zone with context and close-up.

Name evidence with the verification session, body, check, measurement key, and sequence, for example:
`<session>_<body>_<check>_<measurement-key>_<sequence>.jpg`.

Register every file in `photo-index-template.csv`. Photos remain outside Git and use stable logical archive locators, never workstation paths.

## Review, discrepancies, and correction

The reviewer confirms eligibility, correct side, reproducible datum, evidence linkage, source meaning, and observation agreement. Candidate reference values are comparison aids only and never physical observations.

If evidence is incomplete or a datum is ambiguous, use `needs_recheck` or `rejected`. Preserve the original observations and evidence. A correction must identify the new session or worksheet revision.

Known incompatibilities remain explicit:

- 144 High Roof 64.625 is door-opening-to-rear, not passenger shelving length.
- 170 High Roof 72 is Upfit inside-roof, not the selected usable-wall-height candidate.
- 170 High Roof 79 is OEM interior height, not the selected usable-wall-height candidate.
- 170 High Roof 105.125 is door-opening-to-rear, not passenger shelving length.
- partition zone 7.5 and physical partition depth 9 use different boundaries.

## Completion and production limitations

The runtime-enabling subset is complete only when every required row for both bodies has real observations, evidence IDs, reviewer identity/date, and `accepted` status. Blank or `not_measured` rows do not count.

PV-007 and PV-010 cannot be completed before actual product placement. Even after the runtime-enabling subset is accepted, physical acceptance does not authorize installation or grant `approved_for_production`.
