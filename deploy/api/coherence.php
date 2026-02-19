<?php
/**
 * HumanizeKit API — Coherence Analysis endpoint
 * POST: { text, lang?, suggest? }
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method not allowed']); exit; }

require_once __DIR__ . '/../vendor/autoload.php';
use TextHumanize\CoherenceAnalyzer;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['text'])) throw new \InvalidArgumentException('Text is required');

    $text = (string)$input['text'];
    $lang = $input['lang'] ?? 'auto';
    $suggest = !empty($input['suggest']);

    $start = microtime(true);
    // analyzeCoherence() returns an array, not an object
    $report = CoherenceAnalyzer::analyzeCoherence($text, $lang);

    $response = [
        'ok' => true,
        'overall' => round((float)($report['overall'] ?? 0), 4),
        'lexical_cohesion' => round((float)($report['lexical_cohesion'] ?? 0), 4),
        'transition_score' => round((float)($report['transition_score'] ?? 0), 4),
        'topic_consistency' => round((float)($report['topic_consistency'] ?? 0), 4),
        'sentence_opening_diversity' => round((float)($report['sentence_opening_diversity'] ?? 0), 4),
        'paragraph_count' => $report['paragraph_count'] ?? 0,
        'avg_paragraph_length' => round((float)($report['avg_paragraph_length'] ?? 0), 1),
        'issues' => $report['issues'] ?? [],
    ];

    if ($suggest) {
        // suggestImprovements() is an instance method
        $analyzer = new CoherenceAnalyzer($lang);
        $suggestions = $analyzer->suggestImprovements($text);
        $response['suggestions'] = $suggestions;
    }

    $elapsed = round((microtime(true) - $start) * 1000, 1);
    $response['elapsed_ms'] = $elapsed;

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(422);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
