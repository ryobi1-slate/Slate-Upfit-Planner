# Mercedes build-sheet intake

## Scope

This feature accepts a Mercedes build-sheet PDF, extracts embedded text on the
WordPress server, returns a structured review result, and lets the user
explicitly apply a supported vehicle. It does not save the document or parsed
result, recommend products, create quotes, or call Dealer Portal or Business
Central.

## Endpoint and permissions

`POST /wp-json/slate-upfit-planner/v1/build-sheet-intake`

The multipart form field is `build_sheet`. The route requires:

- an authenticated WordPress user;
- a valid `X-WP-Nonce` for the `wp_rest` action; and
- the WordPress `upload_files` capability.

Authentication failures return 401, nonce/capability failures return 403,
malformed uploads return 400, oversized uploads return 413, and documents that
cannot produce usable embedded text return 422.

## Upload and temporary-file handling

The maximum upload size is 10 MiB. The server checks the upload error and size,
sanitizes the filename, requires a `.pdf` extension, inspects the file with
`wp_check_filetype_and_ext()`, and verifies the `%PDF-` signature. Browser MIME
metadata is not trusted.

Extraction reads PHP's request-scoped upload temporary file directly. The
plugin does not move it to the media library, create a public URL, or retain it.
No server path is returned. WordPress/PHP removes the request upload temporary
file after the request.

## Extraction dependency

Embedded text is extracted by `smalot/pdfparser` 2.12.5, locked by Composer.
The library is LGPL-3.0; its mbstring polyfill is MIT. The production runtime
is generated into `vendor-prefixed/` under the
`Slate\UpfitPlanner\Vendor` namespace using the development-only PHP-Scoper
build tool. Only the two runtime packages and their license notices are
packaged; PHP-Scoper and its development dependencies are excluded.

The parser is pure PHP, requires no shell process or external service at
request time, and is compatible with the plugin's PHP 8.1 minimum. CI performs
a locked Composer install, regenerates the isolated runtime, and fails if it
differs from the committed build.

WordPress.com loads the committed isolated autoloader directly, so deployment
does not need Composer. The plugin fails closed with `unsupported_pdf` if the
isolated parser class is unavailable. The prefix prevents another plugin's
Smalot or Symfony package version from satisfying this plugin's class requests.

Parser work is bounded to 10 MiB input, 50 pages, 5,000 objects, 2,000 streams,
128 KiB per declared stream, 8 MiB per Flate-decoded stream, 200,000 extracted
characters, and 100 candidate option codes. Image content is discarded.
Encrypted PDFs and higher-risk LZW, run-length, and ASCII85 filters fail closed.

## Response

The response has this shape:

```json
{
  "ok": true,
  "filename": "Mercedes-Build-Sheet.pdf",
  "status": "text_extracted",
  "fields": {
    "wheelbase": {
      "value": "144",
      "status": "recognized",
      "confidence": 0.98,
      "source_snippet": "..."
    }
  },
  "recognized_option_codes": ["IR4", "D03"],
  "unknown_option_codes": ["XYZ"]
}
```

Extraction statuses are `text_extracted`, `no_embedded_text`,
`unreadable_pdf`, `unsupported_pdf`, and `parser_error`. Field statuses are
`recognized`, `uncertain`, `not_found`, and `unsupported`. Snippets are
whitespace-normalized and bounded. Raw document text, exception details, and
filesystem paths are never returned.

## Parsed fields and mappings

The parser may return VIN, model year, model designation, wheelbase, roof
height, drivetrain, combustion/electric type, cargo/passenger type, factory
partition, rear windows, and sliding doors. VINs must use the 17-character VIN
alphabet and obvious repeated/test placeholders are ignored.

Only the codes needed for current intake are mapped:

- wheelbase: `IR4` (144), `IR6` (170), `IR7` (170 EXT, unsupported);
- roof: `D03` (High Roof);
- drivetrain: `A4M` (AWD), `ZG1`/`ZG3` (4x4);
- electric: `M5E`, `M9E`;
- vehicle type: `FKA` (cargo), `FKB` (passenger), `FHS` (cab/chassis,
  unsupported);
- partition: `D50`, `D51`, `D56`, `D64`, and `D93` (partition omission);
- rear windows: `W61`;
- sliding doors: `T16` (right), `T19` (left).

Unknown three-character option codes remain visible. Free-text matches have
lower confidence and `uncertain` status; the parser does not invent missing
values.

## Review and vehicle matching

Upload never changes planner state. The review panel displays the sanitized
filename, extraction status, detected/missing fields, snippets, confidence
metadata, and recognized/unknown codes. Model year, wheelbase, roof,
drivetrain, and vehicle type are editable.

The Apply button must be selected explicitly. Matching fails closed and only
recognizes:

- 144 + High Roof -> `sprinter-144-high-roof`;
- 170 + High Roof -> `sprinter-170-high-roof`.

Unsupported or incomplete geometry is not created. If applying a different
vehicle while placements exist, the UI warns that existing placements will be
cleared. Apply uses the planner's existing vehicle-change action, which clears
placements and returns the active wall to driver. The parsed review remains in
component session state.

## Security and privacy

The endpoint does not log VINs or extracted text. It returns only structured
fields and bounded source snippets. It does not persist documents, expose
public URLs, contact external APIs, or hand data to Dealer Portal.

## Known limitations and next phase

Scanned/image-only PDFs return `no_embedded_text`; encrypted, malformed,
over-limit, or parser-incompatible PDFs fail explicitly. OCR is excluded
because it adds substantial binaries, resource use, privacy surface, and
extraction uncertainty. Code mappings are intentionally incomplete.

A later approved phase may add vetted fixtures, broader model/code coverage,
and a separately designed private document lifecycle. It must not turn this
temporary intake endpoint into permanent deal-document storage implicitly.
