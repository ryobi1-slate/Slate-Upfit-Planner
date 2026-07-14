<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner;

use Slate\UpfitPlanner\Integration\HostAdapterInterface;

final class Plugin
{
    private static ?self $instance = null;

    private ?HostAdapterInterface $hostAdapter = null;

    public static function instance(): self
    {
        return self::$instance ??= new self();
    }

    private function __construct()
    {
    }

    public function boot(): void
    {
        $adapter = apply_filters('slate_upfit_planner_host_adapter', null);

        if ($adapter instanceof HostAdapterInterface) {
            $this->hostAdapter = $adapter;
        }

        add_action('init', [$this, 'registerAssets']);
        add_shortcode('slate_upfit_planner', [$this, 'renderPlanner']);
    }

    public function registerAssets(): void
    {
        wp_register_style(
            'slate-upfit-planner',
            SLATE_UPFIT_PLANNER_URL . 'assets/dist/planner.css',
            [],
            SLATE_UPFIT_PLANNER_VERSION
        );

        wp_register_script(
            'slate-upfit-planner',
            SLATE_UPFIT_PLANNER_URL . 'assets/dist/planner.js',
            ['wp-element'],
            SLATE_UPFIT_PLANNER_VERSION,
            true
        );
    }

    public function renderPlanner(): string
    {
        wp_enqueue_style('slate-upfit-planner');
        wp_enqueue_script('slate-upfit-planner');

        $context = [
            'mode' => $this->hostAdapter ? 'hosted' : 'standalone',
            'dealer' => $this->hostAdapter ? $this->hostAdapter->getCurrentDealer() : [],
            'pricing' => $this->hostAdapter ? $this->hostAdapter->getPricingContext() : [],
            'restUrl' => esc_url_raw(rest_url('slate-upfit-planner/v1')),
            'restNonce' => wp_create_nonce('wp_rest'),
            'schemaVersion' => '1.0',
        ];

        wp_add_inline_script(
            'slate-upfit-planner',
            'window.SlateUpfitPlanner = ' . wp_json_encode($context) . ';',
            'before'
        );

        return '<div id="slate-upfit-planner-root" class="slate-upfit-planner-root"></div>';
    }
}
