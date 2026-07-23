<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\BuildSheet;

final class MercedesBuildSheetParser
{
    /** @var array<string, array{field: string, value: string}> */
    private const OPTION_CODES = [
        'IR4' => ['field' => 'wheelbase', 'value' => '144'],
        'IR6' => ['field' => 'wheelbase', 'value' => '170'],
        'IR7' => ['field' => 'wheelbase', 'value' => '170 EXT'],
        'D03' => ['field' => 'roof_height', 'value' => 'high'],
        'A4M' => ['field' => 'drivetrain', 'value' => 'AWD'],
        'ZG1' => ['field' => 'drivetrain', 'value' => '4x4'],
        'ZG3' => ['field' => 'drivetrain', 'value' => '4x4'],
        'M5E' => ['field' => 'powertrain_type', 'value' => 'electric'],
        'M9E' => ['field' => 'powertrain_type', 'value' => 'electric'],
        'FKA' => ['field' => 'vehicle_type', 'value' => 'cargo'],
        'FKB' => ['field' => 'vehicle_type', 'value' => 'passenger'],
        'FHS' => ['field' => 'vehicle_type', 'value' => 'cab_chassis'],
        'D50' => ['field' => 'factory_partition', 'value' => 'yes'],
        'D51' => ['field' => 'factory_partition', 'value' => 'yes'],
        'D56' => ['field' => 'factory_partition', 'value' => 'yes'],
        'D64' => ['field' => 'factory_partition', 'value' => 'yes'],
        'D93' => ['field' => 'factory_partition', 'value' => 'no'],
        'W61' => ['field' => 'rear_windows', 'value' => 'yes'],
        'T16' => ['field' => 'sliding_doors', 'value' => 'right'],
        'T19' => ['field' => 'sliding_doors', 'value' => 'left'],
    ];

    /** @return array<string, mixed> */
    public function parse(string $text): array
    {
        $text = preg_replace('/[^\P{C}\t\r\n]+/u', ' ', $text) ?? '';
        $codes = $this->optionCodes($text);

        return [
            'fields' => [
                'vin' => $this->vinField($text),
                'model_year' => $this->patternField($text, '/\b(?:model\s*year|year)\s*[:#-]?\s*((?:19|20)\d{2})\b/i'),
                'model_designation' => $this->patternField($text, '/\b((?:Mercedes-Benz\s+)?Sprinter\s+\d{4}(?:\s+(?:Cargo|Passenger)\s+Van)?)\b/i'),
                'wheelbase' => $this->optionOrPattern($text, $codes, 'wheelbase', '/\b(144|170)\s*(?:"|in(?:ch(?:es)?)?|WB|wheelbase)\b/i'),
                'roof_height' => $this->optionOrPattern($text, $codes, 'roof_height', '/\b(high|standard)\s+roof\b/i'),
                'drivetrain' => $this->optionOrPattern($text, $codes, 'drivetrain', '/\b(AWD|4x4|rear[- ]wheel drive|RWD)\b/i'),
                'powertrain_type' => $this->powertrainField($text, $codes),
                'vehicle_type' => $this->optionOrPattern($text, $codes, 'vehicle_type', '/\b(cargo|passenger)\s+van\b/i'),
                'factory_partition' => $this->optionOrPattern($text, $codes, 'factory_partition', '/\b(partition|bulkhead)\b/i', 'yes'),
                'rear_windows' => $this->optionOrPattern($text, $codes, 'rear_windows', '/\brear\s+(?:door\s+)?windows?\b/i', 'yes'),
                'sliding_doors' => $this->slidingDoorField($text, $codes),
            ],
            'recognized_option_codes' => array_values(array_intersect($codes, array_keys(self::OPTION_CODES))),
            'unknown_option_codes' => array_values(array_diff($codes, array_keys(self::OPTION_CODES))),
        ];
    }

    /** @return list<string> */
    private function optionCodes(string $text): array
    {
        preg_match_all('/(?<![A-Z0-9])([A-Z][A-Z0-9]{2})(?![A-Z0-9])/u', $text, $matches);
        $codes = array_diff($matches[1] ?? [], ['VIN', 'PDF']);

        return array_slice(array_values(array_unique($codes)), 0, 100);
    }

