<?php
/**
 * HumanizeKit API — Extract endpoint
 * POST: Accepts file upload or URL to extract text content
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

try {
    $maxSize = 1024 * 1024; // 1MB

    // Check if it's a file upload (multipart/form-data)
    if (!empty($_FILES['file'])) {
        $file = $_FILES['file'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \RuntimeException('File upload error: ' . $file['error']);
        }

        if ($file['size'] > $maxSize) {
            throw new \RuntimeException('File too large (max 1MB)');
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['txt', 'text', 'md', 'markdown', 'html', 'htm', 'csv', 'log', 'rtf'];

        if (!in_array($ext, $allowed)) {
            throw new \RuntimeException('Unsupported file type: ' . $ext . '. Allowed: ' . implode(', ', $allowed));
        }

        $content = file_get_contents($file['tmp_name']);

        if ($content === false) {
            throw new \RuntimeException('Cannot read uploaded file');
        }

        // Detect encoding and convert to UTF-8
        $encoding = mb_detect_encoding($content, ['UTF-8', 'Windows-1251', 'ISO-8859-1', 'KOI8-R', 'CP1252'], true);
        if ($encoding && $encoding !== 'UTF-8') {
            $content = mb_convert_encoding($content, 'UTF-8', $encoding);
        }

        // Strip HTML tags if HTML file
        if (in_array($ext, ['html', 'htm'])) {
            $content = extractTextFromHtml($content);
        }

        // Clean up
        $content = cleanText($content);

        echo json_encode([
            'ok' => true,
            'text' => $content,
            'source' => 'file',
            'filename' => $file['name'],
            'chars' => mb_strlen($content),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Check if it's a JSON body with URL
    $input = json_decode(file_get_contents('php://input'), true);

    if (!empty($input['url'])) {
        $url = filter_var($input['url'], FILTER_VALIDATE_URL);

        if (!$url) {
            throw new \RuntimeException('Invalid URL');
        }

        // Only allow http/https
        $scheme = parse_url($url, PHP_URL_SCHEME);
        if (!in_array($scheme, ['http', 'https'])) {
            throw new \RuntimeException('Only HTTP/HTTPS URLs are supported');
        }

        // Fetch URL content
        $context = stream_context_create([
            'http' => [
                'timeout' => 10,
                'user_agent' => 'HumanizeKit/1.0 TextExtractor',
                'follow_location' => 1,
                'max_redirects' => 3,
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
            ],
        ]);

        $html = @file_get_contents($url, false, $context);

        if ($html === false) {
            throw new \RuntimeException('Cannot fetch URL content');
        }

        if (strlen($html) > $maxSize * 5) {
            $html = substr($html, 0, $maxSize * 5);
        }

        // Extract text from HTML
        $text = extractTextFromHtml($html);
        $text = cleanText($text);

        // Trim if too long
        if (mb_strlen($text) > 50000) {
            $text = mb_substr($text, 0, 50000) . '...';
        }

        echo json_encode([
            'ok' => true,
            'text' => $text,
            'source' => 'url',
            'url' => $url,
            'chars' => mb_strlen($text),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    throw new \RuntimeException('No file or URL provided. Send a file via multipart/form-data or JSON with {"url": "..."}');

} catch (\Throwable $e) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * Extract readable text from HTML content
 */
function extractTextFromHtml(string $html): string
{
    // Remove script and style tags with content
    $html = preg_replace('/<script\b[^>]*>.*?<\/script>/si', '', $html);
    $html = preg_replace('/<style\b[^>]*>.*?<\/style>/si', '', $html);
    $html = preg_replace('/<noscript\b[^>]*>.*?<\/noscript>/si', '', $html);
    $html = preg_replace('/<!--.*?-->/s', '', $html);

    // Convert common block elements to newlines
    $html = preg_replace('/<(br|hr)\s*\/?>/i', "\n", $html);
    $html = preg_replace('/<\/(p|div|h[1-6]|li|tr|blockquote|article|section|header|footer)>/i', "\n\n", $html);
    $html = preg_replace('/<\/?(ul|ol|nav|aside|main|figure|figcaption|details|summary)>/i', "\n", $html);

    // Strip remaining HTML tags
    $text = strip_tags($html);

    // Decode HTML entities
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    return $text;
}

/**
 * Clean extracted text
 */
function cleanText(string $text): string
{
    // Normalize line endings
    $text = str_replace(["\r\n", "\r"], "\n", $text);

    // Remove excessive blank lines (more than 2 consecutive)
    $text = preg_replace("/\n{3,}/", "\n\n", $text);

    // Remove leading/trailing whitespace on each line
    $lines = explode("\n", $text);
    $lines = array_map('trim', $lines);
    $text = implode("\n", $lines);

    // Remove leading/trailing whitespace
    $text = trim($text);

    return $text;
}
