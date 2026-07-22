# PR #16 correction review

## Reviewed state

- Pull request: `#16 — Restore full technical van planner design`
- Base before correction: `a9877adbc2c41ff2d6ddfa6b0d79f2981798f791`
- Head before correction: `7d6c2d6156f41ff78d14b0fbf06e608957398d6c`
- Branch: `design/restore-original-technical-planner`
- Review date: 2026-07-22
- Final recommendation: **Ready for user approval**

The correction remained visual/canvas-interaction scoped. Vehicle data, catalog data, fitment and collision rules, REST/PHP behavior, payload/VIN behavior, and commercial integrations were not changed.

## Original findings and corrections

### 1. Passive hover changed planner state

**Root cause:** `FullPlanCanvas.capture()` dispatched `SWITCH_WALL` for every `pointermove`. The reducer clears `selectedPlacementId` and preview state for that action, and `activeWall` also controls the destination used by one-click Add.

**Before:** Merely moving across the combined plan could clear selection and silently retarget Add to Plan.

**After:**

- `hoveredWall` is local presentation state in `FullPlanCanvas`.
- Pointer movement updates `.sup-plan-wall-capture.is-hovered` and, when a product is armed, the explicit wall preview.
- Pointer movement never calls `switchWall`.
- Intentional lane clicks still call `switchWall(wall)` and commit through `placeSelected(wall, ...)`.
- Wall controls and one-click Add retain their existing active-wall behavior.

Components/selectors changed:

- `assets/src/components/canvas/FullPlanCanvas.tsx` — `capture()`, `hoveredWall`
- `.sup-plan-wall-capture.is-hovered`

### 2. Verified passenger contoured no-mount zone was absent

**Root cause:** The combined plan rendered `passenger.partition` but never iterated over the non-partition entries in `passenger.blockedZones`.

**Before:** Only the 0–8 inch partition was visible even though the legend advertised a no-mount zone.

**After:** Every production passenger `blockedZones` entry with `kind === "no-mount"` is rendered from its model `from`/`to` values. The verified 8–20 inch contoured-partition stay-clear span is hatched and labeled while the 0–8 inch factory partition remains distinct.

Components/selectors changed:

- `assets/src/components/canvas/FullPlanCanvas.tsx` — `passengerNoMountZones`, `.sup-zones`
- `.sup-plan-no-mount`

### 3. Driver wheel well reused passenger geometry

**Root cause:** One `passenger.wheelWells[0]` object rendered both walls.

**Before:** Current drawings happened to be correct because both production walls currently share the same numbers, but the driver source was bypassed.

**After:** Passenger wells map from `passenger.wheelWells`; driver wells map independently from `driver.wheelWells`. Multiple entries are supported on either wall. Each rendered well records its source wall and production range for testability.

Components/selectors changed:

- `assets/src/components/canvas/FullPlanCanvas.tsx` — `passengerWheels`, `driverWheels`
- `.sup-plan-wheel`
- `[data-wheel-wall="passenger"]`, `[data-wheel-wall="driver"]`

### 4. Conflict overlap was not visually explicit

**Root cause:** `PlanPlacement` received only overall severity and therefore could not draw authoritative issue ranges.

**Before:** Selected and conflicting placements were differentiated mainly by similar warm-colored outlines, while the legend promised a hatched fit-conflict treatment.

**After:**

- `PlanPlacement` receives the complete `FitmentResult`.
- Error issues with an authoritative `range` render a Redwood hatch over the exact intersection with the placement.
- Warning ranges use a lighter warning overlay, not the blocking hatch.
- Errors without a range retain whole-placement error fallback styling.
- Selected placements keep the Arches outline and handles even when a conflict or warning is also present.

Components/selectors changed:

- `assets/src/components/canvas/FullPlanCanvas.tsx` — `PlanPlacement`, `supPlanConflictHatch`
- `.sup-plan-placement__conflict`
- `.sup-plan-placement__warning-overlap`
- `.sup-plan-placement--selected.sup-plan-placement--error .sup-plan-placement__body`
- `.sup-plan-placement--selected.sup-plan-placement--warning .sup-plan-placement__body`

## Automated tests added

