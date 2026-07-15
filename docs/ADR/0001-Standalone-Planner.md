# ADR 0001: Standalone Planner

## Decision

Slate Upfit Planner is a standalone WordPress plugin and repository. It owns the React application, planner state, geometry, fitment, packages, build sheet, saved-configuration model, and versioned payload schema.

## Reason

The planner is a product domain with its own release cadence and engineering rules. Separating it prevents Dealer Portal authentication, commerce, and operations concerns from leaking into fitment code.

## Tradeoffs

The boundary requires an explicit integration contract and coordinated releases when payloads change. It also introduces a separate build and deployment artifact.

## Future implications

Planner work stays in this repository. Dealer Portal remains a host and legacy fallback until parity and cutover are proven. Business Central is never called directly by the planner.
