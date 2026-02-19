<?php
/**
 * HumanizeKit API — Tone Analysis endpoint
 * POST: { text, lang? }
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }

require_once __DIR__ . '/../vendor/autoload.php';
use TextHumanize\ToneAnalyzer;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['text'])) throw new \InvalidArgumentException('Text is required');

    $text = (string)$input['text'];
    $lang = $input['lang'] ?? 'auto';

    $start = microtime(true);
    $result = ToneAnalyzer::analyzeTone($text, $lang);
    $elapsed = round((microtime(true) - $start) * 1000, 1);

    echo json_encode([
        'ok' => true,
        'primary_tone' => $result->primaryTone->value,
        'scores' => $result->scores,
        'formality' => round($result->formality, 4),
        'subjectivity' => round($result->subjectivity, 4),
        'confidence' => round($result->confidence, 4),
        'markers' => $result->markers ?? [],
        'elapsed_ms' => $elapsed,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(422);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
