<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\BuildSheet;

interface PdfTextExtractorInterface
{
    /** @return array{status: string, text: string} */
    public function extract(string $path): array;
}
