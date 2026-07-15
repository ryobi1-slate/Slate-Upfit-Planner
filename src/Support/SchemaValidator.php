<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\Support;

/**
 * Validates a normalized configuration payload against the versioned schema
 * before it is saved or handed to the host's quote system.
 *
 * This is a lightweight structural validator (no external JSON-Schema library
 * dependency in Phase 1). The canonical schema lives in
 * `data/configuration-schema.json`. Both must be kept in sync.
 */
final class SchemaValidator
{
    public const SCHEMA_VERSION = '1.0';

    /**
     * Top-level keys required on every normalized payload.
     *
     * @var string[]
     */
    private const REQUIRED_KEYS = [
        'schema_version',
        'configuration_id',
        'vehicle',
        'placements',
        'infrastructure',
        'exterior_equipment',
        'validation',
        'totals',
        'dealer_notes',
    ];

    /**
     * Validate a payload structurally.
     *
     * @param array<string, mixed> $payload
     * @return string[] List of human-readable error messages. Empty === valid.
     */
    public function validate(array $payload): array
    {
        $errors = [];

        foreach (self::REQUIRED_KEYS as $key) {
            if (! array_key_exists($key, $payload)) {
                $errors[] = sprintf('Missing required key: %s', $key);
            }
        }

        if (($payload['schema_version'] ?? null) !== self::SCHEMA_VERSION) {
            $errors[] = sprintf(
                'Unsupported schema_version. Expected "%s".',
                self::SCHEMA_VERSION
            );
        }

        // configuration_id may be null (unsaved) or a string.
        if (array_key_exists('configuration_id', $payload)) {
            $id = $payload['configuration_id'];
            if ($id !== null && ! is_string($id)) {
                $errors[] = 'configuration_id must be a string or null.';
            }
        }

        if (isset($payload['vehicle']) && ! is_array($payload['vehicle'])) {
            $errors[] = 'vehicle must be an object.';
        }

        foreach (['placements', 'infrastructure', 'exterior_equipment', 'validation'] as $listKey) {
            if (isset($payload[$listKey]) && ! is_array($payload[$listKey])) {
                $errors[] = sprintf('%s must be an array.', $listKey);
            }
        }

        if (isset($payload['totals']) && ! is_array($payload['totals'])) {
            $errors[] = 'totals must be an object.';
        }

        if (isset($payload['dealer_notes']) && ! is_string($payload['dealer_notes'])) {
            $errors[] = 'dealer_notes must be a string.';
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function isValid(array $payload): bool
    {
        return $this->validate($payload) === [];
    }
}
