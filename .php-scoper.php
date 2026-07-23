<?php

declare(strict_types=1);

use Isolated\Symfony\Component\Finder\Finder;

return [
    'prefix' => 'Slate\\UpfitPlanner\\Vendor',
    'finders' => [
        Finder::create()
            ->files()
            ->in([
                __DIR__ . '/vendor/smalot/pdfparser/src',
                __DIR__ . '/vendor/symfony/polyfill-mbstring',
            ])
            ->name('*.php'),
    ],
    'patchers' => [
        static fn (string $filePath, string $prefix, string $contents): string =>
            str_replace(
                '\\\\Smalot\\\\PdfParser\\\\',
                '\\\\Slate\\\\UpfitPlanner\\\\Vendor\\\\Smalot\\\\PdfParser\\\\',
                $contents
            ),
    ],
];
