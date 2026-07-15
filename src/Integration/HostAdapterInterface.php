<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\Integration;

/**
 * Contract that a host platform (e.g. the Dealer Portal) implements to supply
 * identity, catalog, pricing, and persistence/quote services to the planner.
 *
 * The planner NEVER talks to Business Central, B2BKing, WooCommerce, or the
 * dealer identity system directly. All of that is reached through an
 * implementation of this interface, registered via the
 * `slate_upfit_planner_host_adapter` filter.
 *
 * In standalone/demo mode no host is present and {@see NullHostAdapter} is used.
 */
interface HostAdapterInterface
{
    /**
     * Identity of the currently authenticated user (dealer rep, internal user).
     *
     * @return array<string, mixed> {
     *     @type int|null    $id
     *     @type string      $display_name
     *     @type string      $email
     *     @type string[]    $roles
     *     @type bool        $is_authenticated
     * }
     */
    public function getCurrentUser(): array;

    /**
     * Dealer identity/context the current user is acting on behalf of.
     *
     * @return array<string, mixed> {
     *     @type string|null $id
     *     @type string      $name
     *     @type string      $tier
     *     @type bool        $is_approved
     * }
     */
    public function getCurrentDealer(): array;

    /**
     * Catalog context (available SKUs, packages, availability filters) scoped
     * to the current dealer/user. The planner owns catalog *presentation*; the
     * host owns catalog *entitlement*.
     *
     * @return array<string, mixed>
     */
    public function getCatalogContext(): array;

    /**
     * Pricing context (currency, price list, discounts) scoped to the current
     * dealer. Pricing values themselves are owned by the host — the planner
     * only renders what the host provides.
     *
     * @return array<string, mixed>
     */
    public function getPricingContext(): array;

    /**
     * Persist a normalized configuration payload through the host's storage.
     *
     * @param array<string, mixed> $payload Normalized configuration payload (schema_version 1.0).
     * @return array<string, mixed> {
     *     @type bool        $ok
     *     @type string|null $configuration_id
     *     @type string[]    $errors
     * }
     */
    public function saveConfiguration(array $payload): array;

    /**
     * Hand a normalized configuration payload to the host's quote system.
     * The planner does not create quotes, call B2BKing, or reach Business
     * Central — the host owns that handoff.
     *
     * @param array<string, mixed> $payload Normalized configuration payload (schema_version 1.0).
     * @return array<string, mixed> {
     *     @type bool        $ok
     *     @type string|null $quote_id
     *     @type string|null $quote_url
     *     @type string[]    $errors
     * }
     */
    public function addConfigurationToQuote(array $payload): array;
}
