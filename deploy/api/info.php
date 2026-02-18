<?php
/**
 * HumanizeKit API — Info endpoint
 * GET: Returns service metadata
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'service' => 'HumanizeKit',
    'version' => '1.0.0',
    'engine' => 'TextHumanize PHP',
    'profiles' => ['chat', 'web', 'seo', 'docs', 'formal'],
    'languages' => [
        ['code' => 'auto', 'name' => 'Auto-detect'],
        ['code' => 'ru', 'name' => 'Русский'],
        ['code' => 'uk', 'name' => 'Українська'],
        ['code' => 'en', 'name' => 'English'],
        ['code' => 'de', 'name' => 'Deutsch'],
        ['code' => 'fr', 'name' => 'Français'],
        ['code' => 'es', 'name' => 'Español'],
        ['code' => 'pl', 'name' => 'Polski'],
        ['code' => 'pt', 'name' => 'Português'],
        ['code' => 'it', 'name' => 'Italiano'],
    ],
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
