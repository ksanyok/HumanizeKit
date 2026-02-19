<?php
/**
 * HumanizeKit API — Tone Adjustment endpoint
 * POST: { text, target, lang?, intensity? }
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
    if (empty($input['target'])) throw new \InvalidArgumentException('Target tone is required');

    $text = (string)$input['text'];
    $target = (string)$input['target'];
    $lang = $input['lang'] ?? 'auto';
    $intensity = isset($input['intensity']) ? (float)$input['intensity'] : 0.5;

    $valid = ['formal','academic','professional','neutral','friendly','casual','marketing'];
    if (!in_array($target, $valid)) {
        throw new \InvalidArgumentException('Target must be one of: ' . implode(', ', $valid));
    }

    $start = microtime(true);
    $adjusted = ToneAnalyzer::adjustTone($text, $target, $lang, $intensity);
    $elapsed = round((microtime(true) - $start) * 1000, 1);

    echo json_encode([
        'ok' => true,
        'text' => $adjusted,
        'target' => $target,
        'intensity' => $intensity,
        'elapsed_ms' => $elapsed,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(422);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
