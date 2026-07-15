# Phase 3 Commercial Knowledge Layer Foundation

PR A establishes contracts and read-only indexing only. It contains **no
approved commercial or engineering data**. Every record under `data/fixtures/`
is a draft test fixture and is not production-selectable.

## Version boundaries

`schema_version` identifies a document contract. `record_revision` identifies a
revision of one record under that contract. Vehicle geometry also has an
explicit `geometry_revision`, while products and packages have their own data
revisions. These values are not interchangeable.

## Approval and provenance

Records move through `draft`, `verified`, `approved`, `deprecated`, or
`rejected`. Approved records require a source reference and retrieval date,
preparer, verifier, approver, and last-verification date. Pending engineering
measurements use `null`; zero is never an unknown-value marker.

## Repositories

Domain repositories accept parsed records by constructor injection. They do no
disk, REST, browser, clock, or random work. Inputs are defensively copied and
frozen. Default listing returns approved records only; explicit state filters
support development and tests. Exact ID/revision lookup retains deprecated
records for historical configurations.

Cross-repository integrity validation rejects missing vehicle, geometry,
product, rule, and package references. Compatibility evaluation and package
preload are intentionally deferred.

## Geometry revisions

Configurations pin the geometry revision used for fitment. A later geometry
revision must trigger explicit revalidation; it must not silently move saved
placements. Historical revisions remain resolvable while referenced.

## Configuration migration

The deterministic 1.0-to-1.1 migration preserves configuration, vehicle,
placement, SKU, wall, and inch-coordinate identity. Because schema 1.0 did not
prove engineering revisions, migration sets geometry and catalog revisions to
unresolved, emits stable warnings, sets `package_origin` to `null`, and adds an
empty `unplaced_items` list. It never infers approval or mutates its input.
