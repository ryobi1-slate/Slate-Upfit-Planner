# Sprinter High-Roof Physical Verification

This controlled field package defines how to collect physical verification evidence for exactly:

- `sprinter-144-high-roof`
- `sprinter-170-high-roof`

It supplies a shop procedure, blank body-specific worksheets, and a blank external-photo index. It does not contain completed measurements, runtime geometry, or production approval.

## Release boundary

Both candidate geometry records remain `approved_for_planning`. **approved_for_planning does not authorize installation.** Accepted physical measurements may support a later narrow runtime design review, but acceptance does not change either record to `approved_for_production`.

**Accepted physical measurements do not grant `approved_for_production`.** No record in this package is approved for production. Production still requires VIN/configuration confirmation, payload review, installer or engineering review, acknowledgment of unresolved geometry, and placement-specific verification.

Runtime PR B remains blocked until the runtime-enabling subset has real measurements, evidence references, and review acceptance for both body IDs. Once that subset is accepted, a narrow runtime design review may begin. Production remains blocked after runtime work begins until every applicable production gate is satisfied.

## Runtime-enabling subset

Each body worksheet must contain reviewed and accepted evidence for:

- the `cargo_front` datum;
- partition presence and the applicable physical rear face;
- driver and passenger wheel-well X start and end;
- passenger sliding-door X start and end;
- driver and passenger rear usable boundaries;
- installed floor condition and thickness, or an explicit evidence-backed unmeasurable explanation;
- installed liner condition and thickness, or an explicit evidence-backed unmeasurable explanation; and
- visible major no-mount zones, or an evidence-backed statement that none were observed within the limited inspection scope.

PV-007 attachment structure remains placement-specific. PV-010 door/rear clearance remains placement-specific. PV-007 and PV-010 cannot be represented as complete before an actual product placement exists. They are not runtime-design prerequisites, but remain hard production gates.

## Measurement sessions

Use one eligible vehicle and one verification session per worksheet completion. Record the actual VIN last eight, configuration, partition, floor, and liner conditions. Establish and photograph the datum before measuring X coordinates. Record two observations for every numeric dimension and preserve both.

Do not average materially different observations. Mark the row `needs_recheck`, preserve the evidence, and repeat the controlled measurement. Do not invent an engineering tolerance.

## Photos and traceability

Photos remain outside Git. Each referenced image receives a unique evidence ID, stable logical archive locator, capture metadata, description, and SHA-256 after the image exists. Workstation-local paths are prohibited. A measurement cannot be accepted without its required evidence references.

## Review and correction

1. A measurer completes identity, observations, evidence references, and measurement status.
2. A reviewer checks vehicle eligibility, datum reproducibility, source meaning, observation agreement, and photos.
3. Rejected or unclear rows retain their original observations and become `needs_recheck` or `rejected`.
4. Corrections use a new verification session or documented worksheet revision; evidence is never silently overwritten.
5. Only reviewed rows with real evidence may become `accepted`.

The draft pull request containing these templates remains awaiting field measurements. Blank templates are not completed verification.
