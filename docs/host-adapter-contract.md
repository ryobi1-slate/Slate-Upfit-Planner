# Host Adapter Contract

The planner integrates with a host platform (the Dealer Portal) through a single
PHP interface. This is the **only** seam between the planner and host-owned
concerns (identity, catalog entitlement, pricing, persistence, quotes,
Business Central). The planner never reaches those systems directly.

## Interface

`Slate\UpfitPlanner\Integration\HostAdapterInterface`

| Method                                           | Purpose                                 | Owned by |
| ------------------------------------------------ | --------------------------------------- | -------- |
| `getCurrentUser(): array`                        | Authenticated user identity             | Host     |
| `getCurrentDealer(): array`                      | Dealer identity/approval/tier           | Host     |
| `getCatalogContext(): array`                     | Available SKUs/packages for this dealer | Host     |
| `getPricingContext(): array`                     | Currency, price list, visibility        | Host     |
| `saveConfiguration(array $payload): array`       | Persist a normalized payload            | Host     |
| `addConfigurationToQuote(array $payload): array` | Hand payload to quote system            | Host     |

All methods take/return plain associative arrays so the contract stays free of
host-specific types. `saveConfiguration` and `addConfigurationToQuote` receive a
normalized configuration payload (`schema_version` `1.0`) — see
[configuration-schema.md](./configuration-schema.md).

### Return shapes

```php
getCurrentUser(): [
    'id' => int|null,
    'display_name' => string,
    'email' => string,
    'roles' => string[],
    'is_authenticated' => bool,
]

getCurrentDealer(): [
    'id' => string|null,
    'name' => string,
    'tier' => string,
    'is_approved' => bool,
]

saveConfiguration(array $payload): [
    'ok' => bool,
    'configuration_id' => string|null,
    'errors' => string[],
    'status' => int,   // optional; HTTP status for a failure (e.g. 403). Defaults to 422.
]

addConfigurationToQuote(array $payload): [
    'ok' => bool,
    'quote_id' => string|null,
    'quote_url' => string|null,
    'errors' => string[],
    'status' => int,   // optional; HTTP status for a failure (e.g. 403). Defaults to 422.
]
```

When `ok` is `false`, the REST layer maps the result to an HTTP status: it uses
the optional `status` field when present (e.g. return `403` to signal an
authenticated user who fails a host permission/dealer-approval check), otherwise
it defaults to `422` (unprocessable payload). Authentication itself is enforced
earlier: unauthenticated writes are rejected with `401` before the adapter is
called.

## Registration

The host registers its adapter with the `slate_upfit_planner_host_adapter`
filter, returning an instance of `HostAdapterInterface`:

```php
add_filter( 'slate_upfit_planner_host_adapter', function () {
    return new \Slate\DealerPortal\Planner\DealerPortalHostAdapter();
} );
```

If no adapter is registered, the plugin falls back to `NullHostAdapter` and runs
in **standalone / demo** mode.

## NullHostAdapter

`Slate\UpfitPlanner\Integration\NullHostAdapter` is the default. It returns
anonymous identity, empty catalog/pricing context, acknowledges saves with a
generated demo id, and reports that quotes are unavailable. It contacts no
external system, making it safe for local development, CI, and demos.

## Rules

- The browser talks to WordPress over REST; WordPress talks to the host over
  this interface. The browser never calls the host adapter directly.
- The planner does **not** create quotes, call B2BKing, or touch Business
  Central. `addConfigurationToQuote` delegates the entire handoff to the host.
- Pricing values are host-owned. The planner renders whatever
  `getPricingContext` provides and computes only a placeholder package value for
  UI purposes.
- Payloads are validated against the schema **before** `saveConfiguration` or
  `addConfigurationToQuote` is called.
