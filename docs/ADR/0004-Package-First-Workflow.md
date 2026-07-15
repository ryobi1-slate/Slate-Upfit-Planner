# ADR 0004: Package-First Workflow

## Decision

Phase 3 will introduce packages as versioned configuration templates that preload components through the same compatibility and fitment engine used for manual placement.

## Reason

Commercial users typically begin with a trade solution and adjust it, rather than designing every build from an empty vehicle. One engine avoids separate package and manual-fitment truth.

## Tradeoffs

Templates need revision tracking, deterministic placement, and clear reporting of unplaced required items. User edits can cause a configuration to diverge from its source package.

## Future implications

Packages do not own dealer pricing and are not quotes. This ADR establishes direction only; v0.2.5 adds no package definitions, catalog data, or package UI.
