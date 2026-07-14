<?php

declare(strict_types=1);

namespace Slate\UpfitPlanner\Integration;

interface HostAdapterInterface
{
    /** @return array<string, mixed> */
    public function getCurrentDealer(): array;

    /** @return array<string, mixed> */
    public function getPricingContext(): array;

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function addConfigurationToQuote(array $payload): array;
}
