<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$output = $root . '/vendor-prefixed';
$polyfill = $output . '/symfony/polyfill-mbstring';

if (! is_dir($polyfill)) {
    throw new RuntimeException('Scoped mbstring polyfill output is missing.');
}

$bootstrap = (string) file_get_contents($root . '/vendor/symfony/polyfill-mbstring/bootstrap80.php');
$bootstrap = str_replace(
    'use Symfony\\Polyfill\\Mbstring as p;',
    'use Slate\\UpfitPlanner\\Vendor\\Symfony\\Polyfill\\Mbstring as p;',
    $bootstrap
);
file_put_contents($output . '/polyfill-bootstrap.php', $bootstrap);

$autoload = <<<'PHP'
<?php

declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'Slate\\UpfitPlanner\\Vendor\\';
    if (! str_starts_with($class, $prefix)) {
        return;
    }

    $maps = [
        'Smalot\\PdfParser\\' => __DIR__ . '/smalot/pdfparser/src/Smalot/PdfParser/',
        'Symfony\\Polyfill\\Mbstring\\' => __DIR__ . '/symfony/polyfill-mbstring/',
    ];
    $relative = substr($class, strlen($prefix));
    foreach ($maps as $namespace => $directory) {
        if (str_starts_with($relative, $namespace)) {
            $path = $directory
                . str_replace('\\', '/', substr($relative, strlen($namespace)))
                . '.php';
            if (is_readable($path)) {
                require_once $path;
            }
            return;
        }
    }
});

require_once __DIR__ . '/polyfill-bootstrap.php';
PHP;

file_put_contents($output . '/autoload.php', $autoload . "\n");

$licenses = $output . '/licenses';
if (! is_dir($licenses) && ! mkdir($licenses, 0777, true) && ! is_dir($licenses)) {
    throw new RuntimeException('Could not create scoped runtime license directory.');
}
copy(
    $root . '/vendor/smalot/pdfparser/LICENSE.txt',
    $licenses . '/smalot-pdfparser-LGPL-3.0.txt'
);
copy(
    $root . '/vendor/symfony/polyfill-mbstring/LICENSE',
    $licenses . '/symfony-polyfill-mbstring-MIT.txt'
);

$lock = json_decode(
    (string) file_get_contents($root . '/composer.lock'),
    true,
    512,
    JSON_THROW_ON_ERROR
);
$runtimePackages = [];
foreach ($lock['packages'] ?? [] as $package) {
    if (in_array($package['name'] ?? '', [
        'smalot/pdfparser',
        'symfony/polyfill-mbstring',
    ], true)) {
        $runtimePackages[$package['name']] = [
            'version' => $package['version'],
            'license' => $package['license'],
            'source_reference' => $package['source']['reference'] ?? null,
        ];
    }
}
ksort($runtimePackages);
file_put_contents(
    $output . '/manifest.json',
    json_encode([
        'prefix' => 'Slate\\UpfitPlanner\\Vendor',
        'packages' => $runtimePackages,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n"
);
