<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\Rest;

use Slate\UpfitPlanner\Integration\HostAdapterInterface;
use Slate\UpfitPlanner\Persistence\ConfigurationRepository;
use Slate\UpfitPlanner\Support\SchemaValidator;
use WP_REST_Request;
use WP_REST_Response;

/**
 * REST surface used by the browser planner to talk to WordPress.
 *
 * Browser <-> WordPress uses REST (this controller). WordPress <-> host plugin
 * uses the PHP {@see HostAdapterInterface}. The browser never talks to the host
 * plugin or Business Central directly.
 *
 * Phase 1 exposes a minimal, safe surface: a bootstrap/context endpoint, a
 * schema-validating save endpoint, and a quote-handoff endpoint that delegates
 * to the host adapter. No pricing or Business Central logic lives here.
 */
final class RestController
{
    private const NAMESPACE = 'slate-upfit-planner/v1';

    public function __construct(
        private readonly HostAdapterInterface $hostAdapter,
        private readonly ConfigurationRepository $repository = new ConfigurationRepository(),
        private readonly SchemaValidator $validator = new SchemaValidator()
    ) {
    }

    public function registerRoutes(): void
    {
        register_rest_route(self::NAMESPACE, '/context', [
            'methods' => 'GET',
            'callback' => [$this, 'getContext'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/configurations', [
            'methods' => 'POST',
            'callback' => [$this, 'saveConfiguration'],
            'permission_callback' => [$this, 'canWrite'],
        ]);

        register_rest_route(self::NAMESPACE, '/quote', [
            'methods' => 'POST',
            'callback' => [$this, 'addToQuote'],
            'permission_callback' => [$this, 'canWrite'],
        ]);
    }

    /**
     * Nonce-based write guard. Real capability checks are layered in later
     * phases once host identity wiring lands.
     */
    public function canWrite(WP_REST_Request $request): bool
    {
        $nonce = $request->get_header('X-WP-Nonce');

        return is_string($nonce) && (bool) wp_verify_nonce($nonce, 'wp_rest');
    }

    public function getContext(): WP_REST_Response
    {
        return new WP_REST_Response([
            'schema_version' => SchemaValidator::SCHEMA_VERSION,
            'user' => $this->hostAdapter->getCurrentUser(),
            'dealer' => $this->hostAdapter->getCurrentDealer(),
            'catalog' => $this->hostAdapter->getCatalogContext(),
            'pricing' => $this->hostAdapter->getPricingContext(),
        ], 200);
    }

    public function saveConfiguration(WP_REST_Request $request): WP_REST_Response
    {
        /** @var array<string, mixed> $payload */
        $payload = (array) $request->get_json_params();

        $errors = $this->validator->validate($payload);
        if ($errors !== []) {
            return new WP_REST_Response([
                'ok' => false,
                'errors' => $errors,
            ], 422);
        }

        $result = $this->repository->save($payload);

        return new WP_REST_Response($result, $result['ok'] ? 200 : 422);
    }

    public function addToQuote(WP_REST_Request $request): WP_REST_Response
    {
        /** @var array<string, mixed> $payload */
        $payload = (array) $request->get_json_params();

        $errors = $this->validator->validate($payload);
        if ($errors !== []) {
            return new WP_REST_Response([
                'ok' => false,
                'errors' => $errors,
            ], 422);
        }

        // Delegate the actual quote creation to the host. The planner does not
        // create quotes or reach Business Central directly.
        $result = $this->hostAdapter->addConfigurationToQuote($payload);

        return new WP_REST_Response($result, ! empty($result['ok']) ? 200 : 422);
    }
}
