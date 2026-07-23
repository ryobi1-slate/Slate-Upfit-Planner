# PR #17 security and parser review

## Review baseline

- Pull request: #17, `Add Mercedes build-sheet intake`
- Base: `0a025055d23618c30b70dcd3b5765c5269032a3e`
- Initial feature head: `45193b3c8bab4fe9395e9dc577e9c6ecdd08ff0b`
- Initial commits: one
- Initial GitHub Quality run: #89; all functional steps passed and the
  whitespace step failed because Composer regenerated an upstream license file
  with its canonical trailing blank line
- Review threads: none

## Reviewed scope

First-party implementation:

- `slate-upfit-planner.php`
- `src/BuildSheet/`
- `src/Rest/RestController.php`
- `assets/src/components/BuildSheetIntake.tsx`
- `assets/src/components/ConfigurationRail.tsx`
- `assets/src/domain/buildSheetIntake.ts`
- `assets/src/services/restClient.ts`
- `assets/src/styles/index.css`

Build and dependency files:

- `composer.json`, `composer.lock`, `.php-scoper.php`
- `scripts/build-scoped-runtime.php`
- `.github/workflows/quality.yml`
- `vendor-prefixed/`
- generated `assets/dist/planner*`

Tests and documentation:

- `tests/buildSheetIntake.test.tsx`
- `tests/php/run.php`
- `tests/php/plugin-bootstrap.php`
- synthetic fixtures under `tests/fixtures/`
- `docs/build-sheet-intake.md`

No Dealer Portal, pricing, package, quote, checkout, Business Central,
WordPress page-content, deployment-credential, or permanent deal-document
behavior is included.

## Dependency and license review

Runtime dependencies are locked to:

- `smalot/pdfparser` 2.12.5, LGPL-3.0;
- `symfony/polyfill-mbstring` 1.38.2, MIT.

The production runtime contains only scoped PHP source, a deterministic
manifest with lockfile source references, and both required license notices.
It contains no development packages, PHARs, executables, native libraries, or
binaries. PHP-Scoper 0.17.7 is a development-only build dependency and is not
packaged. Composer has no request-time scripts; neither parsing nor autoloading
uses a shell, network request, or external API.

The isolated runtime is approximately 444 KB across 59 files. Its largest
files are parser/polyfill PHP sources: `PDFObject.php` (46,774 bytes),
`RawDataParser.php` (40,885 bytes), `Mbstring.php` (39,484 bytes), and
`Page.php` (37,201 bytes). The plugin requires PHP 8.1 or newer.

CI installs the lockfile, regenerates `vendor-prefixed/`, and fails on any
difference. Composer validation and the locked advisory audit are required
before merge. The audit reports no security advisories. It also reports the
abandoned `composer/package-versions-deprecated` package, which is a transitive
dependency of the development-only PHP-Scoper build tool and is not included
in the production runtime.

## Namespace isolation

The original draft packaged global `Smalot\PdfParser` and
`Symfony\Polyfill\Mbstring` namespaces. That could collide with another
WordPress plugin loading a different package version first.

The runtime is now generated with the fixed prefix
`Slate\UpfitPlanner\Vendor`. A small plugin-owned autoloader loads only that
prefix, while the first-party PSR-4 fallback explicitly excludes it.
PHP-Scoper patching also rewrites the library's two dynamic Smalot class-name
strings. The mbstring fallback keeps its guarded global functions while
referencing the prefixed polyfill class.

Tests load the plugin with a simulated competing autoloader and verify that
PDF extraction never requests `Smalot\PdfParser\Parser`. Plugin activation,
first-party class loading, prefixed parser loading, and extraction all pass
without Composer being present at request time.

Result: namespace collision risk is mitigated and no global dependency class
namespace is exported.

## Upload security

The endpoint is POST-only and requires:

- an authenticated WordPress session;
- an `X-WP-Nonce` valid for `wp_rest`;
- the `upload_files` capability.

Validation covers missing/malformed multipart data, PHP upload errors, an
empty file, declared and actual server-side size, a 10 MiB maximum, sanitized
filename, `.pdf`, `wp_check_filetype_and_ext()` MIME inspection, `%PDF-`
signature, and `is_uploaded_file()` outside CLI tests.

The request-scoped PHP temporary file is read directly and is never moved to
public storage. Responses contain no filesystem path, predictable URL, stack
trace, raw exception, or complete extracted document. The implementation has
no logging calls and therefore does not log VINs or document text. Structured
values, codes, and snippets are bounded; React renders them as escaped text.
Bad requests return 400, oversized uploads 413, permission failures 401/403,
and extraction failures 422.

## Parser security

Pre-parse limits now reject:

- encrypted PDFs;
- declarations above 50 pages;
- more than 5,000 objects or 2,000 streams;
- more than 200 object-stream markers;
- declared streams above 128 KiB;
- LZW, run-length, and ASCII85 filters.

Flate decoding is limited to 8 MiB per stream, image content is discarded,
input remains limited to 10 MiB, extracted text to 200,000 characters, and
candidate option codes to 100. Parser exceptions return a fixed status.
Static recursion state is reset before and after each extraction.

