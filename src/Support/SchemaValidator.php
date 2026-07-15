<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\Support;

use RuntimeException;

/**
 * Validates normalized configuration payloads from the canonical JSON Schema.
 *
 * Domain invariants that JSON Schema cannot express without custom extensions
 * (currently placement-id uniqueness) are checked after structural validation.
 */
final class SchemaValidator
{
    public const SCHEMA_VERSION = '1.0';

    /** @var array<string, mixed>|null */
    private ?array $schema = null;

    public function __construct(
        private readonly ?string $schemaPath = null
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     * @return string[]
     */
    public function validate(array $payload): array
    {
        $errors = $this->validateValue($payload, $this->schema(), '$');

        if ($errors === []) {
            $errors = array_merge($errors, $this->validateUniquePlacementIds($payload));
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

    /** @return array<string, mixed> */
    private function schema(): array
    {
        if ($this->schema !== null) {
            return $this->schema;
        }

        $path = $this->schemaPath ?? dirname(__DIR__, 2) . '/data/configuration-schema.json';
        $json = is_readable($path) ? file_get_contents($path) : false;
        if ($json === false) {
            throw new RuntimeException(sprintf('Configuration schema is not readable: %s', $path));
        }

        $schema = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        if (! is_array($schema)) {
            throw new RuntimeException('Configuration schema must decode to an object.');
        }

        return $this->schema = $schema;
    }

    /**
     * JSON Schema subset used by the configuration contract. Keeping this
     * interpreter generic means constraints remain declared in the JSON file.
     *
     * @param array<string, mixed> $schema
     * @return string[]
     */
    private function validateValue(mixed $value, array $schema, string $path): array
    {
        $errors = [];

        if (array_key_exists('const', $schema) && $value !== $schema['const']) {
            $errors[] = sprintf('%s must equal %s.', $path, json_encode($schema['const']));
        }

        if (isset($schema['enum']) && is_array($schema['enum']) && ! in_array($value, $schema['enum'], true)) {
            $errors[] = sprintf('%s contains an unsupported value.', $path);
        }

        if (array_key_exists('type', $schema) && ! $this->matchesType($value, $schema['type'])) {
            $errors[] = sprintf('%s has an invalid type.', $path);

            return $errors;
        }

        if (is_string($value)) {
            $length = $this->stringLength($value);
            if (isset($schema['minLength']) && $length < (int) $schema['minLength']) {
                $errors[] = sprintf('%s is shorter than the minimum length.', $path);
            }
            if (isset($schema['maxLength']) && $length > (int) $schema['maxLength']) {
                $errors[] = sprintf('%s exceeds the maximum length.', $path);
            }
        }

        if ((is_int($value) || is_float($value)) && isset($schema['minimum']) && $value < $schema['minimum']) {
            $errors[] = sprintf('%s must be at least %s.', $path, $schema['minimum']);
        }

        if (($schema['type'] ?? null) === 'object' && is_array($value)) {
            $errors = array_merge($errors, $this->validateObject($value, $schema, $path));
        }

        if (($schema['type'] ?? null) === 'array' && is_array($value) && isset($schema['items']) && is_array($schema['items'])) {
            foreach ($value as $index => $item) {
                $errors = array_merge(
                    $errors,
                    $this->validateValue($item, $schema['items'], sprintf('%s[%d]', $path, $index))
                );
            }
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $value
     * @param array<string, mixed> $schema
     * @return string[]
     */
    private function validateObject(array $value, array $schema, string $path): array
    {
        $errors = [];
        $properties = isset($schema['properties']) && is_array($schema['properties'])
            ? $schema['properties']
            : [];

        foreach (($schema['required'] ?? []) as $required) {
            if (is_string($required) && ! array_key_exists($required, $value)) {
                $errors[] = sprintf('%s.%s is required.', $path, $required);
            }
        }

        foreach ($value as $key => $item) {
            if (! is_string($key)) {
                $errors[] = sprintf('%s.%s is not allowed.', $path, (string) $key);
                continue;
            }
            if (isset($properties[$key]) && is_array($properties[$key])) {
                $errors = array_merge(
                    $errors,
                    $this->validateValue($item, $properties[$key], $path . '.' . $key)
                );
            } elseif (($schema['additionalProperties'] ?? true) === false) {
                $errors[] = sprintf('%s.%s is not allowed.', $path, $key);
            }
        }

        return $errors;
    }

    private function stringLength(string $value): int
    {
        if (function_exists('mb_strlen')) {
            return mb_strlen($value, 'UTF-8');
        }

        $count = preg_match_all('/./us', $value, $matches);

        return $count === false ? strlen($value) : $count;
    }

    private function matchesType(mixed $value, mixed $expected): bool
    {
        $types = is_array($expected) ? $expected : [$expected];

        foreach ($types as $type) {
            $matches = match ($type) {
                'null' => $value === null,
                'string' => is_string($value),
                'number' => (is_int($value) || is_float($value)) && is_finite((float) $value),
                'integer' => is_int($value),
                'boolean' => is_bool($value),
                'array' => is_array($value) && array_is_list($value),
                'object' => is_array($value) && ($value === [] || ! array_is_list($value)),
                default => false,
            };

            if ($matches) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $payload
     * @return string[]
     */
    private function validateUniquePlacementIds(array $payload): array
    {
        $seen = [];
        $errors = [];

        foreach ($payload['placements'] as $index => $placement) {
            $id = $placement['id'];
            if (isset($seen[$id])) {
                $errors[] = sprintf('$.placements[%d].id duplicates placement id "%s".', $index, $id);
            }
            $seen[$id] = true;
        }

        return $errors;
    }
}
