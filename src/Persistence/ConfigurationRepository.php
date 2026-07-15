<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\Persistence;

use Slate\UpfitPlanner\Support\SchemaValidator;

/**
 * Local persistence boundary for saved planner configurations.
 *
 * Phase 1 note: this is a thin placeholder. Full server-backed persistence
 * (custom table or CPT, ownership, revisions) is deferred to a later phase.
 * The class exists now so the REST layer has a stable seam to call, and so the
 * schema-validation-before-save rule has a single home.
 *
 * The planner owns saved configurations; the host owns quotes. When a host
 * adapter is present, saving may also be delegated to the host — that wiring is
 * added in a later phase.
 */
final class ConfigurationRepository
{
    public function __construct(
        private readonly SchemaValidator $validator = new SchemaValidator()
    ) {
    }

    /**
     * Validate and (in Phase 1) acknowledge a save.
     *
     * @param array<string, mixed> $payload Normalized configuration payload.
     * @return array<string, mixed> {
     *     @type bool        $ok
     *     @type string|null $configuration_id
     *     @type string[]    $errors
     * }
     */
    public function save(array $payload): array
    {
        $errors = $this->validator->validate($payload);

        if ($errors !== []) {
            return [
                'ok' => false,
                'configuration_id' => $payload['configuration_id'] ?? null,
                'errors' => $errors,
            ];
        }

        // Phase 1: no durable store yet. Assign a demo id if unsaved.
        $id = $payload['configuration_id'] ?? null;
        if (! is_string($id) || $id === '') {
            $id = 'local-' . substr(md5(wp_json_encode($payload) ?: ''), 0, 12);
        }

        return [
            'ok' => true,
            'configuration_id' => $id,
            'errors' => [],
        ];
    }

    /**
     * Load a configuration by id.
     *
     * @return array<string, mixed>|null
     */
    public function find(string $configurationId): ?array
    {
        // Phase 1: not implemented — no durable store yet.
        unset($configurationId);

        return null;
    }
}
