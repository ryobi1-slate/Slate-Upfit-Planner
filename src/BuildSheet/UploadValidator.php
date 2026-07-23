<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\BuildSheet;

final class UploadValidator
{
    public const MAX_FILE_SIZE = 10485760;

    /**
     * @param array<string, mixed>|null $file
     * @return array{ok: bool, code?: string, message?: string, filename?: string, path?: string}
     */
    public function validate(?array $file): array
    {
        if ($file === null) {
            return $this->failure('missing_file', 'A PDF build sheet is required.');
        }
        $error = $file['error'] ?? UPLOAD_ERR_NO_FILE;
        if (! is_int($error) || $error !== UPLOAD_ERR_OK) {
            return $this->failure('upload_error', 'The PDF upload did not complete.');
        }

        $size = $file['size'] ?? null;
        $path = $file['tmp_name'] ?? null;
        $name = $file['name'] ?? null;
        if (! is_int($size) || ! is_string($path) || ! is_file($path) || ! is_string($name)) {
            return $this->failure('empty_file', 'The uploaded PDF is empty or malformed.');
        }
        if (PHP_SAPI !== 'cli' && ! is_uploaded_file($path)) {
            return $this->failure('upload_error', 'The PDF was not received as a valid HTTP upload.');
        }
        $actualSize = filesize($path);
        if ($size <= 0 || ! is_int($actualSize) || $actualSize <= 0) {
            return $this->failure('empty_file', 'The uploaded PDF is empty or malformed.');
        }
        if ($size > self::MAX_FILE_SIZE || $actualSize > self::MAX_FILE_SIZE) {
            return $this->failure('file_too_large', 'The PDF exceeds the 10 MB upload limit.');
        }

        $filename = sanitize_file_name($name);
        if (strtolower((string) pathinfo($filename, PATHINFO_EXTENSION)) !== 'pdf') {
            return $this->failure('invalid_extension', 'Only .pdf files are accepted.');
        }
        $checked = wp_check_filetype_and_ext($path, $filename, ['pdf' => 'application/pdf']);
        if (($checked['ext'] ?? false) !== 'pdf' || ($checked['type'] ?? false) !== 'application/pdf') {
            return $this->failure('invalid_mime', 'The uploaded file is not a valid PDF.');
        }

        $handle = fopen($path, 'rb');
        $signature = is_resource($handle) ? fread($handle, 5) : false;
        if (is_resource($handle)) {
            fclose($handle);
        }
        if ($signature !== '%PDF-') {
            return $this->failure('invalid_pdf_signature', 'The uploaded file does not have a valid PDF signature.');
        }

        return ['ok' => true, 'filename' => $filename, 'path' => $path];
    }

    private function failure(string $code, string $message): array
    {
        return ['ok' => false, 'code' => $code, 'message' => $message];
    }
}
