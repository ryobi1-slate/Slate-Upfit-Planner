# Data Approval Sign-off

| Field | Value |
| --- | --- |
| `vehicle_id` | |
| `record_revision` | |
| `geometry_revision` | |
| `source_package_revision` | |
| `approval_state` | |
| `prepared_by` | |
| `verified_by` | |
| `approved_by` | |
| `last_verified` | |
| `payload_policy` | |
| `payload_record_id` | |
| `final_vin_verification` | |
| `configuration_matrix_revision` | |
| `source_exception_register_revision` | |
| `geometry_sharing_candidate_group` | |
| `geometry_sharing_approved` | |
| `rounding_policy` | |
| `open_exceptions` | |

Production-selectable records require `approval_state: approved`.

Candidate geometry sharing is not approval. Payload approval remains specific to the
exact model year, body, drivetrain, chassis, engine output, and verified VIN evidence.

## Approval decision

- [ ] Approved
- [ ] Approved with documented exceptions
- [ ] Returned for correction
- [ ] Rejected

Decision notes: ______________________________________________________________

## Signatures or approval references

Prepared: ____________________; Date/reference: ____________________

Verified: ____________________; Date/reference: ____________________

Approved: ____________________  Date/reference: ____________________
