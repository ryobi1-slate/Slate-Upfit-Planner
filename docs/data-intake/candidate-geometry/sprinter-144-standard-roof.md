# sprinter-144-standard-roof

- geometry_record_id: `geometry-candidate-sprinter-144-standard-roof-1`
- body_id: `sprinter-144-standard-roof`
- model_year_applicability: `2019-2027 controlled carryover`
- wheelbase: `144 in`
- roof: `standard`
- body_variant: `cargo_van`
- evidence_state: `derived_conservative`
- operational_approval_level: `candidate`
- source_ids: `SRC-004; SRC-005; SRC-006; SRC-009`
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
| `usable_wall_height` | 62.625 | `lowest_credible_supported_value` | SRC-005:62.625; SRC-006:66.5; SRC-004:68 interior |
| `overall_rear_width` | unresolved | `unsupported_or_unclear_datum` | SRC-005:61.125 van depth; SRC-006:70 max/61 floor; SRC-004:70 max |
| `space_between_wheel_wells` | 53 | `single_source_candidate` | SRC-006:53; SRC-004:53 |
| `wheel_well_length` | 36.5 | `largest_credible_obstruction` | SRC-005:36.5; SRC-006:36 |
| `wheel_well_height` | 12.5 | `largest_credible_obstruction` | SRC-005:12.5; SRC-006:12 |
| `wheel_well_depth` | 9 | `largest_credible_obstruction` | SRC-005:8.5; SRC-006:9 |
| `driver_side_usable_space` | 116 | `lowest_credible_supported_value` | SRC-005:117.125; SRC-006:116 |
| `passenger_side_usable_space` | 65.375 | `lowest_credible_supported_value` | SRC-005:65.375; SRC-006:71 |
| `partition_intrusion` | 9 | `highest_credible_supported_value` | SRC-005:7.5 zone; SRC-006:9 depth |
| `door_opening_width` | 51 | `lowest_credible_supported_value` | SRC-005:51.75; SRC-006:51.5; SRC-004:51 |
| `pre_wheel_well_zone` | 11.875 | `lowest_credible_supported_value` | SRC-005:11.875; SRC-006:16 |
| `post_wheel_well_zone` | 17 | `lowest_credible_supported_value` | SRC-005:17; SRC-006:19 |
| `total_available_cargo_space` | 116 | `lowest_credible_supported_value` | SRC-005:117.125; SRC-006:116 |
| `rear_door_opening_height` | 60.6 | `lowest_credible_supported_value` | SRC-009:60.6; SRC-004:61 |
| `overall_vehicle_length` | 234 | `largest_credible_clearance` | SRC-009:233.5; SRC-004:234 |
| `oem_cargo_bed_length` | 133 | `single_source_candidate` | SRC-004:133 |

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

`E001; E002; E006; E008; E009; E010; E014; E016`

Only exceptions applicable to the selected configuration or placement gate production.

