# Slate Upfit Planner

Standalone WordPress plugin for commercial van fitment planning, canvas,
build-sheet generation, saved configurations, and host-integrated quote handoff.
It is the successor to the Dealer Portal embedded configurator, which is now
frozen as the legacy fallback.

## Ownership boundary

This plugin owns:

- Planner UI, product shell, and canvas
- Vehicle geometry and the fitment engine
- Build packages and templates
- Saved planner configurations
- Build sheet and payload calculations
- The versioned normalized configuration schema

The host **Dealer Portal** owns:

- Authentication and dealer identity
- Pricing and quotes
- B2BKing, Business Central, and Ops handoff

Communication: browser ↔ WordPress over **REST**; planner ↔ host over the PHP
**`HostAdapterInterface`**. The planner never calls Business Central directly.

## Usage

Add the planner to any page with the shortcode:

```
[slate_upfit_planner]
```

With no host adapter registered, the planner runs in **standalone / demo** mode
against placeholder data.

## Development

```bash
composer install      # optional; a PSR-4 fallback autoloader runs without it
npm install
npm run build         # compiles assets/src/main.tsx -> assets/dist/
npm run start         # watch mode
npm run typecheck     # tsc --noEmit
npm run lint          # wp-scripts lint-js
npm test              # engine smoke tests
```

Build system: React + TypeScript + `@wordpress/scripts` (webpack). No Next.js,
no Redux. State is `useReducer` + React Context.

## Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/host-adapter-contract.md](docs/host-adapter-contract.md)
- [docs/configuration-schema.md](docs/configuration-schema.md)
- [docs/migration-plan.md](docs/migration-plan.md)

## Development status

Phase 2: interactive driver/passenger **wall canvas** and a real, typed
**fitment engine** over real Sprinter 144 geometry and a fixed Westcan shelf
catalog — select, preview, place, drag (1" snap), validate, and remove, with
build-sheet totals and payload. Pricing, quotes, persistence, host adapter,
Business Central, and roof/floor/rear planners are migrated in later phases (see
[docs/migration-plan.md](docs/migration-plan.md), [docs/fitment-engine.md](docs/fitment-engine.md),
and [docs/geometry-data.md](docs/geometry-data.md)).
