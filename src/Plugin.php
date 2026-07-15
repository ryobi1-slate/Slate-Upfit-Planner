<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner;

use Slate\UpfitPlanner\Integration\HostAdapterInterface;
use Slate\UpfitPlanner\Integration\NullHostAdapter;
use Slate\UpfitPlanner\Rest\RestController;
use Slate\UpfitPlanner\Support\SchemaValidator;

/**
 * Plugin bootstrap: resolves the host adapter, registers REST routes, enqueues
 * the compiled React bundle, and exposes the `[slate_upfit_planner]` shortcode.
 */
final class Plugin
{
    private static ?self $instance = null;

    private HostAdapterInterface $hostAdapter;

    private bool $isHosted = false;

    public static function instance(): self
    {
        return self::$instance ??= new self();
    }

    private function __construct()
    {
        $this->hostAdapter = new NullHostAdapter();
    }

    public function boot(): void
    {
        // A host (Dealer Portal) may register a real adapter. Absent that, the
        // planner runs in standalone/demo mode against the NullHostAdapter.
        $adapter = apply_filters('slate_upfit_planner_host_adapter', null);

        if ($adapter instanceof HostAdapterInterface) {
            $this->hostAdapter = $adapter;
            $this->isHosted = true;
        }

        add_action('init', [$this, 'registerAssets']);
        add_action('rest_api_init', [$this, 'registerRest']);
        add_shortcode('slate_upfit_planner', [$this, 'renderPlanner']);
    }

    public function hostAdapter(): HostAdapterInterface
    {
        return $this->hostAdapter;
    }

    public function registerRest(): void
    {
        (new RestController($this->hostAdapter))->registerRoutes();
    }

    public function registerAssets(): void
    {
        $dist = SLATE_UPFIT_PLANNER_DIR . 'assets/dist/';
        $distUrl = SLATE_UPFIT_PLANNER_URL . 'assets/dist/';

        $assetFile = $dist . 'planner.asset.php';
        $asset = is_readable($assetFile)
            ? require $assetFile
            : ['dependencies' => ['wp-element'], 'version' => SLATE_UPFIT_PLANNER_VERSION];

        wp_register_script(
            'slate-upfit-planner',
            $distUrl . 'planner.js',
            $asset['dependencies'] ?? ['wp-element'],
            $asset['version'] ?? SLATE_UPFIT_PLANNER_VERSION,
            true
        );

        wp_register_style(
            'slate-upfit-planner',
            $distUrl . 'planner.css',
            [],
            $asset['version'] ?? SLATE_UPFIT_PLANNER_VERSION
        );
    }

    public function renderPlanner(): string
    {
        wp_enqueue_style('slate-upfit-planner');
        wp_enqueue_script('slate-upfit-planner');

        $context = [
            'mode' => $this->isHosted ? 'hosted' : 'standalone',
            'schemaVersion' => SchemaValidator::SCHEMA_VERSION,
            'restUrl' => esc_url_raw(rest_url('slate-upfit-planner/v1')),
            'restNonce' => wp_create_nonce('wp_rest'),
            'user' => $this->hostAdapter->getCurrentUser(),
            'dealer' => $this->hostAdapter->getCurrentDealer(),
            'catalog' => $this->hostAdapter->getCatalogContext(),
            'pricing' => $this->hostAdapter->getPricingContext(),
        ];

        wp_add_inline_script(
            'slate-upfit-planner',
            'window.SlateUpfitPlanner = ' . wp_json_encode($context) . ';',
            'before'
        );

        $template = SLATE_UPFIT_PLANNER_DIR . 'templates/planner-mount.php';

        ob_start();
        if (is_readable($template)) {
            include $template;
        } else {
            echo '<div id="slate-upfit-planner-root" class="slate-upfit-planner-root"></div>';
        }

        return (string) ob_get_clean();
    }
}
