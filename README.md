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
against the fixed Phase 2 Sprinter 144 geometry and shelf fixtures.

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

The supported quality gate is:

```bash
npm install
npm run build
npm run lint
npm run typecheck
npm test
git diff --check
```

GitHub Actions runs the build, lint, typecheck, JavaScript/PHP tests, PHP syntax,
and whitespace checks on every push and pull request.

Build system: React + TypeScript + `@wordpress/scripts` (webpack). No Next.js,
no Redux. State is `useReducer` + React Context.

## Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/host-adapter-contract.md](docs/host-adapter-contract.md)
- [docs/configuration-schema.md](docs/configuration-schema.md)
- [docs/phase-3-knowledge-layer.md](docs/phase-3-knowledge-layer.md)
- [docs/migration-plan.md](docs/migration-plan.md)
- [docs/ADR](docs/ADR)

## Development status

- **Phase 1 — complete:** standalone plugin, React/TypeScript shell, REST and
  host-adapter boundaries, reducer state, and schema 1.0.
- **Phase 2 — complete:** interactive driver/passenger canvas, Sprinter 144
  geometry, pure fitment engine, normalized payloads, and engine tests.
- **v0.2.5 — hardening:** reproducible quality gates, CI, schema-driven server
  validation, REST/schema fixtures, provenance contract, ADRs, and normalized
  formatting. No planner features or commercial data are added.
- **Phase 3 — foundation in progress:** versioned knowledge schemas, read-only
  repositories, integrity validation, and configuration migration. All included
  records are draft fixtures; no approved commercial data is included.

Phase 2: interactive driver/passenger **wall canvas** and a real, typed
**fitment engine** over real Sprinter 144 geometry and a fixed Westcan shelf
catalog — select, preview, place, drag (1" snap), validate, and remove, with
build-sheet totals and payload. Pricing, quotes, persistence, host adapter,
Business Central, and roof/floor/rear planners are migrated in later phases (see
[docs/migration-plan.md](docs/migration-plan.md), [docs/fitment-engine.md](docs/fitment-engine.md),
and [docs/geometry-data.md](docs/geometry-data.md)). Pricing, persistence,
quotes, Dealer Portal integration, and Business Central remain outside v0.2.5.
