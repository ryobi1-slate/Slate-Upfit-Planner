# Geometry Data

Version-controlled vehicle geometry lives in `assets/src/data/geometry.ts`. It
is fixed engineering data — **not** WordPress-editable. The Phase 2 slice is the
Mercedes **Sprinter 144" WB** (Standard + High Roof).

Source of truth: the Westcan "Mercedes Sprinter + Metris Aluminum Product Guide"
zone letters (A..L), resolved from the reference `mkVan()` for the 144" chassis
with the 2500/RWD chassis.

## Units

All values are **inches** (canonical), except `payloadCapacity` which is
**pounds**. Along-wall positions are measured from the front of the cargo area.

## Zone letters used

| Letter | Meaning                               | 144" value                       |
| ------ | ------------------------------------- | -------------------------------- |
| B      | Interior width                        | 61.125" → **61"**                |
| H      | Partition zone (front reserve)        | 7.5" → **8"**                    |
| I      | Available cargo (partition→rear)      | ~116.4" (HR) / ~117.1" (STD)     |
| K      | Partition → wheel well                | ~63.1" (HR) / ~63.6" (STD)       |
| E      | Wheel-well length                     | **36.5"**                        |
| G      | Sliding-door opening                  | 51.75" → **52"**                 |
| L      | Contoured partition inset (passenger) | 12.125" → **12"**, 5" stay-clear |

Cargo length = round(H + I) → **124"** (High Roof) / **125"** (Standard Roof).
Wheel-well intrusion depth = (width − wheelhouseWidth)/2 for the 2500 (wheelhouse
53") ≈ **4"**.

## Resolved walls

Both walls share `partition = 8"` and a wheel well at `71"` → `107"` (HR) /
`108"` (STD), depth 4".

**Driver wall** — partition reserve + wheel well. No side door.

**Passenger (curb) wall** — partition reserve, a contoured no-mount inset
(`8"→20"`, 5" stay-clear), the **sliding-door opening** (`8"→60"`, a hard
block), and the wheel well. The door dominates the front half, so the passenger
wall is effectively mountable from ~60" to the rear.

## Vehicles

| id                 | Roof     | Length | Width | Payload |
| ------------------ | -------- | ------ | ----- | ------- |
| `sprinter-144-hr`  | high     | 124"   | 61"   | 4211 lb |
| `sprinter-144-std` | standard | 125"   | 61"   | 4211 lb |

The High Roof is the default demo vehicle. Both share identical wall geometry;
they differ only in roof height, which gates component compatibility (the 62"H
shelves fit High Roof only — selecting the Standard Roof flags them
`INCOMPATIBLE_VEHICLE`).

## Catalog

`assets/src/data/catalog.ts` — a fixed slice of five real Westcan high-roof
shelves (62" H, 3-tier), 24 / 36 / 48 / 60 / 72". Depth 16.125". Weight from the
reference model `round(length·1.7 + 3·14)`. **Pricing is intentionally omitted**
in Phase 2 (host-owned).

| SKU     | Length | Weight |
| ------- | ------ | ------ |
| 22-3436 | 24"    | 83 lb  |
| 22-3437 | 36"    | 103 lb |
| 22-3438 | 48"    | 124 lb |
| 22-3439 | 60"    | 144 lb |
| 22-3440 | 72"    | 164 lb |

## Adding geometry later

New vehicles are added as `VehicleGeometry` entries built from their zone
letters. Wall geometry stays fixed engineering data; catalog/pricing move to
REST/host hydration in a later phase (see the migration plan).
