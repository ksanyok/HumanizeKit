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
    $maxSize = 10 * 1024 * 1024; // 10MB

    // Check if it's a file upload (multipart/form-data)
    if (!empty($_FILES['file'])) {
        $file = $_FILES['file'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $uploadErrors = [
                UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit',
                UPLOAD_ERR_FORM_SIZE  => 'File exceeds form limit',
                UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder on server',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file on server',
            ];
            throw new \RuntimeException($uploadErrors[$file['error']] ?? 'Upload error code: ' . $file['error']);
        }

        if ($file['size'] > $maxSize) {
            throw new \RuntimeException('File too large (max 10MB)');
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['txt', 'text', 'md', 'markdown', 'html', 'htm', 'csv', 'log', 'rtf', 'pdf', 'docx', 'odt'];

        if (!in_array($ext, $allowed)) {
            throw new \RuntimeException('Unsupported file type: ' . $ext . '. Allowed: ' . implode(', ', $allowed));
        }

        // Extract text based on file type
        switch ($ext) {
            case 'pdf':
                $content = extractTextFromPdf($file['tmp_name']);
                break;
            case 'docx':
                $content = extractTextFromDocx($file['tmp_name']);
                break;
            case 'odt':
                $content = extractTextFromOdt($file['tmp_name']);
                break;
            default:
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
                break;
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
 * Extract text from PDF using pdftotext command
 */
function extractTextFromPdf(string $filePath): string
{
    // Check if pdftotext is available
    $pdftotext = '/usr/bin/pdftotext';
    if (!file_exists($pdftotext)) {
        $pdftotext = trim(shell_exec('which pdftotext 2>/dev/null') ?? '');
    }
    if (!$pdftotext) {
        throw new \RuntimeException('PDF extraction is not available on this server (pdftotext not found)');
    }

    $tmpOut = tempnam(sys_get_temp_dir(), 'hk_pdf_') . '.txt';
    $cmd = escapeshellcmd($pdftotext) . ' -layout ' . escapeshellarg($filePath) . ' ' . escapeshellarg($tmpOut) . ' 2>&1';
    exec($cmd, $output, $exitCode);

    if ($exitCode !== 0 || !file_exists($tmpOut)) {
        @unlink($tmpOut);
        throw new \RuntimeException('PDF extraction failed: ' . implode(' ', $output));
    }

    $text = file_get_contents($tmpOut);
    @unlink($tmpOut);

    if ($text === false || trim($text) === '') {
        throw new \RuntimeException('No text could be extracted from PDF (file may be image-based or empty)');
    }

    return $text;
}

/**
 * Extract text from DOCX (Office Open XML) using ZipArchive
 */
function extractTextFromDocx(string $filePath): string
{
    if (!class_exists('ZipArchive')) {
        throw new \RuntimeException('DOCX extraction not available (zip extension missing)');
    }

    $zip = new \ZipArchive();
    if ($zip->open($filePath) !== true) {
        throw new \RuntimeException('Cannot open DOCX file (invalid or corrupted)');
    }

    $content = $zip->getFromName('word/document.xml');
    $zip->close();

    if ($content === false) {
        throw new \RuntimeException('Cannot read document.xml from DOCX (file may be corrupted)');
    }

    // Parse XML and extract text
    $xml = @simplexml_load_string($content, 'SimpleXMLElement', LIBXML_NOERROR | LIBXML_NOWARNING);
    if ($xml === false) {
        // Fallback: strip XML tags
        $text = strip_tags($content);
        return trim($text);
    }

    $xml->registerXPathNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');

    $paragraphs = [];
    foreach ($xml->xpath('//w:p') as $p) {
        $texts = [];
        foreach ($p->xpath('.//w:t') as $t) {
            $texts[] = (string) $t;
        }
        $line = implode('', $texts);
        if ($line !== '') {
            $paragraphs[] = $line;
        }
    }

    if (empty($paragraphs)) {
        throw new \RuntimeException('No text found in DOCX file');
    }

    return implode("\n\n", $paragraphs);
}

/**
 * Extract text from ODT (OpenDocument Text) using ZipArchive
 */
function extractTextFromOdt(string $filePath): string
{
    if (!class_exists('ZipArchive')) {
        throw new \RuntimeException('ODT extraction not available (zip extension missing)');
    }

    $zip = new \ZipArchive();
    if ($zip->open($filePath) !== true) {
        throw new \RuntimeException('Cannot open ODT file (invalid or corrupted)');
    }

    $content = $zip->getFromName('content.xml');
    $zip->close();

    if ($content === false) {
        throw new \RuntimeException('Cannot read content.xml from ODT');
    }

    // Strip XML tags and extract text
    $text = strip_tags($content);
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    if (trim($text) === '') {
        throw new \RuntimeException('No text found in ODT file');
    }

    return $text;
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
