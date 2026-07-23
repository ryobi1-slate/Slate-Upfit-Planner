<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
define('ABSPATH', $root . '/');

function plugin_dir_path(string $file): string
{
    return dirname($file) . DIRECTORY_SEPARATOR;
}

function plugin_dir_url(string $file): string
{
    return 'https://example.test/wp-content/plugins/slate-upfit-planner/';
}

function add_action(string $hook, callable $callback): void
{
    $GLOBALS['bootstrap_actions'][$hook][] = $callback;
}

function add_shortcode(string $tag, callable $callback): void
{
    $GLOBALS['bootstrap_shortcodes'][$tag] = $callback;
}

function apply_filters(string $hook, mixed $value): mixed
{
    return $value;
}

require $root . '/slate-upfit-planner.php';

foreach ($GLOBALS['bootstrap_actions']['plugins_loaded'] ?? [] as $callback) {
    $callback();
}

$requests = [];
$observer = static function (string $class) use (&$requests): void {
    $requests[] = $class;
};
spl_autoload_register($observer, true, true);

$extractor = new \Slate\UpfitPlanner\BuildSheet\SmalotPdfTextExtractor();
$result = $extractor->extract($root . '/tests/fixtures/build-sheet-text.pdf-fixture');

spl_autoload_unregister($observer);

if (
    ! class_exists(\Slate\UpfitPlanner\Plugin::class, false)
    || ! class_exists(
        \Slate\UpfitPlanner\Vendor\Smalot\PdfParser\Parser::class,
        false
    )
    || in_array('Smalot\\PdfParser\\Parser', $requests, true)
    || $result['status'] !== 'text_extracted'
) {
    fwrite(STDERR, "FAIL: isolated plugin bootstrap\n");
    exit(1);
}

echo "Plugin bootstrap/isolation test: passed.\n";
