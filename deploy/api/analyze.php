<?php
/**
 * HumanizeKit API — Analyze endpoint
 * POST: Accepts JSON { text, lang }
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
    if ($lang === 'auto') {
        $lang = null;
    }

    $report = TextHumanize::analyze($text, lang: $lang);

    // Text statistics
    $charCount = mb_strlen($text);
    $charNoSpaces = mb_strlen(preg_replace('/\s/', '', $text));
    $words = preg_split('/\s+/', trim($text), -1, PREG_SPLIT_NO_EMPTY);
    $wordCount = count($words);
    $sentences = preg_split('/[.!?]+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY);
    $sentenceCount = count(array_filter($sentences, fn($s) => trim($s) !== ''));
    $paragraphs = preg_split('/\n\s*\n/', trim($text), -1, PREG_SPLIT_NO_EMPTY);
    $paragraphCount = count($paragraphs);

    // Average word length
    $totalWordLen = 0;
    foreach ($words as $w) {
        $totalWordLen += mb_strlen($w);
    }
    $avgWordLen = $wordCount > 0 ? round($totalWordLen / $wordCount, 1) : 0;

    // Reading time (200 wpm average)
    $readingTimeSec = $wordCount > 0 ? round(($wordCount / 200) * 60) : 0;

    // Unique words ratio
    $uniqueWords = count(array_unique(array_map('mb_strtolower', $words)));
    $uniqueRatio = $wordCount > 0 ? round($uniqueWords / $wordCount, 3) : 0;

    // AI detection heuristic score
    $aiScore = computeAiScore($report, $wordCount, $uniqueRatio);

    echo json_encode([
        'ok' => true,
        'lang' => $report->lang ?? $lang ?? 'auto',
        'artificiality_score' => round($report->artificialityScore, 1),
        'avg_sentence_length' => round($report->avgSentenceLength, 1),
        'bureaucratic_ratio' => round($report->bureaucraticRatio, 4),
        'connector_ratio' => round($report->connectorRatio, 4),
        'repetition_score' => round($report->repetitionScore, 4),
        'burstiness_score' => round($report->burstinessScore, 4),
        'total_words' => $wordCount,
        'total_sentences' => $sentenceCount,
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
            'score' => $aiScore,
            'label' => aiLabel($aiScore),
            'factors' => aiFactors($report, $uniqueRatio),
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * Heuristic AI detection score (0-100).
 * Higher = more likely AI-generated.
 */
function computeAiScore(object $report, int $wordCount, float $uniqueRatio): int
{
    $score = 0;

    // 1. Artificiality score is the main signal
    $score += min(40, round($report->artificialityScore * 0.5));

    // 2. High bureaucratic ratio → AI tends to use formal language
    if ($report->bureaucraticRatio > 0.15) {
        $score += min(15, round($report->bureaucraticRatio * 50));
    }

    // 3. High connector ratio → AI uses many connectors
    if ($report->connectorRatio > 0.3) {
        $score += min(10, round($report->connectorRatio * 15));
    }

    // 4. Low burstiness → AI writes uniform sentences
    if ($report->burstinessScore < 0.4) {
        $score += round((0.4 - $report->burstinessScore) * 25);
    }

    // 5. Low repetition in long texts is suspicious
    if ($wordCount > 100 && $report->repetitionScore < 0.05) {
        $score += 5;
    }

    // 6. Low unique word ratio → repetitive vocabulary
    if ($uniqueRatio < 0.5 && $wordCount > 50) {
        $score += round((0.5 - $uniqueRatio) * 20);
    }

    // 7. Very uniform sentence length
    if ($report->avgSentenceLength > 12 && $report->avgSentenceLength < 22 && $report->burstinessScore < 0.3) {
        $score += 8;
    }

    return min(99, max(1, (int) $score));
}

function aiLabel(int $score): string
{
    if ($score >= 80) return 'Highly likely AI-generated';
    if ($score >= 60) return 'Likely AI-generated';
    if ($score >= 40) return 'Possibly AI-generated';
    if ($score >= 20) return 'Mostly human-written';
    return 'Likely human-written';
}

function aiFactors(object $report, float $uniqueRatio): array
{
    // All values normalized to 0.0 - 1.0 for consistent frontend rendering
    $factors = [];

    $factors[] = [
        'name' => 'Artificiality',
        'value' => round(min(1.0, $report->artificialityScore / 100), 3),
    ];
    $factors[] = [
        'name' => 'Bureaucratic Language',
        'value' => round(min(1.0, $report->bureaucraticRatio), 3),
    ];
    $factors[] = [
        'name' => 'Connector Density',
        'value' => round(min(1.0, $report->connectorRatio), 3),
    ];
    $factors[] = [
        'name' => 'Sentence Uniformity',
        'value' => round(min(1.0, max(0, 1.0 - $report->burstinessScore)), 3),
    ];
    $factors[] = [
        'name' => 'Vocabulary Diversity',
        'value' => round(min(1.0, $uniqueRatio), 3),
    ];
    $factors[] = [
        'name' => 'Repetition Level',
        'value' => round(min(1.0, $report->repetitionScore), 3),
    ];

    return $factors;
}
