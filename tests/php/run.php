<?php

declare(strict_types=1);

final class WP_REST_Request
{
    /** @param array<string, mixed> $payload */
    public function __construct(
        private readonly array $payload = [],
        private readonly array $headers = [],
        private readonly array $files = []
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

    /** @return array<string, mixed> */
    public function get_file_params(): array
    {
        return $this->files;
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
    return $GLOBALS['test_logged_in'] ?? true;
}

function wp_verify_nonce(string $nonce, string $action): bool
{
    return $nonce === 'valid' && $action === 'wp_rest';
}

function current_user_can(string $capability): bool
{
    return $capability === 'upload_files' && ($GLOBALS['test_can_upload'] ?? true);
}

function sanitize_file_name(string $filename): string
{
    return preg_replace('/[^A-Za-z0-9._-]/', '-', basename($filename)) ?? '';
}

/** @return array{ext: string|false, type: string|false, proper_filename: false} */
function wp_check_filetype_and_ext(string $path, string $filename, array $mimes): array
{
    $extension = strtolower((string) pathinfo($filename, PATHINFO_EXTENSION));
    $signature = (string) file_get_contents($path, false, null, 0, 5);
    $valid = $extension === 'pdf'
        && ($signature === '%PDF-' || ($GLOBALS['test_force_pdf_mime'] ?? false));

    return [
        'ext' => $valid ? 'pdf' : false,
        'type' => $valid ? $mimes['pdf'] : false,
        'proper_filename' => false,
    ];
}

$root = dirname(__DIR__, 2);
if (is_readable($root . '/vendor/autoload.php')) {
    require_once $root . '/vendor/autoload.php';
}
require_once $root . '/src/Integration/HostAdapterInterface.php';
require_once $root . '/src/Integration/NullHostAdapter.php';
require_once $root . '/src/Support/SchemaRegistry.php';
require_once $root . '/src/Support/SchemaValidator.php';
require_once $root . '/src/Persistence/ConfigurationRepository.php';
require_once $root . '/src/BuildSheet/PdfTextExtractorInterface.php';
require_once $root . '/src/BuildSheet/SmalotPdfTextExtractor.php';
require_once $root . '/src/BuildSheet/UploadValidator.php';
require_once $root . '/src/BuildSheet/MercedesBuildSheetParser.php';
require_once $root . '/src/BuildSheet/BuildSheetIntakeService.php';
require_once $root . '/src/Rest/RestController.php';

use Slate\UpfitPlanner\Integration\NullHostAdapter;
use Slate\UpfitPlanner\BuildSheet\BuildSheetIntakeService;
use Slate\UpfitPlanner\BuildSheet\MercedesBuildSheetParser;
use Slate\UpfitPlanner\BuildSheet\PdfTextExtractorInterface;
use Slate\UpfitPlanner\BuildSheet\SmalotPdfTextExtractor;
use Slate\UpfitPlanner\BuildSheet\UploadValidator;
use Slate\UpfitPlanner\Rest\RestController;
use Slate\UpfitPlanner\Support\SchemaRegistry;
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
        (string) file_get_contents($root . '/data/schemas/engineering-data-envelope-1.0.schema.json'),
        true,
        512,
        JSON_THROW_ON_ERROR
    );
    $required = $schema['$defs']['provenance']['required'] ?? [];

    return $required === ['record_revision', 'approval_state', 'source', 'prepared_by', 'verified_by', 'approved_by', 'last_verified', 'change_summary'];
};

$tests['registry exposes configuration 1.0 and 1.1'] = static function (): bool {
    return (new SchemaRegistry())->versions('configuration') === ['1.0', '1.1'];
};

$tests['configuration 1.1 fixture validates'] = static function () use ($root, $validator): bool {
    $version11 = json_decode(
        (string) file_get_contents($root . '/data/fixtures/migrations/configuration-1.1-minimal.json'),
        true,
        512,
        JSON_THROW_ON_ERROR
    );

    return $validator->validate($version11) === [];
};

$tests['unsupported configuration schema version fails'] = static function () use ($validator, $fixture): bool {
    $fixture['schema_version'] = '9.0';
    $errors = $validator->validate($fixture);

    return $errors !== [] && str_contains($errors[0], 'unsupported version');
};

