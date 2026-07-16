# Configuration Schema

The planner exchanges a single **versioned normalized payload** with WordPress
REST and the host adapter. It is the source of truth for save and quote handoff.

- Versioned JSON Schemas: [`data/schemas/`](../data/schemas)
- TypeScript type: `ConfigurationPayload` in `assets/src/types/index.ts`
- PHP validator: `Slate\UpfitPlanner\Support\SchemaValidator`

Supported versions: **`1.0`** and **`1.1`**. New Phase 3 configurations use
1.1; 1.0 remains valid for v0.2.5 compatibility.

The PHP `SchemaValidator` uses `SchemaRegistry` to select the contract version.
Structural
rules belong in the JSON Schema instead of being duplicated in PHP. Placement
ID uniqueness remains a domain check because base JSON Schema cannot express
uniqueness by one object field.

Schema 1.0 rejects unsupported versions, walls outside `driver`/`passenger`,
unknown Phase 2 SKUs, malformed or negative coordinates, extra object fields,
and duplicate placement IDs.

Schema 1.1 keeps those placement fields, changes `sku` to a nonempty string,
and adds pinned geometry/catalog revisions, package origin and divergence,
unplaced items, and engineering-data resolution status. SKU existence is a
repository/domain rule rather than a hard-coded schema enum.

The 1.0-to-1.1 migration preserves IDs and inch coordinates. Revisions that
cannot be proven are explicitly unresolved; approval is never inferred.

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

| Field                | Type             | Notes                                                                                                                                                                                                                                                   |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema_version`     | `"1.0"`          | Bumped on breaking changes.                                                                                                                                                                                                                             |
| `configuration_id`   | `string \| null` | Host/local id once saved; `null` while unsaved.                                                                                                                                                                                                         |
| `vehicle`            | object           | `{ id, name, wheelbase, wall }`.                                                                                                                                                                                                                        |
| `placements`         | array            | Placed components: `{ id, sku, wall, position }`. `position.x` is **inches from the front** along the wall; `position.y` is the height offset from the floor (0 for Phase 2 floor-standing shelves). Coordinates are engineering inches — never pixels. |
| `infrastructure`     | array            | Electrical/power/structural items (empty through Phase 2).                                                                                                                                                                                              |
| `exterior_equipment` | array            | Exterior-mounted equipment (empty through Phase 2).                                                                                                                                                                                                     |
| `validation`         | array            | Fitment issues: `{ code, severity, message, placement_id? }`.                                                                                                                                                                                           |
| `totals`             | object           | `{ wall_usage, payload, package_value }`.                                                                                                                                                                                                               |
| `dealer_notes`       | string           | Free text, ≤ 5000 chars.                                                                                                                                                                                                                                |

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
