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

| Path | Mechanism |
| --- | --- |
| Browser → WordPress | REST (`slate-upfit-planner/v1/*`) |
| WordPress (planner) → Host plugin | PHP `HostAdapterInterface` |
| Browser → Host / Business Central | **not allowed** |

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
  engine/                      Pure fitment engine (no React)
  data/                        Placeholder catalog + starting build
  hooks/                       usePlanner
  services/                    bootstrap context, REST client
  state/                       useReducer + Context (actions, reducer, context)
  styles/                      Shell CSS (compiled to planner.css)
  types/                       Domain interfaces (framework-agnostic)
```

## Build system

- React + TypeScript
- `@wordpress/scripts` (webpack) → WordPress-compatible compiled assets in
  `assets/dist/` (`planner.js`, `planner.css`, `planner.asset.php`)
- No Next.js, no Redux

State is `useReducer` + React Context. The reducer is pure and consults the
engine for geometry; side effects (REST) live in services/hooks.

## Standalone / demo mode

When no host registers an adapter via the `slate_upfit_planner_host_adapter`
filter, the plugin uses `NullHostAdapter` and the shell renders in
**standalone** mode against placeholder data (Sprinter 144, driver wall, three
shelf SKUs). This lets the planner be developed and demoed without the Dealer
Portal.

## Migration phases

See [migration-plan.md](./migration-plan.md).
