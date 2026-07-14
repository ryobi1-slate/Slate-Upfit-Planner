# Slate Upfit Planner

Standalone WordPress plugin for commercial van fitment planning, build-sheet generation, saved configurations, and host-integrated quote handoff.

## Product boundary

This plugin owns:

- Planner UI and canvas
- Vehicle geometry and fitment rules
- Product catalog adapters
- Build packages and templates
- Saved planner configurations
- Build-sheet and payload calculations
- Normalized quote payload generation

The host Dealer Portal owns:

- Dealer authentication and approval
- Dealer identity and pricing context
- WooCommerce and B2BKing quote creation
- Portal navigation and shell
- Final quote submission

## Integration

The host registers an implementation of `Slate\UpfitPlanner\Integration\HostAdapterInterface` using the `slate_upfit_planner_host_adapter` filter.

The planner can run in dealer portal, internal, or standalone/demo mode.

## Development status

Initial plugin scaffold. The current Dealer Portal planner and Claude Design package will be migrated in controlled phases.
