<?php
/**
 * HumanizeKit API — AI Detection endpoint (12-metric engine)
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
use TextHumanize\AIDetector;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['text'])) throw new \InvalidArgumentException('Text is required');

    $text = (string)$input['text'];
    $lang = $input['lang'] ?? 'auto';

    $start = microtime(true);
    $result = AIDetector::detectAi($text, $lang);
    $elapsed = round((microtime(true) - $start) * 1000, 1);

    echo json_encode([
        'ok' => true,
        'ai_probability' => round($result->aiProbability, 4),
        'human_probability' => round($result->humanProbability(), 4),
        'confidence' => round($result->confidence, 4),
        'verdict' => $result->verdict,
        'scores' => [
            'entropy' => round($result->entropyScore, 4),
            'burstiness' => round($result->burstinessScore, 4),
            'vocabulary' => round($result->vocabularyScore, 4),
            'zipf' => round($result->zipfScore, 4),
            'stylometry' => round($result->stylometryScore, 4),
            'ai_patterns' => round($result->patternScore, 4),
            'punctuation' => round($result->punctuationScore, 4),
            'coherence' => round($result->coherenceScore, 4),
            'grammar' => round($result->grammarScore, 4),
            'openings' => round($result->openingScore, 4),
            'readability' => round($result->readabilityScore, 4),
            'rhythm' => round($result->rhythmScore, 4),
        ],
        'explanations' => $result->explanations,
        'summary' => $result->summary(),
        'details' => $result->details,
        'elapsed_ms' => $elapsed,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(422);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
