#!/usr/bin/env php
<?php
/**
 * Initialize local SQLite DB + admin user for preview.
 * Usage: php api/setup-local.php
 */
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$cfg = app_config();
if (($cfg['db_driver'] ?? '') !== 'sqlite') {
  fwrite(STDERR, "config.local.php must set db_driver => sqlite for this script.\n");
  exit(1);
}

$path = $cfg['sqlite_path'] ?? (__DIR__ . '/data/local.sqlite');
if (is_file($path)) {
  unlink($path);
}

$pdo = db();
$sql = file_get_contents(dirname(__DIR__) . '/sql/schema.sqlite.sql');
if ($sql === false) {
  fwrite(STDERR, "Missing sql/schema.sqlite.sql\n");
  exit(1);
}
$pdo->exec($sql);

$username = normalize_username((string)($cfg['admin_username'] ?? 'admin'));
$password = (string)$cfg['admin_password'];
$name = (string)($cfg['admin_name'] ?? 'Admin');
validate_username($username);

$hash = password_hash($password, PASSWORD_DEFAULT);
$until = (new DateTimeImmutable('+10 years'))->format('Y-m-d H:i:s');
$ins = $pdo->prepare(
  'INSERT INTO users (username, email, password_hash, name, role, status, paid_until)
   VALUES (?, NULL, ?, ?, ?, ?, ?)'
);
$ins->execute([$username, $hash, $name, 'admin', 'active', $until]);

echo "Admin created: {$username} / {$password}\n";
echo "SQLite ready: {$path}\n";
echo "Next: npm run dev:api   and   npm run dev\n";
