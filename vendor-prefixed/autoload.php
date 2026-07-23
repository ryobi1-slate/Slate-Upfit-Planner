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