`tests/fullPlanCanvas.test.tsx` now verifies:

1. The production passenger 8–20 inch no-mount zone is rendered.
2. Passive passenger-lane pointer movement preserves the selected placement.
3. Passive pointer movement leaves Driver Wall active.
4. Add to Plan still places on the intentionally selected active wall after passive hover.
5. An intentional passenger-lane click places on passenger and activates that wall.
6. Artificially distinct driver/passenger wheel ranges render from their respective wall objects.
7. A ranged door conflict renders `.sup-plan-placement__conflict` with `DOOR_CONFLICT`.
8. Selected styling remains present concurrently with error styling.
9. A wheel-well warning renders `.sup-plan-placement__warning-overlap` without the error hatch.

The existing one-click Add, canvas placement, keyboard movement, Delete removal, geometry, fitment, collision, PHP, and responsive suites remain green.

## Screenshots

Updated:

- `docs/screenshots/original-technical-plan/1440x900-full-plan.png`
- `docs/screenshots/original-technical-plan/1024x768-full-plan.png`
- `docs/screenshots/original-technical-plan/768x1024-full-plan.png`
- `docs/screenshots/original-technical-plan/390x844-full-plan.png`
- `docs/screenshots/original-technical-plan/selected-placement.png`
- `docs/screenshots/original-technical-plan/passenger-door-conflict.png`
- `docs/screenshots/original-technical-plan/wheel-well-warning.png`
- `docs/screenshots/original-technical-plan/product-library-and-summary.png`

Added:

- `docs/screenshots/original-technical-plan/390x844-mobile-catalog.png`
- `docs/screenshots/original-technical-plan/390x844-selected-placement.png`

The desktop plan shows driver and passenger placements, the 8–20 inch stay-clear zone, both wall-specific wheel wells, and restrained Arches selection. The conflict capture shows the exact door-overlap hatch together with the selected outline. The warning capture uses a non-blocking warning overlay. Mobile evidence shows readable full product names, fully visible Add to Plan buttons, contained controls, the placed count, and a centered selected placement.

## Responsive measurements

Browser viewport dimensions include browser chrome/scrollbar subtraction in the captured content area.

| Requested viewport | Document client / scroll width | Planner root client / scroll width | Canvas stage client / scroll width | Result |
| --- | --- | --- | --- | --- |
| 1440 × 900 | 1425 / 1425 | 1425 / 1425 | 1309 / 1309 | No document or root overflow; full wide plan visible. |
| 1024 × 768 | 1009 / 1009 | 1009 / 1009 | 893 / 920 | No document or root overflow; 27px remains inside the canvas scroller. |
| 768 × 1024 | 753 / 753 | 753 / 753 | 653 / 920 | No document or root overflow; canvas overflow remains internal. |
| 390 × 844 | 375 / 375 | 375 / 375 | 307 / 920 | No document or root overflow; canvas overflow remains internal. |

At 390 × 844, the selected shelf occupied horizontal coordinates 124.9–247.3 inside the visible stage coordinates 33–342 after auto-centering (`scrollLeft: 610`).

## Validation

- Lint: pass
- TypeScript typecheck: pass
- JavaScript: 11 suites, 120 tests passed
- PHP schema/REST: 17 passed
- PHP syntax: 11 files passed
- Production build: passed twice
- Generated assets: byte-stable across both builds
- `package-lock.json`: unchanged
- `git diff --check`: pass

Generated asset version: `bae8dd00c6ccc34b6fe8`.

## Accepted limitations

- The technical SVG intentionally retains a 920px minimum width for legibility. Tablet and mobile use an internal horizontal canvas scroller rather than shrinking dimension and placement labels below readable sizes.
- A 390px screenshot can show only a slice of the full plan; the selected-placement capture demonstrates automatic centering, while the mobile catalog capture separately demonstrates product-action usability.
- The no-mount span is rendered using the verified along-wall blocked range available in production geometry. No additional curve dimensions were inferred.

## Recommendation

**Ready for user approval.** The four original findings are resolved with focused canvas/UI changes, automated coverage, production-generated assets, and responsive visual evidence. PR #16 should remain draft until the user completes visual approval.
