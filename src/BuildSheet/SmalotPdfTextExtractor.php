<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\BuildSheet;

use Slate\UpfitPlanner\Vendor\Smalot\PdfParser\Config;
use Slate\UpfitPlanner\Vendor\Smalot\PdfParser\Exception\EmptyPdfException;
use Slate\UpfitPlanner\Vendor\Smalot\PdfParser\PDFObject;
use Slate\UpfitPlanner\Vendor\Smalot\PdfParser\Parser;
use Throwable;

final class SmalotPdfTextExtractor implements PdfTextExtractorInterface
{
    public const MAX_PAGES = 50;
    public const MAX_TEXT_LENGTH = 200000;
    public const MAX_OBJECTS = 5000;
    public const MAX_STREAMS = 2000;
    public const MAX_STREAM_BYTES = 131072;
    public const MAX_DECODED_STREAM_BYTES = 8388608;

    public function extract(string $path): array
    {
        if (! class_exists(Parser::class)) {
            return ['status' => 'unsupported_pdf', 'text' => ''];
        }

        try {
            $raw = file_get_contents($path);
            if (! is_string($raw) || $raw === '') {
                return ['status' => 'unreadable_pdf', 'text' => ''];
            }
            if ($this->unsupportedStructure($raw)) {
                return ['status' => 'unsupported_pdf', 'text' => ''];
            }

            $config = new Config();
            $config->setRetainImageContent(false);
            $config->setDecodeMemoryLimit(self::MAX_DECODED_STREAM_BYTES);
            PDFObject::$recursionStack = [];
            $document = (new Parser([], $config))->parseContent($raw);
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
        } catch (EmptyPdfException) {
            return ['status' => 'no_embedded_text', 'text' => ''];
        } catch (Throwable) {
            return ['status' => 'unreadable_pdf', 'text' => ''];
        } finally {
            if (class_exists(PDFObject::class, false)) {
                PDFObject::$recursionStack = [];
            }
        }
    }

    private function unsupportedStructure(string $raw): bool
    {
        if (
            preg_match('/\/Encrypt\b/', $raw) === 1
            || preg_match('/\/(?:LZWDecode|RunLengthDecode|ASCII85Decode)\b/', $raw) === 1
            || preg_match_all('/\b\d+\s+\d+\s+obj\b/', $raw) > self::MAX_OBJECTS
            || preg_match_all('/\bstream(?:\r\n|\r|\n)/', $raw) > self::MAX_STREAMS
            || substr_count($raw, '/ObjStm') > 200
        ) {
            return true;
        }

        preg_match_all('/\/Count\s+(\d+)/', $raw, $counts);
        foreach ($counts[1] ?? [] as $count) {
            if ((int) $count > self::MAX_PAGES) {
                return true;
            }
        }
        preg_match_all('/\/Length\s+(\d+)/', $raw, $lengths);
        foreach ($lengths[1] ?? [] as $length) {
            if ((int) $length > self::MAX_STREAM_BYTES) {
                return true;
            }
        }

        return false;
    }
}
