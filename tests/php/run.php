<?php

declare(strict_types=1);

final class WP_REST_Request
{
    /** @param array<string, mixed> $payload */
    public function __construct(
        private readonly array $payload = [],
        private readonly array $headers = []
    ) {
    }

    /** @return array<string, mixed> */
    public function get_json_params(): array
    {
        return $this->payload;
    }

    public function get_header(string $name): mixed
    {
        return $this->headers[$name] ?? null;
    }
}

final class WP_REST_Response
{
    public function __construct(
        private readonly mixed $data,
        private readonly int $status = 200
    ) {
    }

    public function get_data(): mixed
    {
        return $this->data;
    }

    public function get_status(): int
    {
        return $this->status;
    }
}

final class WP_Error
{
    public function __construct(
        public readonly string $code,
        public readonly string $message,
        public readonly array $data = []
    ) {
    }
}

function wp_json_encode(mixed $value): string|false
{
    return json_encode($value);
}

function is_user_logged_in(): bool
{
    return true;
}

function wp_verify_nonce(string $nonce, string $action): bool
{
    return $nonce === 'valid' && $action === 'wp_rest';
}

$root = dirname(__DIR__, 2);
require_once $root . '/src/Integration/HostAdapterInterface.php';
require_once $root . '/src/Integration/NullHostAdapter.php';
require_once $root . '/src/Support/SchemaValidator.php';
require_once $root . '/src/Persistence/ConfigurationRepository.php';
require_once $root . '/src/Rest/RestController.php';

use Slate\UpfitPlanner\Integration\NullHostAdapter;
use Slate\UpfitPlanner\Rest\RestController;
use Slate\UpfitPlanner\Support\SchemaValidator;

/** @var array<string, mixed> $fixture */
$fixture = json_decode(
    (string) file_get_contents($root . '/tests/fixtures/configurations/valid-configuration.json'),
    true,
    512,
    JSON_THROW_ON_ERROR
);

$validator = new SchemaValidator();
$tests = [];

$tests['accepts canonical fixture'] = static fn (): bool => $validator->validate($fixture) === [];

$tests['provenance schema requires review metadata'] = static function () use ($root): bool {
    $schema = json_decode(
        (string) file_get_contents($root . '/data/engineering-data-schema.json'),
        true,
        512,
        JSON_THROW_ON_ERROR
    );
    $required = $schema['$defs']['provenance']['required'] ?? [];

    return $required === ['revision', 'source', 'approved_by', 'last_verified'];
};

$tests['rejects invalid version'] = static function () use ($validator, $fixture): bool {
    $fixture['schema_version'] = '2.0';

    return $validator->validate($fixture) !== [];
};

$tests['rejects invalid wall'] = static function () use ($validator, $fixture): bool {
    $fixture['placements'][0]['wall'] = 'rear';

    return $validator->validate($fixture) !== [];
};

$tests['rejects duplicate placement ids'] = static function () use ($validator, $fixture): bool {
    $fixture['placements'][] = $fixture['placements'][0];

    return $validator->validate($fixture) !== [];
};

$tests['rejects malformed coordinates'] = static function () use ($validator, $fixture): bool {
    $fixture['placements'][0]['position']['x'] = 'twelve';

    return $validator->validate($fixture) !== [];
};

$tests['rejects negative coordinates'] = static function () use ($validator, $fixture): bool {
    $fixture['placements'][0]['position']['x'] = -1;

    return $validator->validate($fixture) !== [];
};

$tests['rejects unknown skus'] = static function () use ($validator, $fixture): bool {
    $fixture['placements'][0]['sku'] = 'UNKNOWN-SKU';

    return $validator->validate($fixture) !== [];
};

$tests['compatibility fixtures match schema'] = static function () use ($validator, $fixture, $root): bool {
    $cases = json_decode(
        (string) file_get_contents($root . '/tests/fixtures/compatibility/phase-2-cases.json'),
        true,
        512,
        JSON_THROW_ON_ERROR
    );

    foreach ($cases as $case) {
        $candidate = $fixture;
        $candidate['placements'][0]['sku'] = $case['sku'];
        $candidate['placements'][0]['wall'] = $case['wall'];
        if (($validator->validate($candidate) === []) !== $case['valid']) {
            return false;
        }
    }

    return true;
};

$tests['REST returns 422 for invalid payload'] = static function () use ($fixture): bool {
    $fixture['placements'][0]['sku'] = 'UNKNOWN-SKU';
    $controller = new RestController(new NullHostAdapter());
    $response = $controller->saveConfiguration(new WP_REST_Request($fixture));
    $data = $response->get_data();

    return $response->get_status() === 422
        && is_array($data)
        && ($data['ok'] ?? true) === false
        && ($data['errors'] ?? []) !== [];
};

$failures = 0;
foreach ($tests as $name => $test) {
    try {
        if (! $test()) {
            throw new RuntimeException('assertion returned false');
        }
        echo "PASS: {$name}\n";
    } catch (Throwable $error) {
        $failures++;
        fwrite(STDERR, "FAIL: {$name}: {$error->getMessage()}\n");
    }
}

if ($failures > 0) {
    exit(1);
}

echo sprintf("PHP schema/REST tests: %d passed.\n", count($tests));