$tests['focused validator rejects unsupported schema keywords'] = static function () use ($root, $fixture): bool {
    $temporary = tempnam(sys_get_temp_dir(), 'slate-schema-');
    if ($temporary === false) {
        return false;
    }
    $schema = json_decode(
        (string) file_get_contents($root . '/data/schemas/configuration-1.0.schema.json'),
        true,
        512,
        JSON_THROW_ON_ERROR
    );
    $schema['unevaluatedProperties'] = false;
    file_put_contents($temporary, json_encode($schema, JSON_THROW_ON_ERROR));
    try {
        (new SchemaValidator($temporary))->validate($fixture);
    } catch (RuntimeException $error) {
        return str_contains($error->getMessage(), 'Unsupported schema keyword');
    } finally {
        unlink($temporary);
    }

    return false;
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

$tests['accepts every runtime Westcan sku'] = static function () use ($validator, $fixture): bool {
    foreach (['22-3436', '22-3437', '22-3438', '22-3439', '22-3440'] as $sku) {
        $candidate = $fixture;
        $candidate['placements'][0]['sku'] = $sku;
        if ($validator->validate($candidate) !== []) {
            return false;
        }
    }

    return true;
};

$tests['rejects integer-like unknown object keys'] = static function () use ($validator, $fixture): bool {
    $numericStringKey = json_decode(
        json_encode(array_merge($fixture, ['123' => 'unknown']), JSON_THROW_ON_ERROR),
        true,
        512,
        JSON_THROW_ON_ERROR
    );
    $integerKey = $fixture;
    $integerKey[456] = 'unknown';

    return $validator->validate($numericStringKey) !== []
        && $validator->validate($integerKey) !== [];
};

$tests['counts unicode string lengths as code points'] = static function () use ($validator, $fixture): bool {
    $fixture['dealer_notes'] = str_repeat("\u{00E9}", 5000);
    $validAtLimit = $validator->validate($fixture) === [];
    $fixture['dealer_notes'] .= "\u{00E9}";

    return $validAtLimit && $validator->validate($fixture) !== [];
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

$pdfPath = tempnam(sys_get_temp_dir(), 'slate-pdf-');
if ($pdfPath === false) {
    throw new RuntimeException('Could not create PDF test fixture.');
}
file_put_contents($pdfPath, "%PDF-1.4\nfixture");

$validUpload = [
    'name' => 'Mercedes Build Sheet.pdf',
    'tmp_name' => $pdfPath,
    'size' => filesize($pdfPath),
    'error' => UPLOAD_ERR_OK,
    'type' => 'application/pdf',
];

$tests['valid PDF upload passes defensive validation'] = static fn (): bool =>
    (new UploadValidator())->validate($validUpload)['ok'] === true;

$tests['upload validation rejects missing empty and upload-error files'] = static function () use ($validUpload): bool {
    $validator = new UploadValidator();
    $empty = $validUpload;
    $empty['size'] = 0;
    $error = $validUpload;
    $error['error'] = UPLOAD_ERR_PARTIAL;

    return ($validator->validate(null)['code'] ?? '') === 'missing_file'
        && ($validator->validate($empty)['code'] ?? '') === 'empty_file'
        && ($validator->validate($error)['code'] ?? '') === 'upload_error';
};

$tests['upload validation rejects extension mime signature and size failures'] = static function () use ($validUpload, $pdfPath): bool {
    $validator = new UploadValidator();
    $extension = $validUpload;
    $extension['name'] = 'build-sheet.txt';
    $oversized = $validUpload;
    $oversized['size'] = UploadValidator::MAX_FILE_SIZE + 1;
    $notPdfPath = tempnam(sys_get_temp_dir(), 'slate-not-pdf-');
    if ($notPdfPath === false) {
        return false;
    }
    file_put_contents($notPdfPath, 'not a PDF');
    $renamed = $validUpload;
    $renamed['tmp_name'] = $notPdfPath;
    $renamed['size'] = filesize($notPdfPath);
    $invalidSignature = $renamed;

    try {
        $extensionRejected = ($validator->validate($extension)['code'] ?? '') === 'invalid_extension';
        $mimeRejected = ($validator->validate($renamed)['code'] ?? '') === 'invalid_mime';
        $GLOBALS['test_force_pdf_mime'] = true;
        $signatureRejected = ($validator->validate($invalidSignature)['code'] ?? '') === 'invalid_pdf_signature';

        return $extensionRejected
            && $mimeRejected
            && $signatureRejected
            && ($validator->validate($oversized)['code'] ?? '') === 'file_too_large'
            && is_file($pdfPath);
    } finally {
        $GLOBALS['test_force_pdf_mime'] = false;
        unlink($notPdfPath);
    }
};

$tests['build-sheet permissions require auth nonce and capability'] = static function (): bool {
    $controller = new RestController(new NullHostAdapter());
    $GLOBALS['test_logged_in'] = false;
    $missingAuth = $controller->canUploadBuildSheet(new WP_REST_Request());
    $GLOBALS['test_logged_in'] = true;
    $missingNonce = $controller->canUploadBuildSheet(new WP_REST_Request());
    $invalidNonce = $controller->canUploadBuildSheet(new WP_REST_Request([], ['X-WP-Nonce' => 'bad']));
    $GLOBALS['test_can_upload'] = false;
    $permission = $controller->canUploadBuildSheet(new WP_REST_Request([], ['X-WP-Nonce' => 'valid']));
    $GLOBALS['test_can_upload'] = true;

    return $missingAuth instanceof WP_Error
        && $missingAuth->code === 'rest_not_logged_in'
        && $missingNonce instanceof WP_Error
        && $missingNonce->code === 'rest_cookie_invalid_nonce'
        && $invalidNonce instanceof WP_Error
        && $permission instanceof WP_Error
        && $permission->code === 'rest_forbidden';
};

$tests['extractor statuses are returned without guessing'] = static function () use ($validUpload): bool {
    $extractor = new class implements PdfTextExtractorInterface {
        public string $status = 'no_embedded_text';
        public function extract(string $path): array
        {
            return ['status' => $this->status, 'text' => ''];
        }
    };
    $service = new BuildSheetIntakeService(new UploadValidator(), $extractor);
    foreach (['no_embedded_text', 'unreadable_pdf', 'unsupported_pdf'] as $status) {
        $extractor->status = $status;
        $result = $service->process($validUpload);
        if ($result['status'] !== $status || $result['fields'] !== []) {
            return false;
        }
    }

    return true;
};

$tests['embedded PDF text is extracted without shell or external services'] = static function () use ($root): bool {
    $result = (new SmalotPdfTextExtractor())->extract(
        $root . '/tests/fixtures/build-sheet-text.pdf-fixture'
    );

    return $result['status'] === 'text_extracted'
        && str_contains($result['text'], 'W1Y4EBHY7MT012345')
        && str_contains($result['text'], 'IR4');
};

$tests['Mercedes parser recognizes supported chassis fields and option codes'] = static function (): bool {
    $parsed = (new MercedesBuildSheetParser())->parse(
        'VIN W1Y4EBHY7MT012345 Model Year: 2024 Mercedes-Benz Sprinter 2500 Cargo Van '
        . 'IR4 D03 A4M M5E FKA D50 W61 T16 XYZ'
    );
    $fields = $parsed['fields'];

    return $fields['vin']['value'] === 'W1Y4EBHY7MT012345'
        && $fields['model_year']['value'] === '2024'
        && $fields['wheelbase']['value'] === '144'
        && $fields['roof_height']['value'] === 'high'
        && $fields['drivetrain']['value'] === 'AWD'
        && $fields['powertrain_type']['value'] === 'electric'
        && $fields['vehicle_type']['value'] === 'cargo'
        && $fields['factory_partition']['value'] === 'yes'
        && $fields['rear_windows']['value'] === 'yes'
        && $fields['sliding_doors']['value'] === 'right'
        && in_array('IR4', $parsed['recognized_option_codes'], true)
        && in_array('XYZ', $parsed['unknown_option_codes'], true);
};

$tests['Mercedes parser rejects placeholder VINs and reports uncertain fields'] = static function (): bool {
    $parsed = (new MercedesBuildSheetParser())->parse(
        'VIN 00000000000000000 IR7 FHS ABC high roof'
    );

    return $parsed['fields']['vin']['status'] === 'not_found'
        && $parsed['fields']['wheelbase']['status'] === 'unsupported'
        && $parsed['fields']['vehicle_type']['status'] === 'unsupported'
        && $parsed['fields']['roof_height']['status'] === 'uncertain'
        && in_array('ABC', $parsed['unknown_option_codes'], true);
};

$tests['REST build-sheet intake returns parsed data and sanitized filename'] = static function () use ($validUpload): bool {
    $extractor = new class implements PdfTextExtractorInterface {
        public function extract(string $path): array
        {
            return ['status' => 'text_extracted', 'text' => 'IR6 D03 diesel FKA'];
        }
    };
    $controller = new RestController(
        new NullHostAdapter(),
        new \Slate\UpfitPlanner\Persistence\ConfigurationRepository(),
        new SchemaValidator(),
        new BuildSheetIntakeService(new UploadValidator(), $extractor)
    );
    $response = $controller->intakeBuildSheet(new WP_REST_Request([], [], ['build_sheet' => $validUpload]));
    $data = $response->get_data();

    return $response->get_status() === 200
        && $data['status'] === 'text_extracted'
        && $data['filename'] === 'Mercedes-Build-Sheet.pdf'
        && $data['fields']['wheelbase']['value'] === '170';
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

unlink($pdfPath);
