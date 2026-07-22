# PR #15 Visual Review

- Pull request: `#15 — Align planner with Dealer Portal layout`
- Original reviewed commit: `4d2450f6bc7535bc40c5adab0985fe9ea5126d81`
- Base commit: `0cda3bcb1668ac45a43f45447d593d8945e8b8ba`
- Review scope: mobile containment correction and complete visual approval

## Original mobile defect

At 390 × 844, the vehicle metadata and planning warning collapsed into a very
narrow implicit grid column while the vehicle selector and wall tabs occupied a
second column. This made control copy appear clipped and produced an unusable
composition even though a true browser measurement reported no document or
planner-root scroll overflow.

The root cause was CSS specificity: the desktop selectors
`.sup-controls > .sup-field:first-of-type` and
`.sup-controls > .sup-field:last-of-type` retained their explicit grid columns
because they outranked the generic phone-width `.sup-controls > .sup-field`
reset. The 900px layout also retained column-three assignments for
`.sup-controls__change-note` and `.sup-controls__remaining`, creating an
unintended implicit third column at tablet width.

The originally supplied 390px capture also cropped a wider rendering viewport.
The replacement before capture and measurements below were taken with a verified
`window.innerWidth` of 390px.

## Selectors changed

- `.sup-page-header__description`
- `.sup-field`
- `.sup-vehicle-selector`
- `.sup-wall-tabs`
- `.sup-controls__change-note`
- `.sup-controls__remaining`
- phone-container rules for `.sup-shell`, `.sup-page-header > div`,
  `.sup-controls`, `.sup-catalog`, both exact `.sup-field` selectors,
  `.sup-panel__hint`, `.sup-planning-warning`, and `.sup-wall-tab`

The fix adds shrink constraints, makes narrow fields and control groups use the
available width, resets explicit grid rows/columns, and turns wall tabs into a
wrapping full-width segmented control. It does not use global
`overflow-x: hidden`.

## Before-and-after mobile measurements

Measured at 390 × 844 (`window.innerWidth = 390`, browser document client width
375 because of the visible scrollbar):

| Measurement | Before | After |
| --- | ---: | ---: |
| Document client / scroll width | 375 / 375px | 375 / 375px |
| Planner root client / scroll width | 359 / 359px | 359 / 359px |
| Controls grid tracks | 18px + 251px | 293px |
| Header description left / right / width | 24 / 351 / 327px | 24 / 351 / 327px |
| Vehicle selector left / right / width | 83 / 334 / 251px | 41 / 334 / 293px |
| Wall tabs left / right / width | 83 / 289.52 / 206.52px | 41 / 334 / 293px |
| Document-level horizontal overflow | 0px | 0px |
| Planner-root horizontal overflow | 0px | 0px |

The correction addresses layout clipping rather than masking it: all control
copy now has a usable track, and the selector and wall tabs span the full card
content width.

## Responsive browser results

| Viewport | Document overflow | Root overflow | Controls tracks | Canvas overflow |
| --- | ---: | ---: | --- | --- |
| 1440 × 900 | 0px | 0px | three compact columns | none |
| 1024 × 768 | 0px | 0px | three compact columns | none |
| 768 × 1024 | 0px | 0px | two columns | internal |
| 390 × 844 | 0px | 0px | one 293px column | internal |

At every viewport the browser state contained one valid driver-wall placement,
one selected product, a separate passenger-wall view, five catalog products,
and the complete plan summary.

## Screenshot evidence

All files are under
`docs/screenshots/dealer-portal-layout/pr15-mobile-fix/`.

- Before: `before-390x844-controls-measured.png`
- 1440 × 900: `after-1440x900-header-controls.png`,
  `after-1440x900-driver-selected.png`,
  `after-1440x900-passenger-zones.png`, `after-1440x900-catalog.png`, and
  `after-1440x900-summary.png`
- 1024 × 768: `after-1024x768-header-controls.png`,
  `after-1024x768-driver-selected.png`,
  `after-1024x768-passenger-zones.png`, `after-1024x768-catalog.png`, and
  `after-1024x768-summary.png`
- 768 × 1024: `after-768x1024-header-controls.png`,
  `after-768x1024-driver-selected.png`,
  `after-768x1024-passenger-zones.png`, `after-768x1024-catalog.png`, and
  `after-768x1024-summary.png`
- 390 × 844: `after-390x844-header-controls.png`,
  `after-390x844-driver-selected.png`,
  `after-390x844-passenger-zones.png`, `after-390x844-catalog.png`, and
  `after-390x844-summary.png`

## Completed visual approval checklist

- **Pass — Dealer Portal consistency:** page header, typography, flat cards,
  compact controls, Sage/Arches palette, restrained radii, and spacing remain
  aligned with the Portal reference.
- **Pass — Header and controls:** description wraps naturally; selector and wall
  tabs remain fully contained; touch targets remain usable.
- **Pass — Technical-plan hierarchy:** canvas remains the dominant desktop
  element with readable labels, dimensions, grid, line hierarchy, partition,
  wheel well, and remaining-length callouts.
- **Pass — Selected states:** the selected product uses a narrow Arches edge and
  border; the valid selected driver placement uses an Arches outline without
  overwhelming the technical drawing.
- **Pass — Passenger geometry:** the dedicated passenger screenshots clearly
  show the sliding-door, contoured no-mount, partition, and wheel-well zones.
- **Pass — Catalog:** all five product names remain readable without unnecessary
  clipping and all `Add to Plan` buttons use consistent sizing.
- **Pass — Summary:** catalog and plan summary are balanced in the desktop 2:1
  composition and stack in the intended order on narrow containers.
- **Pass — Responsive containment:** no document or planner-root horizontal
  overflow at any required viewport; the 640px technical canvas scrolls only
  inside `.sup-canvas__stage` at 768px and 390px.
- **Pass — Density:** no excessive empty margins; desktop space remains focused
  on the plan and narrow layouts preserve readable headings and labels.
- **Pass — Page hierarchy:** duplicate app navigation and Standalone Demo
  treatment remain absent.

## Dealer Portal references

- `assets/css/slate-design-tokens.css`
- `assets/css/slate-portal.css` (`.slate-page`, `.slate-page-header`,
  `.slate-page-title`, `.slate-page-description`, `.slate-card`, form controls,
  buttons, and responsive grids)
- `templates/products.php`
- `includes/ui/layout-shell.php`
- `includes/ui/topbar.php`
- `includes/ui/sidebar.php`

The Dealer Portal repository was used read-only and remains unmodified.

## Accepted limitations

- The planner renders one active wall at a time, so the selected driver
  placement and passenger sliding-door geometry are documented in separate
  screenshots.
- The SVG intentionally retains a 640px minimum. Tablet and phone screenshots
  therefore show its internal horizontal scrollbar rather than shrinking
  technical labels below a readable scale.
- Complete evidence uses multiple viewport-height screenshots so the header,
  canvas states, catalog, and summary remain legible at their actual sizes.

## Validation

- Lint: passed
- TypeScript typecheck: passed
- JavaScript: 10 suites and 113 tests passed
- PHP schema and REST: 17 tests passed
- PHP syntax: 11 files passed
- Production build: passed twice
- Generated assets: byte-stable across consecutive builds
- `package-lock.json`: unchanged
- `git diff --check`: passed
- Responsive browser measurements: passed at all four required viewports

## Recommendation

**Ready for user visual approval.** The mobile correction is narrowly scoped,
the full visual checklist passes, and no planner logic or external system
behavior changed.
