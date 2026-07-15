# ADR 0003: Versioned Configuration Schema

## Decision

`data/configuration-schema.json` is the canonical configuration contract. Client types and server validation must conform to it. Breaking changes require a new schema version and migration path.

## Reason

Saved configurations and quote handoffs outlive a single UI release. A versioned, normalized payload makes compatibility explicit and prevents pixels or view state from becoming persisted business data.

## Tradeoffs

Schema evolution requires discipline, fixtures, and support for older versions. JSON Schema cannot express every domain invariant, so narrowly scoped checks such as placement-ID uniqueness remain in code.

## Future implications

The server loads the schema at runtime and rejects unsupported versions, walls, SKUs, and malformed coordinates. Future schemas must ship with compatibility tests and documented migrations.
