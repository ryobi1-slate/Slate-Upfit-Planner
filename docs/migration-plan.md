# Migration Plan

Moving from the Dealer Portal embedded planner (now the frozen legacy fallback)
to the standalone Slate Upfit Planner plugin, in controlled phases with a
rollback path at every step.

## Guiding principles

- The legacy embedded configurator stays live and unchanged as the fallback
  until the standalone planner reaches parity and confidence.
- Do **not** modify the Dealer Portal repo during early phases.
- Do **not** port pricing, quote logic, persistence, or Business Central
  integration into the planner. Those remain host-owned behind the adapter.
- Every phase is independently shippable and reversible.

## Phase 1 — Scaffold (done)

- Standalone plugin skeleton, build system (React + TypeScript +
  `@wordpress/scripts`), and WordPress mount (`[slate_upfit_planner]`).
- Product shell UI (top nav, config rail, canvas, build-sheet rail) against
  **placeholder** data.
- Pure fitment engine **boundary** (interfaces + placeholder functions), kept
  independent of React.
- State via `useReducer` + Context.
- Formalized `HostAdapterInterface` (6 methods) + `NullHostAdapter`.
- Versioned normalized schema (`1.0`) with client + server validation.
- Standalone/demo mode.

**Out of scope for Phase 1:** real catalog data, full Claude planner logic,
pricing, quotes, server-backed persistence, Business Central.

## Phase 2 — Port the canvas + fitment engine (this phase)

Combined the interactive canvas and the fitment/geometry port (per the Phase 2
handoff package).

- Interactive **driver/passenger wall canvas** (`components/canvas/`): select
  product, ghost preview, click-to-place, select, drag with 1" snap, remove,
  wall switch preserving each wall's layout, keyboard nudge/remove, and
  valid/warning/conflict states.
- Real **fitment engine** (pure TS) behind the stable boundary
  (`findOpenPlacement`, `validatePlacement`, `calculateWallUsage`,
  `calculatePayload`, `buildNormalizedPayload` + helpers), ported from the Claude
  `issues()` / `findSpot()` reference. See [fitment-engine.md](./fitment-engine.md).
- Real **Sprinter 144** geometry (Standard + High Roof) and a fixed five-shelf
  Westcan catalog in version-controlled TS. See [geometry-data.md](./geometry-data.md).
- Payload core (driver/passenger weight sum; `remaining = capacity − weight`).
- Engine + interaction-flow unit tests.

**Out of scope for Phase 2:** pricing, persistence, quote handoff, Business
Central, roof/floor/rear planners, infrastructure systems, host adapter.

## Phase 3 — Broaden geometry + packages

- Add remaining vehicles (170"/EWB, Metris) and non-shelf placement modes behind
  the same engine boundary; build packages / templates.

## Phase 4 — Versioned data

- Move vehicle geometry, walls, catalog, and packages into versioned data files
  under `data/`, sourced through the host catalog context where entitlement
  applies.

## Phase 5 — Persistence

- Implement server-backed saved configurations in `ConfigurationRepository`
  (ownership, revisions), still schema-validated before write.

## Phase 6 — Host adapter + quote handoff

- Implement the Dealer Portal `HostAdapterInterface` adapter.
- Wire `saveConfiguration` / `addConfigurationToQuote` through REST → adapter →
  host quote system (B2BKing / Business Central handoff stays host-side).

## Phase 7 — Parity testing

- Run the standalone planner side-by-side with the legacy embedded configurator.
- Compare fitment results, build sheets, and payloads for representative builds.

## Phase 8 — Cutover

- Switch `/configurator/` to the standalone plugin once parity + rollback
  confidence is established.

## Phase 9 — Decommission

- Remove the embedded planner from the Dealer Portal only after sustained
  rollback confidence.
