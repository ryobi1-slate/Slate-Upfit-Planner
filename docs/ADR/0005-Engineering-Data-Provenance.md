# ADR 0005: Engineering Data Provenance

## Decision

Future vehicle, catalog, and package JSON documents must include `revision`, `source`, `approved_by`, and `last_verified` metadata using `data/engineering-data-schema.json`.

## Reason

Fitment correctness depends on traceable dimensions, weights, and compatibility rules. Unverified commercial data can produce confidently incorrect builds even when application code is correct.

## Tradeoffs

Data cannot be promoted anonymously or without review. Verification adds operational work and may delay catalog expansion.

## Future implications

CI will validate future engineering documents against their domain schema and provenance contract. v0.2.5 establishes the contract without adding or approving commercial data.
