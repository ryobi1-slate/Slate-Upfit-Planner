<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\Rest;

use Slate\UpfitPlanner\BuildSheet\BuildSheetIntakeService;
use Slate\UpfitPlanner\Integration\HostAdapterInterface;
use Slate\UpfitPlanner\Persistence\ConfigurationRepository;
use Slate\UpfitPlanner\Support\SchemaValidator;
use WP_Error;
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
        private readonly SchemaValidator $validator = new SchemaValidator(),
        private readonly BuildSheetIntakeService $buildSheetIntake = new BuildSheetIntakeService()
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

        register_rest_route(self::NAMESPACE, '/build-sheet-intake', [
            'methods' => 'POST',
            'callback' => [$this, 'intakeBuildSheet'],
            'permission_callback' => [$this, 'canUploadBuildSheet'],
        ]);
    }

    /**
     * Write guard for all mutating routes (save/update configuration, quote
     * handoff).
     *
     * The standalone demo UI still renders and runs on local state — only
     * server-side writes are gated here:
     *   - unauthenticated request  -> 401 (rest_not_logged_in)
     *   - authenticated, bad nonce -> 403 (rest_cookie_invalid_nonce)
     *
     * Deeper host permission/dealer-approval checks (403) are enforced when the
     * host adapter processes the request; that wiring lands with host identity
     * in a later phase.
     *
     * @return bool|WP_Error true when allowed, WP_Error (with a status) otherwise.
     */
    public function canWrite(WP_REST_Request $request): bool|WP_Error
    {
        if (! is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                'Authentication is required to write planner data.',
                ['status' => 401]
            );
        }

        $nonce = $request->get_header('X-WP-Nonce');
        if (! is_string($nonce) || ! wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error(
                'rest_cookie_invalid_nonce',
                'Invalid or missing request nonce.',
                ['status' => 403]
            );
        }

        return true;
    }

    public function canUploadBuildSheet(WP_REST_Request $request): bool|WP_Error
    {
        $writePermission = $this->canWrite($request);
        if ($writePermission !== true) {
            return $writePermission;
        }
        if (! current_user_can('upload_files')) {
            return new WP_Error(
                'rest_forbidden',
                'Permission to upload build sheets is required.',
                ['status' => 403]
            );
        }

        return true;
    }

    /**
     * HTTP status for a failed host/repository result. A host may signal a
     * permission failure with an explicit `status` (e.g. 403); otherwise the
     * failure is treated as an unprocessable payload (422).
     *
     * @param array<string, mixed> $result
     */
    private function failureStatus(array $result): int
    {
        return isset($result['status']) && is_int($result['status'])
            ? $result['status']
            : 422;
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

        return new WP_REST_Response(
            $result,
            ! empty($result['ok']) ? 200 : $this->failureStatus($result)
        );
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
        // create quotes or reach Business Central directly. A host that denies
        // the authenticated user on permission grounds can return status 403.
        $result = $this->hostAdapter->addConfigurationToQuote($payload);

        return new WP_REST_Response(
            $result,
            ! empty($result['ok']) ? 200 : $this->failureStatus($result)
        );
    }

    public function intakeBuildSheet(WP_REST_Request $request): WP_REST_Response
    {
        $files = $request->get_file_params();
        $file = isset($files['build_sheet']) && is_array($files['build_sheet'])
            ? $files['build_sheet']
            : null;
        $result = $this->buildSheetIntake->process($file);

        return new WP_REST_Response(
            $result,
            ! empty($result['ok']) ? 200 : $this->buildSheetFailureStatus($result)
        );
    }

    /** @param array<string, mixed> $result */
    private function buildSheetFailureStatus(array $result): int
    {
        $code = $result['code'] ?? null;
        if ($code === 'file_too_large') {
            return 413;
        }
        if (in_array($code, [
            'missing_file',
            'upload_error',
            'empty_file',
            'invalid_extension',
            'invalid_mime',
            'invalid_pdf_signature',
        ], true)) {
            return 400;
        }

        return 422;
    }
}
