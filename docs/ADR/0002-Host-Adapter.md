# ADR 0002: Host Adapter

## Decision

WordPress-to-host integration uses `HostAdapterInterface`. Browser code communicates only with the planner REST API.

## Reason

Authentication, dealer identity, entitlement, pricing, quotes, B2BKing, Business Central, and operations belong to the host. A PHP interface keeps those dependencies outside planner domain code.

## Tradeoffs

The interface must remain small and version-aware. Host implementations require contract tests, and unavailable host services must produce explicit results.

## Future implications

New host capabilities must be added deliberately rather than accessed from React. Payloads are validated before adapter handoff, and the host must independently authorize every mutation.
