<?php
/**
 * HumanizeKit API — Content Spinner endpoint
 * POST: { text, lang?, intensity?, count?, seed? }
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }

require_once __DIR__ . '/../vendor/autoload.php';
use TextHumanize\ContentSpinner;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['text'])) throw new \InvalidArgumentException('Text is required');

    $text = (string)$input['text'];
    $lang = $input['lang'] ?? 'auto';
    $intensity = isset($input['intensity']) ? (float)$input['intensity'] : 0.5;
    $seed = isset($input['seed']) ? (int)$input['seed'] : null;
    $count = isset($input['count']) ? (int)$input['count'] : 1;

    $start = microtime(true);

    // Use instance methods — static spinText() returns string, spin() returns SpinResult
    $spinner = new ContentSpinner(lang: $lang, seed: $seed, intensity: $intensity);

    if ($count > 1) {
        $count = min($count, 10); // limit to 10 variants
        $variants = $spinner->generateVariants($text, $count);
        $elapsed = round((microtime(true) - $start) * 1000, 1);
        echo json_encode([
            'ok' => true,
            'mode' => 'variants',
            'count' => count($variants),
            'variants' => $variants,
            'elapsed_ms' => $elapsed,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    } else {
        $result = $spinner->spin($text);
        $elapsed = round((microtime(true) - $start) * 1000, 1);
        echo json_encode([
            'ok' => true,
            'mode' => 'single',
            'spun' => $result->spun,
            'spintax' => $result->spintax,
            'uniqueness' => round($result->uniqueness, 4),
            'elapsed_ms' => $elapsed,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
} catch (\Throwable $e) {
    http_response_code(422);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