These controls reduce malformed cross-reference, compressed expansion,
object-graph, repeated-metadata, code-flood, memory, and timeout-like risks.
They do not make third-party PDF parsing a formally sandboxed operation.
Host-level PHP memory and execution limits remain the final backstop.

Unicode control characters are removed before field parsing. HTML tags are
removed from snippets. Formula-like text is displayed only as escaped text and
is never exported to CSV or evaluated.

## Parser correctness

Reviewed fields: VIN, model year, model designation, wheelbase, roof,
drivetrain, combustion/electric type, cargo/passenger type, factory partition,
rear windows, sliding doors, recognized/unknown codes, snippets, confidence,
and status.

- VIN requires a VIN label, exactly 17 allowed characters, excludes I/O/Q, and
  rejects repeated/test/sample placeholders.
- Known mappings are data-driven and deliberately narrow.
- Free-text evidence is `uncertain`; missing and unsupported values remain
  explicit.
- Conflicting mapped values are `uncertain` and cannot match geometry.
- Codes are deduplicated in deterministic source order.
- Unknown codes are accepted only from option-code sections or code-leading
  rows, preventing ordinary uppercase words from being reported as codes.
- Unknown codes and snippets are bounded.
- Missing text never produces guessed chassis values.

## Vehicle matching

Matching remains fail-closed:

- 144 + High Roof -> `sprinter-144-high-roof`;
- 170 + High Roof -> `sprinter-170-high-roof`;
- every other or ambiguous combination -> no match.

Upload and correction do not dispatch planner state. Apply is explicit. A
vehicle change with placements shows a warning, then uses the existing
vehicle-change action only after confirmation. Existing placements clear and
the driver wall becomes active through the existing reducer. Parsed intake
data remains React session state only; no quote, deal, or permanent record is
created.

## Frontend review

The control has PDF advisory filtering, loading state, safe success/error
messages, retry through another upload, recognized/uncertain/missing/
unsupported field output, confidence, snippets, editable supported fields,
visible unknown codes, explicit Apply, and a placement-clear warning.

Controls have labels and native keyboard behavior. Multipart requests omit a
manually supplied content type so the browser creates the boundary. The panel
uses shrinkable grid/input rules and inherits the planner's container-based
mobile layout.

## Synthetic fixture results

No sanitized customer build sheets were found or added. Tests generate
temporary synthetic PDFs for:

- valid 144 and 170 High Roof extraction and parsing;
- invalid and unrelated VIN-like identifiers;
- conflicting and unknown option codes;
- empty embedded text;
- malformed and encrypted input;
- page, object, stream, decoded-stream, text, and code boundaries.

Files are removed after each test. No real VIN, buyer, dealer, or deal data is
present.

## Resolved defects

1. Restored canonical Composer package content and excluded generated
   dependency output from first-party whitespace checking.
2. Replaced collision-prone global dependency namespaces with a deterministic
   plugin-prefixed runtime.
3. Corrected plugin bootstrap so first-party classes still autoload when the
   isolated dependency loader is present.
4. Added dynamic-class-name scoping and a simulated competing-autoloader test.
5. Added pre-parse resource/format limits and static recursion cleanup.
6. Anchored VIN detection to a VIN label.
7. Prevented ordinary uppercase words from becoming unknown option codes.
8. Added actual-size, route-method, status-code, synthetic-boundary, and
   end-to-end chassis tests.

## Validation

Local correction validation passed:

- Composer strict validation;
- locked Composer audit with zero security advisories and the one disclosed
  abandoned development-only transitive package;
- npm lint and TypeScript checks;
- 12 JavaScript suites with 123 tests;
- 35 PHP schema/REST/parser tests plus the plugin bootstrap/isolation test;
- PHP syntax checks across 75 shipped and test PHP files;
- production build repeated with byte-stable generated assets;
- deterministic isolated-runtime regeneration with no diff;
- repository whitespace checks.

The corrected head must repeat the repository Quality workflow successfully
before merge.

## WordPress.com compatibility

The committed plugin runtime needs only PHP 8.1 and standard PHP/WordPress file
APIs. Composer and PHP-Scoper are build-time tools only. No shell, external
service, OCR binary, or writable permanent directory is required on staging.
The `upload_files` capability and WordPress/PHP upload limits must be available
to the testing account.

## Remaining limitations

- Image-only build sheets require OCR and return `no_embedded_text`.
- Encrypted and higher-risk filter formats intentionally fail closed.
- Option-code coverage is intentionally narrow.
- Synthetic fixtures cannot represent every Mercedes PDF producer/font.
- The parser runs in the WordPress PHP process rather than a separate sandbox.
- PHP-Scoper 0.17.7 has one abandoned transitive development dependency; it is
  isolated to the build environment and is not shipped or loaded at runtime.
- Live insufficient-permission testing requires an account without
  `upload_files`; it must not be simulated by changing staging roles.

## Recommendation

After the corrected head passes Quality, has no unresolved review threads, and
passes authenticated staging smoke tests, PR #17 is suitable for squash merge.
