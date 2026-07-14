<?php
/**
 * Plugin Name: Slate Upfit Planner
 * Description: Commercial van fitment planner and build-sheet engine for Slate dealer and internal workflows.
 * Version: 0.1.0
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Author: Slate
 * Text Domain: slate-upfit-planner
 */

declared(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

define('SLATE_UPFIT_PLANNER_VERSION', '0.1.0');
define('SLATE_UPFIT_PLANNER_FILE', __FILE__);
define('SLATE_UPFIT_PLANNER_DIR', plugin_dir_path(__FILE__));
define('SLATE_UPFIT_PLANNER_URL', plugin_dir_url(__FILE__));

$autoload = SLATE_UPFIT_PLANNER_DIR . 'vendor/autoload.php';

if (is_readable($autoload)) {
    require_once $autoload;
} else {
    require_once SLATE_UPFIT_PLANNER_DIR . 'src/Plugin.php';
    require_once SLATE_UPFIT_PLANNER_DIR . 'src/Integration/HostAdapterInterface.php';
}

add_action('plugins_loaded', static function (): void {
    \Slate\UpfitPlanner\Plugin::instance()->boot();
});
