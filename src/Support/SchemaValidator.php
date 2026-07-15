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

        // Use array_key_exists (not isset) so an explicit null value is still
        // type-checked and flagged rather than silently skipped.
        if (array_key_exists('vehicle', $payload) && ! is_array($payload['vehicle'])) {
            $errors[] = 'vehicle must be an object.';
        }

        foreach (['placements', 'infrastructure', 'exterior_equipment', 'validation'] as $listKey) {
            if (array_key_exists($listKey, $payload) && ! is_array($payload[$listKey])) {
                $errors[] = sprintf('%s must be an array.', $listKey);
            }
        }

        // Each placement must match the canonical schema (id, sku, wall, and a
        // numeric position.x/position.y) so malformed items such as `[{}]` are
        // rejected before persistence or quote handoff.
        if (array_key_exists('placements', $payload) && is_array($payload['placements'])) {
            $index = 0;
            foreach ($payload['placements'] as $placement) {
                foreach ($this->validatePlacement($placement, $index) as $error) {
                    $errors[] = $error;
                }
                $index++;
            }
        }

        if (array_key_exists('totals', $payload) && ! is_array($payload['totals'])) {
            $errors[] = 'totals must be an object.';
        }

        if (array_key_exists('dealer_notes', $payload) && ! is_string($payload['dealer_notes'])) {
            $errors[] = 'dealer_notes must be a string.';
        }

        return $errors;
    }

    /**
     * Validate a single placement item's structure and types, mirroring the
     * `placements.items` definition in data/configuration-schema.json.
     *
     * @param mixed $placement Raw placement item (expected associative array).
     * @param int   $index     Position in the placements array, for messaging.
     * @return string[] Errors for this item. Empty === valid.
     */
    private function validatePlacement(mixed $placement, int $index): array
    {
        $errors = [];
        $label = sprintf('placements[%d]', $index);

        if (! is_array($placement)) {
            $errors[] = sprintf('%s must be an object.', $label);

            return $errors;
        }

        foreach (['id', 'sku', 'wall'] as $key) {
            if (! array_key_exists($key, $placement)) {
                $errors[] = sprintf('%s.%s is required.', $label, $key);
            } elseif (! is_string($placement[$key])) {
                $errors[] = sprintf('%s.%s must be a string.', $label, $key);
            }
        }

        if (! array_key_exists('position', $placement)) {
            $errors[] = sprintf('%s.position is required.', $label);
        } elseif (! is_array($placement['position'])) {
            $errors[] = sprintf('%s.position must be an object.', $label);
        } else {
            foreach (['x', 'y'] as $axis) {
                if (! array_key_exists($axis, $placement['position'])) {
                    $errors[] = sprintf('%s.position.%s is required.', $label, $axis);
                } elseif (! is_int($placement['position'][$axis]) && ! is_float($placement['position'][$axis])) {
                    $errors[] = sprintf('%s.position.%s must be a number.', $label, $axis);
                }
            }
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
