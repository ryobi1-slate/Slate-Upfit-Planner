# Architecture

## Overview

Slate Upfit Planner is a standalone, independently versioned WordPress plugin.
It is the successor to the planner embedded in the Dealer Portal, which is now
frozen as the **legacy fallback**.

## Ownership boundary

**Slate Upfit Planner owns:**

- React planner UI and product shell
- Canvas / workspace
- Vehicle geometry
- Fitment engine and rules
- Build packages and templates
- Build sheet
- Saved planner configurations
- The normalized configuration schema

**Dealer Portal (host) owns:**

- Authentication
- Dealer identity and approval
- Pricing
- Quotes
- B2BKing
- Business Central handoff
- Ops handoff

The planner **never** calls Business Central, B2BKing, WooCommerce, or the
dealer identity system directly. Everything host-owned is reached through the
PHP host adapter.

## Communication paths

| Path                              | Mechanism                         |
| --------------------------------- | --------------------------------- |
| Browser → WordPress               | REST (`slate-upfit-planner/v1/*`) |
| WordPress (planner) → Host plugin | PHP `HostAdapterInterface`        |
| Browser → Host / Business Central | **not allowed**                   |

```
┌─────────────┐   REST    ┌────────────────────┐   PHP adapter   ┌──────────────┐
│  React app  │ ────────▶ │  Slate Upfit       │ ──────────────▶ │ Dealer Portal │
│ (browser)   │           │  Planner (WP PHP)  │                 │ (host)        │
└─────────────┘           └────────────────────┘                 └──────────────┘
                                   │                                     │
                                   ▼                                     ▼
                          Fitment / build sheet                Pricing / quotes /
                          (owned here)                          Business Central
```

## PHP structure

```
slate-upfit-planner.php        Plugin bootstrap + PSR-4 fallback autoloader
src/
  Plugin.php                   Boot, adapter resolution, assets, shortcode
  Integration/
    HostAdapterInterface.php   Host contract (6 methods)
    NullHostAdapter.php        Standalone/demo implementation
  Rest/
    RestController.php         Browser-facing REST endpoints
  Persistence/
    ConfigurationRepository.php Save boundary (schema-validated)
  Support/
    SchemaValidator.php        Structural payload validation
templates/
  planner-mount.php            Shortcode mount markup
data/
  configuration-schema.json    Canonical JSON schema (v1.0)
```

## Front-end structure

```
assets/src/
  main.tsx                     Browser entry (mounts React app)
  app/App.tsx                  Product shell composition
  components/                  TopNav, ConfigurationRail, CanvasWorkspace, BuildSheetRail
  components/canvas/           Interactive wall canvas:
                               WallCanvas, WallCanvasSvg, ZoneOverlay,
                               PlacementBlock, PlacementPreview, CanvasLegend, scale
  engine/                      Pure fitment engine — no React (geometry/fitment/payload)
  data/                        geometry.ts (Sprinter 144) + catalog.ts (Westcan shelves)
  hooks/                       usePlanner (engine ↔ dispatch bridge)
  services/                    bootstrap context, REST client
  state/                       useReducer + Context (actions, reducer, context)
  styles/                      Shell + canvas CSS (compiled to planner.css)
  types/                       Domain interfaces (framework-agnostic, inches)
```

## Build system

- React + TypeScript
- `@wordpress/scripts` (webpack) → WordPress-compatible compiled assets in
  `assets/dist/` (`planner.js`, `planner.css`, `planner.asset.php`)
- No Next.js, no Redux

State is `useReducer` + React Context. The reducer is pure, deterministic, and
serializable — it holds **no** geometry/validation logic. The hook layer
(`usePlanner`) calls the engine (snap, clamp, auto-placement, fitment) and
dispatches already-resolved values. Pixel conversion is isolated to
`components/canvas/scale.ts`; the canonical unit everywhere else is the inch, and
pixels never enter the normalized payload.

## Fitment engine + geometry

The interactive driver/passenger wall canvas and the fitment engine are the
core of Phase 2. See [fitment-engine.md](./fitment-engine.md) for the rules and
what was ported from the Claude reference, and [geometry-data.md](./geometry-data.md)
for the Sprinter 144 geometry and the fixed Westcan shelf catalog.

## Standalone / demo mode

When no host registers an adapter via the `slate_upfit_planner_host_adapter`
filter, the plugin uses `NullHostAdapter` and the shell renders in
**standalone** mode against fixed data (Sprinter 144 High Roof geometry + a
five-shelf Westcan catalog). This lets the planner be developed and demoed
without the Dealer Portal.

## Migration phases

See [migration-plan.md](./migration-plan.md).

## v0.2.5 hardening boundary

The hardening release adds no planner features. It makes the existing Phase 2
foundation enforceable through CI, schema-driven PHP validation, lightweight
REST/schema tests, consistent formatting, and architecture decisions.

`data/configuration-schema.json` is the structural source of truth. PHP loads
and interprets that schema; code adds only domain invariants not represented by
the schema, currently unique placement IDs. Future vehicle, catalog, and
package JSON files must use the provenance metadata contract in
`data/engineering-data-schema.json`.

Architecture decisions are recorded under [`docs/ADR`](./ADR/).
