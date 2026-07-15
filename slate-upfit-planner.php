<?php
/**
 * Plugin Name: Slate Upfit Planner
 * Description: Standalone commercial van fitment planner, canvas, and build-sheet engine. Owns the planner UI, geometry, fitment, packages, build sheet, saved configurations, and schema. Integrates with a host (Dealer Portal) for identity, pricing, and quote handoff via a PHP host adapter.
 * Version: 0.2.5
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Author: Slate
 * Text Domain: slate-upfit-planner
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

define('SLATE_UPFIT_PLANNER_VERSION', '0.2.5');
define('SLATE_UPFIT_PLANNER_FILE', __FILE__);
define('SLATE_UPFIT_PLANNER_DIR', plugin_dir_path(__FILE__));
define('SLATE_UPFIT_PLANNER_URL', plugin_dir_url(__FILE__));

$slate_upfit_planner_autoload = SLATE_UPFIT_PLANNER_DIR . 'vendor/autoload.php';

if (is_readable($slate_upfit_planner_autoload)) {
    require_once $slate_upfit_planner_autoload;
} else {
    // Lightweight PSR-4 fallback so the plugin runs before `composer install`.
    spl_autoload_register(static function (string $class): void {
        $prefix = 'Slate\\UpfitPlanner\\';

        if (! str_starts_with($class, $prefix)) {
            return;
        }

        $relative = substr($class, strlen($prefix));
        $path = SLATE_UPFIT_PLANNER_DIR . 'src/' . str_replace('\\', '/', $relative) . '.php';

        if (is_readable($path)) {
            require_once $path;
        }
    });
}

add_action('plugins_loaded', static function (): void {
    \Slate\UpfitPlanner\Plugin::instance()->boot();
});
