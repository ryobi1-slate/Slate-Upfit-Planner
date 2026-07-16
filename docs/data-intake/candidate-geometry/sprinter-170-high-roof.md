# sprinter-170-high-roof

- geometry_record_id: `geometry-candidate-sprinter-170-high-roof-1`
- body_id: `sprinter-170-high-roof`
- model_year_applicability: `2019-2027 controlled carryover`
- wheelbase: `170 in`
- roof: `high`
- body_variant: `cargo_van`
- evidence_state: `derived_conservative`
- operational_approval_level: `approved_for_planning`
- source_ids: `SRC-004; SRC-005; SRC-007; SRC-010`
- prepared_by: `Slate engineering data intake`
- verified_by:
- approved_by:
- record_revision: `1`
- geometry_revision: `candidate-1`
- change_summary: `Initial source-preserving conservative planning geometry.`

> **approved_for_planning does not authorize installation.**

## Warning labels

- Candidate geometry
- Verify before production
- VIN payload required
- Supplier applicability carried forward
- Physical fitment review required

## Normalized dimensions

| Field | Planning value (in) | Rule | Original source-value references |
| --- | ---: | --- | --- |
| `usable_wall_height` | 72 | `lowest_credible_supported_value` | SRC-005:74.75; SRC-007:72; SRC-004:79 interior |
| `overall_rear_width` | unresolved | `unsupported_or_unclear_datum` | SRC-005:61.125 van depth; SRC-007:70 max/61 floor; SRC-004:70 max |
| `space_between_wheel_wells` | 53 | `single_source_candidate` | SRC-007:53; SRC-004:53 |
| `wheel_well_length` | 36.5 | `largest_credible_obstruction` | SRC-005:36.5; SRC-007:36 |
| `wheel_well_height` | 12.5 | `largest_credible_obstruction` | SRC-005:12.5; SRC-007:12 |
| `wheel_well_depth` | 9 | `largest_credible_obstruction` | SRC-005:8.5; SRC-007:9 |
| `driver_side_usable_space` | 155 | `lowest_credible_supported_value` | SRC-005:156.875; SRC-007:155 |
| `passenger_side_usable_space` | 105.125 | `lowest_credible_supported_value` | SRC-005:105.125; SRC-007:110 |
| `partition_intrusion` | 9 | `highest_credible_supported_value` | SRC-005:7.5 zone; SRC-007:9 depth |
| `door_opening_width` | 51 | `lowest_credible_supported_value` | SRC-005:51.75; SRC-007:51.5; SRC-004:51 |
| `pre_wheel_well_zone` | 37.3125 | `lowest_credible_supported_value` | SRC-005:37.3125; SRC-007:42 |
| `post_wheel_well_zone` | 31.3125 | `lowest_credible_supported_value` | SRC-005:31.3125; SRC-007:32 |
| `total_available_cargo_space` | 155 | `lowest_credible_supported_value` | SRC-005:156.875; SRC-007:155 |
| `rear_door_opening_height` | 72.7 | `lowest_credible_supported_value` | SRC-010:72.7; SRC-004:73 |
| `overall_vehicle_length` | 274.3 | `largest_credible_clearance` | SRC-010:274.3; SRC-004:274 |
| `oem_cargo_bed_length` | 174 | `single_source_candidate` | SRC-004:174 |

Normalized values are documentation-only and are not published or verified source values.

## Unresolved fields

- Exact physical `cargo_front` datum
- Overall rear width because supplier lateral datums differ
- Side-specific wheel-well X coordinates
- Sliding-door X coordinates
- Rear usable boundary
- Major no-mount zones and attachment structure
- Installed floor and liner effects

## Required physical checks

- cargo_front datum
- actual partition rear face
- wheel-well X start and end
- sliding-door opening X start and end
- rear usable boundary
- major no-mount zones
- attachment structure
- installed floor condition
- installed liner condition
- placement-specific door and rear clearance

Full contour mapping and full structural-body digitization are not required.

## Applicable source exceptions

`E001; E003; E005; E008; E013; E016`

Only exceptions applicable to the selected configuration or placement gate production.

