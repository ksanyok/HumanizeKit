<?php
/**
 * HumanizeKit API — Info endpoint (v0.8.0)
 * GET: Returns service metadata, tools, capabilities
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'service' => 'HumanizeKit',
    'version' => '0.8.0',
    'engine' => 'TextHumanize PHP v0.8.0',
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
    'tools' => [
        ['id' => 'humanize', 'endpoint' => '/api/humanize', 'method' => 'POST', 'description' => 'Full humanization pipeline (11 stages)'],
        ['id' => 'analyze', 'endpoint' => '/api/analyze', 'method' => 'POST', 'description' => 'Text analysis with AI detection (12 metrics)'],
        ['id' => 'ai-detect', 'endpoint' => '/api/ai-detect', 'method' => 'POST', 'description' => 'AI Detection — 12-metric engine'],
        ['id' => 'tone', 'endpoint' => '/api/tone', 'method' => 'POST', 'description' => 'Tone analysis (7 levels)'],
        ['id' => 'tone-adjust', 'endpoint' => '/api/tone-adjust', 'method' => 'POST', 'description' => 'Tone adjustment toward target'],
        ['id' => 'coherence', 'endpoint' => '/api/coherence', 'method' => 'POST', 'description' => 'Coherence analysis with suggestions'],
        ['id' => 'watermark', 'endpoint' => '/api/watermark', 'method' => 'POST', 'description' => 'Watermark detection & cleaning (6 types)'],
        ['id' => 'spin', 'endpoint' => '/api/spin', 'method' => 'POST', 'description' => 'Content spinner with variants'],
        ['id' => 'paraphrase', 'endpoint' => '/api/paraphrase', 'method' => 'POST', 'description' => 'Rule-based paraphrasing'],
        ['id' => 'explain', 'endpoint' => '/api/explain', 'method' => 'POST', 'description' => 'Explain humanization changes'],
        ['id' => 'extract', 'endpoint' => '/api/extract', 'method' => 'POST', 'description' => 'Extract text from file/URL'],
    ],
    'tones' => ['formal', 'academic', 'professional', 'neutral', 'friendly', 'casual', 'marketing'],
    'watermark_types' => ['zero_width', 'homoglyphs', 'invisible_unicode', 'spacing_steganography', 'statistical_bias', 'metadata'],
    'ai_detection_metrics' => ['entropy', 'burstiness', 'vocabulary', 'zipf', 'stylometry', 'ai_patterns', 'punctuation', 'coherence', 'grammar', 'openings', 'readability', 'rhythm'],
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