    private function vinField(string $text): array
    {
        preg_match_all('/\b[A-HJ-NPR-Z0-9]{17}\b/i', strtoupper($text), $matches);
        foreach ($matches[0] ?? [] as $vin) {
            if (
                count(array_unique(str_split($vin))) > 2
                && ! str_contains($vin, 'TEST')
                && ! str_contains($vin, 'SAMPLE')
            ) {
                return $this->field($vin, $this->snippet($text, $vin), 0.99);
            }
        }

        return $this->missing();
    }

    private function patternField(string $text, string $pattern, ?string $forcedValue = null): array
    {
        if (preg_match($pattern, $text, $match) !== 1) {
            return $this->missing();
        }

        return $this->field(
            $forcedValue ?? trim((string) ($match[1] ?? $match[0])),
            $this->snippet($text, $match[0]),
            0.75,
            'uncertain'
        );
    }

    /** @param list<string> $codes */
    private function optionOrPattern(
        string $text,
        array $codes,
        string $field,
        string $pattern,
        ?string $forcedValue = null
    ): array {
        $matched = [];
        foreach ($codes as $code) {
            if ((self::OPTION_CODES[$code]['field'] ?? null) === $field) {
                $matched[$code] = self::OPTION_CODES[$code]['value'];
            }
        }
        if ($matched !== []) {
            $values = array_values(array_unique($matched));
            if (count($values) > 1) {
                return $this->field(
                    implode(' / ', $values),
                    $this->snippet($text, (string) array_key_first($matched)),
                    0.5,
                    'uncertain'
                );
            }
            $value = $values[0];
            $status = in_array($value, ['170 EXT', 'cab_chassis'], true) ? 'unsupported' : 'recognized';

            return $this->field(
                $value,
                $this->snippet($text, (string) array_key_first($matched)),
                0.98,
                $status
            );
        }

        return $this->patternField($text, $pattern, $forcedValue);
    }

    /** @param list<string> $codes */
    private function powertrainField(string $text, array $codes): array
    {
        foreach ($codes as $code) {
            if ((self::OPTION_CODES[$code]['field'] ?? null) === 'powertrain_type') {
                return $this->field('electric', $this->snippet($text, $code), 0.98);
            }
        }
        if (preg_match('/\b(eSprinter|electric)\b/i', $text, $match) === 1) {
            return $this->field('electric', $this->snippet($text, $match[0]), 0.9);
        }
        if (preg_match('/\b(diesel|gasoline|gas engine|OM651|OM642|M274)\b/i', $text, $match) === 1) {
            return $this->field('combustion', $this->snippet($text, $match[0]), 0.9);
        }

        return $this->missing();
    }

    /** @param list<string> $codes */
    private function slidingDoorField(string $text, array $codes): array
    {
        $sides = [];
        $matchedCodes = [];
        foreach ($codes as $code) {
            if ((self::OPTION_CODES[$code]['field'] ?? null) === 'sliding_doors') {
                $sides[] = self::OPTION_CODES[$code]['value'];
                $matchedCodes[] = $code;
            }
        }
        if ($sides !== []) {
            $value = count(array_unique($sides)) > 1 ? 'left_and_right' : $sides[0];

            return $this->field($value, $this->snippet($text, $matchedCodes[0]), 0.98);
        }

        return $this->patternField($text, '/\b(left|right)\s+sliding\s+door\b/i');
    }

    private function snippet(string $text, string $needle): string
    {
        $position = stripos($text, $needle);
        if ($position === false) {
            return '';
        }
        $start = max(0, $position - 60);
        $snippet = substr($text, $start, min(180, strlen($text) - $start));

        return trim(strip_tags(preg_replace('/\s+/u', ' ', $snippet) ?? ''));
    }

    private function field(mixed $value, string $snippet, float $confidence, string $status = 'recognized'): array
    {
        return [
            'value' => $value,
            'source_snippet' => $snippet,
            'confidence' => $confidence,
            'status' => $status,
        ];
    }

    private function missing(): array
    {
        return $this->field(null, '', 0.0, 'not_found');
    }
}
