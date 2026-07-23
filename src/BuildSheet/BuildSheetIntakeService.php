<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\BuildSheet;

use Throwable;

final class BuildSheetIntakeService
{
    public function __construct(
        private readonly UploadValidator $uploadValidator = new UploadValidator(),
        private readonly PdfTextExtractorInterface $extractor = new SmalotPdfTextExtractor(),
        private readonly MercedesBuildSheetParser $parser = new MercedesBuildSheetParser()
    ) {
    }

    /** @param array<string, mixed>|null $file */
    public function process(?array $file): array
    {
        $upload = $this->uploadValidator->validate($file);
        if (! $upload['ok']) {
            return [
                'ok' => false,
                'status' => 'parser_error',
                'code' => $upload['code'],
                'message' => $upload['message'],
            ];
        }

        $extraction = $this->extractor->extract((string) $upload['path']);
        $response = [
            'ok' => $extraction['status'] === 'text_extracted',
            'filename' => $upload['filename'],
            'status' => $extraction['status'],
            'fields' => [],
            'recognized_option_codes' => [],
            'unknown_option_codes' => [],
        ];
        if ($extraction['status'] !== 'text_extracted') {
            return $response;
        }

        try {
            return array_merge($response, $this->parser->parse($extraction['text']));
        } catch (Throwable) {
            $response['ok'] = false;
            $response['status'] = 'parser_error';
            return $response;
        }
    }
}
