# Configuration Schema

The planner exchanges a single **versioned normalized payload** with WordPress
REST and the host adapter. It is the source of truth for save and quote handoff.

- Canonical JSON Schema: [`data/configuration-schema.json`](../data/configuration-schema.json)
- TypeScript type: `ConfigurationPayload` in `assets/src/types/index.ts`
- PHP validator: `Slate\UpfitPlanner\Support\SchemaValidator`

Current version: **`1.0`**.

## Shape

```json
{
  "schema_version": "1.0",
  "configuration_id": null,
  "vehicle": {},
  "placements": [],
  "infrastructure": [],
  "exterior_equipment": [],
  "validation": [],
  "totals": {},
  "dealer_notes": ""
}
```

## Fields

| Field | Type | Notes |
| --- | --- | --- |
| `schema_version` | `"1.0"` | Bumped on breaking changes. |
| `configuration_id` | `string \| null` | Host/local id once saved; `null` while unsaved. |
| `vehicle` | object | `{ id, name, wheelbase, wall }`. |
| `placements` | array | Placed components: `{ id, sku, wall, position }`. `position.x` is **inches from the front** along the wall; `position.y` is the height offset from the floor (0 for Phase 2 floor-standing shelves). Coordinates are engineering inches — never pixels. |
| `infrastructure` | array | Electrical/power/structural items (empty through Phase 2). |
| `exterior_equipment` | array | Exterior-mounted equipment (empty through Phase 2). |
| `validation` | array | Fitment issues: `{ code, severity, message, placement_id? }`. |
| `totals` | object | `{ wall_usage, payload, package_value }`. |
| `dealer_notes` | string | Free text, ≤ 5000 chars. |

Field names are `snake_case` to match the JSON schema and the PHP boundary. The
TypeScript layer mirrors these names on the payload type even though it uses
`camelCase` internally elsewhere.

## Validation

Validation runs **before** any save or quote handoff, in two places that must
agree:

1. **Client** — `buildNormalizedPayload()` assembles the payload and embeds the
   engine's `validation` results.
2. **Server** — `SchemaValidator::validate()` structurally checks required keys,
   the `schema_version` constant, and field types. `RestController` rejects
   invalid payloads with HTTP `422` before calling the repository or host.

A payload is considered valid when `SchemaValidator::validate()` returns an empty
error list.

## Versioning policy

- Additive, backward-compatible changes keep the same `schema_version`.
- Any change that removes/renames a field or changes its meaning bumps the
  version. Consumers should reject unknown major versions rather than guess.
