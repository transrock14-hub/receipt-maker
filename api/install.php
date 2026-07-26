<?php
declare(strict_types=1);

/**
 * One-time setup: ensure MySQL schema + create admin user from config.
 * Visit once, then delete or protect this file.
 */
require __DIR__ . '/bootstrap.php';
cors();

header('Content-Type: application/json; charset=utf-8');

try {
  $cfg = app_config();
  if (($cfg['db_driver'] ?? 'mysql') === 'sqlite') {
    fail('Use setup-local.php for SQLite');
  }

  // Gate installer: require ?key= matching install_secret (always in production).
  $provider = (string)($cfg['crypto_provider'] ?? 'demo');
  $secret = trim((string)($cfg['install_secret'] ?? ''));
  $key = (string)($_GET['key'] ?? $_SERVER['HTTP_X_INSTALL_KEY'] ?? '');
  if ($provider !== 'demo') {
    if ($secret === '' || $secret === 'change-me-install') {
      fail('Install locked. Set a strong install_secret in config.local.php', 403);
    }
    if ($key === '' || !hash_equals($secret, $key)) {
      fail('Install key required', 403);
    }
  } elseif ($secret !== '' && $secret !== 'change-me-install') {
    if ($key === '' || !hash_equals($secret, $key)) {
      fail('Install key required', 403);
    }
  }

  ensure_mysql_schema();
  ensure_activity_schema();

  $username = normalize_username((string)($cfg['admin_username'] ?? 'admin'));
  $password = (string)$cfg['admin_password'];
  $name = (string)($cfg['admin_name'] ?? 'Admin');

  validate_username($username);
  if (strlen($password) < 8) {
    fail('Set admin_username and admin_password (8+ chars) in config.local.php');
  }

  $stmt = db()->prepare('SELECT id FROM users WHERE username = ? OR role = \'admin\' LIMIT 1');
  $stmt->execute([$username]);
  $existing = $stmt->fetch();
  if ($existing) {
    // Do not leak usernames once installed — refuse re-install probes
    fail('Already installed. Delete or rename install.php.', 403);
  }

  $hash = password_hash($password, PASSWORD_DEFAULT);
  $until = (new DateTimeImmutable('+10 years'))->format('Y-m-d H:i:s');
  $ins = db()->prepare(
    'INSERT INTO users (username, email, password_hash, name, role, status, paid_until)
     VALUES (?, NULL, ?, ?, \'admin\', \'active\', ?)'
  );
  $ins->execute([$username, $hash, $name, $until]);

  respond([
    'ok' => true,
    'message' => 'Schema ready. Admin created. Log in, then delete or rename install.php.',
    'username' => $username,
  ]);
} catch (Throwable $e) {
  respond(['ok' => false, 'error' => $e->getMessage()], 500);
}

function ensure_mysql_schema(): void {
  $pdo = db();
  $has = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
  if ($has) return;

  $schemaFile = dirname(__DIR__) . '/sql/schema.sql';
  if (!is_file($schemaFile)) {
    // Packaged under public_html/sql or api-adjacent
    $alt = __DIR__ . '/../sql/schema.sql';
    $schemaFile = is_file($alt) ? $alt : $schemaFile;
  }
  if (!is_file($schemaFile)) {
    throw new RuntimeException('schema.sql not found — upload sql/schema.sql next to api/');
  }

  $sql = file_get_contents($schemaFile);
  if ($sql === false || trim($sql) === '') {
    throw new RuntimeException('schema.sql is empty');
  }

  // Strip SQL comments and run statement by statement
  $sql = preg_replace('/^\s*--.*$/m', '', $sql) ?? $sql;
  foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
    if ($stmt === '') continue;
    $pdo->exec($stmt);
  }
}
