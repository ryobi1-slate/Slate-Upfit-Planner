# ADR 0006: Commercial Knowledge Layer Boundaries

## Decision

Vehicle, geometry, catalog, compatibility, and trade-package facts are
versioned JSON records validated before constructor-injected, read-only domain
repositories index them. Schema versions, record revisions, and geometry or
package revisions remain separate identifiers.

Only approved records are listed for production use by default. Draft fixtures
exist solely for contract and repository tests. Compatibility evaluation,
package preload, pricing, and host integrations are outside this foundation.

## Reason

Fitment behavior depends on traceable commercial facts that outlive a UI
release. Separating loading, validation, indexing, and evaluation prevents
TypeScript constructors or WordPress state from becoming an unreviewed data
source.

## Consequences

Data promotion requires provenance and approval. Saved configurations pin
revisions and may require explicit migration or revalidation. Deprecated data
must remain resolvable for history. More operational review is required before
PR B can add production vehicle geometry.
