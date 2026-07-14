# Architecture

## Product boundary

Slate Upfit Planner is an independently versioned WordPress plugin. It owns planner presentation, vehicle geometry, fitment, product selection, build packages, build-sheet generation, and planner persistence.

The Dealer Portal remains the host for dealer identity, approval, pricing context, and WooCommerce/B2BKing quote creation.

## Host contract

The host supplies an implementation of `HostAdapterInterface` through:

```php
add_filter('slate_upfit_planner_host_adapter', function () {
    return new DealerPortalPlannerAdapter();
});
```

The adapter provides:

- Current dealer context
- Pricing context
- Add-configuration-to-quote service

## Planner payload

All host integrations consume a versioned normalized payload:

```json
{
  "schemaVersion": "1.0",
  "configurationId": "",
  "vehicle": {},
  "components": [],
  "infrastructure": [],
  "exteriorEquipment": [],
  "validation": [],
  "totals": {},
  "dealerNotes": ""
}
```

## Migration phases

1. Scaffold plugin and host contract.
2. Port Claude planner UI and state into React components.
3. Move vehicle and product data into versioned data files.
4. Migrate server-backed saved configurations.
5. Add Dealer Portal host adapter and quote handoff.
6. Run side-by-side parity testing.
7. Switch `/configurator/` to the new plugin.
8. Remove embedded planner only after rollback confidence is established.
