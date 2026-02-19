<?php
/**
 * HumanizeKit API — Analyze endpoint (v0.8.0 — uses AIDetector 12 metrics)
 * POST: Accepts JSON { text, lang }
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../vendor/autoload.php';

use TextHumanize\TextHumanize;
use TextHumanize\AIDetector;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['text'])) throw new \InvalidArgumentException('Text is required');

    $text = (string)$input['text'];
    $lang = $input['lang'] ?? 'auto';

    $start = microtime(true);

    $report = TextHumanize::analyze($text, lang: $lang === 'auto' ? null : $lang);
    $aiResult = AIDetector::detectAi($text, $lang);

    // Text statistics
    $charCount = mb_strlen($text);
    $charNoSpaces = mb_strlen(preg_replace('/\s/', '', $text));
    $words = preg_split('/\s+/', trim($text), -1, PREG_SPLIT_NO_EMPTY);
    $wordCount = count($words);
    $sentences = preg_split('/[.!?]+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY);
    $sentenceCount = count(array_filter($sentences, fn($s) => trim($s) !== ''));
    $paragraphs = preg_split('/\n\s*\n/', trim($text), -1, PREG_SPLIT_NO_EMPTY);
    $paragraphCount = count($paragraphs);

    $totalWordLen = 0;
    foreach ($words as $w) $totalWordLen += mb_strlen($w);
    $avgWordLen = $wordCount > 0 ? round($totalWordLen / $wordCount, 1) : 0;
    $readingTimeSec = $wordCount > 0 ? round(($wordCount / 200) * 60) : 0;
    $uniqueWords = count(array_unique(array_map('mb_strtolower', $words)));
    $uniqueRatio = $wordCount > 0 ? round($uniqueWords / $wordCount, 3) : 0;

    $elapsed = round((microtime(true) - $start) * 1000, 1);

    echo json_encode([
        'ok' => true,
        'lang' => $report->lang ?? $lang,
        'artificiality_score' => round($report->artificialityScore, 1),
        'avg_sentence_length' => round($report->avgSentenceLength, 1),
        'bureaucratic_ratio' => round($report->bureaucraticRatio, 4),
        'connector_ratio' => round($report->connectorRatio, 4),
        'repetition_score' => round($report->repetitionScore, 4),
        'burstiness_score' => round($report->burstinessScore, 4),
        'stats' => [
            'characters' => $charCount,
            'characters_no_spaces' => $charNoSpaces,
            'words' => $wordCount,
            'sentences' => $sentenceCount,
            'paragraphs' => $paragraphCount,
            'avg_word_length' => $avgWordLen,
            'unique_words' => $uniqueWords,
            'unique_ratio' => $uniqueRatio,
            'reading_time_sec' => $readingTimeSec,
        ],
        'ai_detection' => [
            'ai_probability' => round($aiResult->aiProbability, 4),
            'human_probability' => round($aiResult->humanProbability(), 4),
            'confidence' => round($aiResult->confidence, 4),
            'verdict' => $aiResult->verdict,
            'scores' => [
                'entropy' => round($aiResult->entropyScore, 4),
                'burstiness' => round($aiResult->burstinessScore, 4),
                'vocabulary' => round($aiResult->vocabularyScore, 4),
                'zipf' => round($aiResult->zipfScore, 4),
                'stylometry' => round($aiResult->stylometryScore, 4),
                'ai_patterns' => round($aiResult->patternScore, 4),
                'punctuation' => round($aiResult->punctuationScore, 4),
                'coherence' => round($aiResult->coherenceScore, 4),
                'grammar' => round($aiResult->grammarScore, 4),
                'openings' => round($aiResult->openingScore, 4),
                'readability' => round($aiResult->readabilityScore, 4),
                'rhythm' => round($aiResult->rhythmScore, 4),
            ],
            'summary' => $aiResult->summary(),
        ],
        'elapsed_ms' => $elapsed,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
