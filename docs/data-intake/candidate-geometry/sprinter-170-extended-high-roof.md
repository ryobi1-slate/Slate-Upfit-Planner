# sprinter-170-extended-high-roof

- geometry_record_id: `geometry-candidate-sprinter-170-extended-high-roof-1`
- body_id: `sprinter-170-extended-high-roof`
- model_year_applicability: `2019-2027 controlled carryover`
- wheelbase: `170 in`
- roof: `high`
- body_variant: `cargo_van_extended`
- evidence_state: `derived_conservative`
- operational_approval_level: `candidate`
- source_ids: `SRC-004; SRC-005; SRC-008; SRC-011`
- prepared_by: `Slate engineering data intake`
- verified_by:
- approved_by:
- record_revision: `1`
- geometry_revision: `candidate-1`
- change_summary: `Initial source-preserving conservative planning geometry.`

> This Tier 3 candidate is not planning-authorized unless an active business need is approved.

## Warning labels

- Candidate geometry
- Verify before production
- VIN payload required
- Supplier applicability carried forward
- Physical fitment review required

## Normalized dimensions

| Field | Planning value (in) | Rule | Original source-value references |
| --- | ---: | --- | --- |
| `usable_wall_height` | 72 | `lowest_credible_supported_value` | SRC-005:74.75; SRC-008:72; SRC-004:79/79.1 interior |
| `overall_rear_width` | unresolved | `unsupported_or_unclear_datum` | SRC-005:61.125 van depth; SRC-008:70 max/61 floor; SRC-004:70 max |
| `space_between_wheel_wells` | 53 | `single_source_candidate` | SRC-008:53; SRC-004:53 |
| `wheel_well_length` | 36.5 | `largest_credible_obstruction` | SRC-005:36.5; SRC-008:36 |
| `wheel_well_height` | 12.5 | `largest_credible_obstruction` | SRC-005:12.5; SRC-008:12 |
| `wheel_well_depth` | 9 | `largest_credible_obstruction` | SRC-005:8.5; SRC-008:9 |
| `driver_side_usable_space` | 170.5 | `lowest_credible_supported_value` | SRC-005:172.625; SRC-008:170.5 |
| `passenger_side_usable_space` | 121 | `lowest_credible_supported_value` | SRC-005:121; SRC-008:124.5 label/125.5 segment sum |
| `partition_intrusion` | 9 | `highest_credible_supported_value` | SRC-005:7.5 zone; SRC-008:9 depth |
| `door_opening_width` | 51 | `lowest_credible_supported_value` | SRC-005:51.625; SRC-008:51.5; SRC-004:51 |
| `pre_wheel_well_zone` | 37.4375 | `lowest_credible_supported_value` | SRC-005:37.4375; SRC-008:42 |
| `post_wheel_well_zone` | 47.0625 | `lowest_credible_supported_value` | SRC-005:47.0625; SRC-008:47.5 |
| `total_available_cargo_space` | 170.5 | `lowest_credible_supported_value` | SRC-005:172.625; SRC-008:170.5 |
| `rear_door_opening_height` | 72.7 | `lowest_credible_supported_value` | SRC-011:72.7; SRC-004:73 |
| `overall_vehicle_length` | 290 | `largest_credible_clearance` | SRC-011:290; SRC-004:290 |
| `oem_cargo_bed_length` | 189 | `single_source_candidate` | SRC-004:189 |

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

`E001; E004; E015; E016`

Only exceptions applicable to the selected configuration or placement gate production.

