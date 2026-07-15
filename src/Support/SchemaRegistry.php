<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\Support;

use InvalidArgumentException;

final class SchemaRegistry
{
    /** @var array<string, array<string, string>> */
    private array $contracts;

    public function __construct(?string $schemaDirectory = null)
    {
        $directory = $schemaDirectory ?? dirname(__DIR__, 2) . '/data/schemas';
        $this->contracts = [
            'configuration' => [
                '1.0' => $directory . '/configuration-1.0.schema.json',
                '1.1' => $directory . '/configuration-1.1.schema.json',
            ],
        ];
    }

    public function path(string $contract, string $version): string
    {
        $path = $this->contracts[$contract][$version] ?? null;
        if ($path === null) {
            throw new InvalidArgumentException(sprintf('Unsupported %s schema version: %s', $contract, $version));
        }

        return $path;
    }

    /** @return string[] */
    public function versions(string $contract): array
    {
        if (! isset($this->contracts[$contract])) {
            throw new InvalidArgumentException(sprintf('Unknown schema contract: %s', $contract));
        }

        return array_keys($this->contracts[$contract]);
    }
}
