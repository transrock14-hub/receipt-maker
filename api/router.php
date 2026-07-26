<?php
/**
 * Router for PHP built-in server so /auth/login etc. hit index.php.
 * Usage: php -S 127.0.0.1:8080 -t api api/router.php
 */
declare(strict_types=1);

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$file = __DIR__ . $uri;

if ($uri !== '/' && is_file($file)) {
  return false;
}

require __DIR__ . '/index.php';
