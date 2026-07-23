<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\BuildSheet;

use Smalot\PdfParser\Parser;
use Throwable;

final class SmalotPdfTextExtractor implements PdfTextExtractorInterface
{
    public const MAX_PAGES = 50;
    public const MAX_TEXT_LENGTH = 200000;

    public function extract(string $path): array
    {
        if (! class_exists(Parser::class)) {
            return ['status' => 'unsupported_pdf', 'text' => ''];
        }

        try {
            $document = (new Parser())->parseFile($path);
            if (count($document->getPages()) > self::MAX_PAGES) {
                return ['status' => 'unsupported_pdf', 'text' => ''];
            }
            $text = trim($document->getText());
            if ($text === '') {
                return ['status' => 'no_embedded_text', 'text' => ''];
            }
            $length = function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);
            if ($length > self::MAX_TEXT_LENGTH) {
                return ['status' => 'unsupported_pdf', 'text' => ''];
            }

            return ['status' => 'text_extracted', 'text' => $text];
        } catch (Throwable) {
            return ['status' => 'unreadable_pdf', 'text' => ''];
        }
    }
}
