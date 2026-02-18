<?php
/**
 * Simple PSR-4 autoloader for TextHumanize
 */
spl_autoload_register(function (string $class) {
    $prefix = 'TextHumanize\\';
    $baseDir = __DIR__ . '/ksanyok/text-humanize/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});
