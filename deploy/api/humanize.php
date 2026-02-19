<?php
/**
 * HumanizeKit API — Humanize endpoint
 * POST: Accepts JSON { text, lang, profile, intensity, ... }
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../vendor/autoload.php';

use TextHumanize\TextHumanize;

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['text'])) {
        throw new \InvalidArgumentException('Text is required');
    }

    $text = (string) $input['text'];
    $lang = $input['lang'] ?? null;
    $profile = $input['profile'] ?? 'web';
    // Frontend sends 0.0-1.0, library expects 0-100
    $rawIntensity = $input['intensity'] ?? 0.6;
    $intensity = (int) (is_numeric($rawIntensity) && (float)$rawIntensity <= 1.0
        ? round((float)$rawIntensity * 100)
        : (int)$rawIntensity);
    $seed = isset($input['seed']) ? (int) $input['seed'] : null;

    if ($lang === 'auto') {
        $lang = null;
    }

    $preserve = [];
    if (!empty($input['keep_keywords'])) {
        $preserve['keywords'] = $input['keep_keywords'];
    }

    $constraints = [];

    $start = microtime(true);

    // Use chunked for large texts
    if (mb_strlen($text) > 5000) {
        $result = TextHumanize::humanizeChunked(
            text: $text,
            chunkSize: 5000,
            lang: $lang,
            profile: $profile,
            intensity: $intensity,
            preserve: $preserve,
            constraints: $constraints,
            seed: $seed,
        );
    } else {
        $result = TextHumanize::humanize(
            text: $text,
            lang: $lang,
            profile: $profile,
            intensity: $intensity,
            preserve: $preserve,
            constraints: $constraints,
            seed: $seed,
        );
    }

    $elapsed = round((microtime(true) - $start) * 1000, 1);

    // Analyze before and after
    $reportBefore = TextHumanize::analyze($text, lang: $result->lang);
    $reportAfter = TextHumanize::analyze($result->processed, lang: $result->lang);

    // Get explanation
    $explanation = TextHumanize::explain($text, profile: $profile, intensity: $intensity);

    echo json_encode([
        'ok' => true,
        'original' => $result->original,
        'text' => $result->processed,
        'lang' => $result->lang,
        'profile' => $result->profile,
        'intensity' => $intensity,
        'change_ratio' => round($result->getChangeRatio(), 4),
        'changes' => array_slice($result->changes, 0, 50),
        'elapsed_ms' => $elapsed,
        'explanation' => is_array($explanation) ? ($explanation['summary'] ?? '') : (string) $explanation,
        'metrics_before' => [
            'artificiality_score' => round($reportBefore->artificialityScore, 1),
            'avg_sentence_length' => round($reportBefore->avgSentenceLength, 1),
            'bureaucratic_ratio' => round($reportBefore->bureaucraticRatio, 4),
            'connector_ratio' => round($reportBefore->connectorRatio, 4),
            'repetition_score' => round($reportBefore->repetitionScore, 4),
            'burstiness_score' => round($reportBefore->burstinessScore, 4),
        ],
        'metrics_after' => [
            'artificiality_score' => round($reportAfter->artificialityScore, 1),
            'avg_sentence_length' => round($reportAfter->avgSentenceLength, 1),
            'bureaucratic_ratio' => round($reportAfter->bureaucraticRatio, 4),
            'connector_ratio' => round($reportAfter->connectorRatio, 4),
            'repetition_score' => round($reportAfter->repetitionScore, 4),
            'burstiness_score' => round($reportAfter->burstinessScore, 4),
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
