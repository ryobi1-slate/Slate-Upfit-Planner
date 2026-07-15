# Fitment Engine

Pure TypeScript, framework-agnostic. Lives in `assets/src/engine/` and is
consumed by the state/hook layer and the canvas. No React, no DOM, no pixels —
all coordinates are **inches along the wall, measured from the front** of the
cargo area.

Ported from the Claude reference (`App.jsx` `issues()` / `findSpot()` and the
drag-clamp logic in `VanCanvas(H).jsx`), re-homed into typed, tested modules.

## Modules

| File                 | Exports                                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine/geometry.ts` | `getPlacementBounds`, `overlaps`, `getHardBlocks`, `intersectsBlockedZone`, `edgeInsideWheelWell`, `snapToIncrement`, `clampPlacement`, `findOpenPlacement`, `getOpenRuns`, `getRemainingWallLength`, `calculateWallUsage` |
| `engine/fitment.ts`  | `validatePlacement`, `checkPlacement`, `validateConfiguration`, `toFitmentResult`                                                                                                                                          |
| `engine/payload.ts`  | `calculatePayload`, `calculateTotals`, `buildNormalizedPayload`                                                                                                                                                            |

## Core functions

- **`findOpenPlacement(component, wall, placements, bySku)`** — scans from the
  partition to the rear at 1" increments, skipping hard blocks and positions
  whose leading/trailing edge would land inside a wheel well. Returns the first
  legal `{x, y}` or `null`. (Reference: `findSpot()`.)
- **`validatePlacement(placement, component, vehicle, wall, placements, bySku)`**
  — returns `FitmentIssue[]`; empty means clean. (Reference: `issues()`.)
- **`clampPlacement(pos, component, wall)`** — snaps to 1" and clamps to
  `[partition, length − component.length]`. Used for drag + keyboard nudge.
- **`calculateWallUsage` / `calculatePayload` / `buildNormalizedPayload`** —
  build-sheet totals and the versioned normalized payload.

## Validation rules → codes

| Rule                                         | Code                   | Severity    |
| -------------------------------------------- | ---------------------- | ----------- |
| Roof/vehicle incompatibility                 | `INCOMPATIBLE_VEHICLE` | error       |
| Wrong wall for the component                 | `INCOMPATIBLE_WALL`    | error       |
| Starts before the partition (front boundary) | `STARTS_IN_PARTITION`  | error       |
| Extends past the rear boundary               | `EXCEEDS_CARGO`        | error       |
| Overlaps a no-mount / contoured zone         | `BLOCKED_ZONE`         | error       |
| Blocks the sliding-door opening              | `DOOR_CONFLICT`        | error       |
| Front edge lands inside a wheel well         | `WHEEL_WELL_START`     | **warning** |
| Back edge lands inside a wheel well          | `WHEEL_WELL_END`       | **warning** |
| Overlaps another shelf on the same wall      | `SHELF_COLLISION`      | error       |

**Wheel wells are soft.** A shelf may _span_ a wheel well; only its endpoints
may not land inside one. This mirrors how dealers mount a single long shelf over
an arch, and matches the reference behavior. A span-only wheel-well condition is
a warning, not a blocker.

`toFitmentResult(issues)` rolls a list into `{ ok, severity, issues }` where
`severity` is the worst of the issues (`error` > `warning` > `ok`).

## Ported vs. changed

| Claude reference                     | Production implementation                      | Notes                                                                                                                                                                        |
| ------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `issues()` (string reasons + `code`) | `validatePlacement()` → typed `FitmentIssue[]` | Same rules; codes normalized to a typed union; each issue carries an inch `range` for canvas highlighting.                                                                   |
| `findSpot()`                         | `findOpenPlacement()`                          | Same scan; returns `null` instead of falling back to the partition when nothing fits (the caller decides).                                                                   |
| drag clamp in `VanCanvas(H)`         | `clampPlacement()` + `snapToIncrement()`       | Extracted to pure helpers; identical `max(partition, min(length−len, round(pos)))`.                                                                                          |
| `computePayload()`                   | `calculatePayload()`                           | Driver/passenger weight-sum core only. Roof/rear CG bias, infrastructure and accessory weight deltas are **out of Phase 2 scope**. `remaining = capacity − componentWeight`. |
| `catalogFitment()` badge             | `checkPlacement()` → `FitmentResult.severity`  | A single wheel-well warning is `warning`; anything else with an error is `error`.                                                                                            |

## Boundary rules

- Functions are **independent of React** and take plain data.
- Geometry/validation is **not** in the reducer. The hook layer
  (`hooks/usePlanner.ts`) calls the engine and dispatches already-resolved
  values, keeping reducer transitions deterministic and serializable.
- Pixel conversion happens only in `components/canvas/scale.ts`; engineering
  inches never leak pixels into the payload.
