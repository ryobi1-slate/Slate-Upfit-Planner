<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\Integration;

/**
 * Default adapter used for standalone development and demo mode when no host
 * platform (Dealer Portal) has registered a real adapter.
 *
 * It returns anonymous/empty contexts and echoes back generated identifiers so
 * the planner UI, persistence, and quote flows can be exercised end-to-end
 * without a host. Nothing here contacts an external system.
 */
final class NullHostAdapter implements HostAdapterInterface
{
    /**
     * @inheritDoc
     */
    public function getCurrentUser(): array
    {
        return [
            'id' => null,
            'display_name' => 'Demo User',
            'email' => '',
            'roles' => ['demo'],
            'is_authenticated' => false,
        ];
    }

    /**
     * @inheritDoc
     */
    public function getCurrentDealer(): array
    {
        return [
            'id' => null,
            'name' => 'Standalone Demo',
            'tier' => 'demo',
            'is_approved' => false,
        ];
    }

    /**
     * @inheritDoc
     */
    public function getCatalogContext(): array
    {
        return [
            'mode' => 'standalone',
            'currency' => 'USD',
            'available_skus' => [],
            'available_packages' => [],
        ];
    }

    /**
     * @inheritDoc
     */
    public function getPricingContext(): array
    {
        return [
            'mode' => 'standalone',
            'currency' => 'USD',
            'price_list' => null,
            'pricing_visible' => false,
        ];
    }

    /**
     * @inheritDoc
     */
    public function saveConfiguration(array $payload): array
    {
        // Standalone mode does not persist to a host store. A local
        // persistence layer may still choose to save; here we just acknowledge.
        return [
            'ok' => true,
            'configuration_id' => $payload['configuration_id'] ?? 'demo-' . substr(md5(wp_json_encode($payload) ?: ''), 0, 12),
            'errors' => [],
        ];
    }

    /**
     * @inheritDoc
     */
    public function addConfigurationToQuote(array $payload): array
    {
        // No quote system in standalone mode.
        return [
            'ok' => false,
            'quote_id' => null,
            'quote_url' => null,
            'errors' => ['Quotes are unavailable in standalone demo mode.'],
        ];
    }
}
