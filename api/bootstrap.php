<?php
declare(strict_types=1);

function app_config(): array {
  static $cfg = null;
  if ($cfg !== null) return $cfg;
  $base = require __DIR__ . '/config.example.php';
  $local = __DIR__ . '/config.local.php';
  if (is_file($local)) {
    $base = array_merge($base, require $local);
  }
  $cfg = $base;
  return $cfg;
}

function db_driver(): string {
  return strtolower((string)(app_config()['db_driver'] ?? 'mysql'));
}

/** SQL expression for current timestamp (MySQL or SQLite). */
function sql_now(): string {
  return db_driver() === 'sqlite' ? "datetime('now')" : 'NOW()';
}

function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;
  $c = app_config();
  $driver = db_driver();

  if ($driver === 'sqlite') {
    $path = $c['sqlite_path'] ?? (__DIR__ . '/data/local.sqlite');
    $dir = dirname($path);
    if (!is_dir($dir)) {
      mkdir($dir, 0775, true);
    }
    $pdo = new PDO('sqlite:' . $path, null, null, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    return $pdo;
  }

  $dsn = sprintf(
    'mysql:host=%s;dbname=%s;charset=%s',
    $c['db_host'],
    $c['db_name'],
    $c['db_charset'] ?? 'utf8mb4'
  );
  $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function json_input(): array {
  $raw = file_get_contents('php://input') ?: '';
  if ($raw === '') return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function respond(array $data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_SLASHES);
  exit;
}

function fail(string $message, int $code = 400): void {
  respond(['ok' => false, 'error' => $message], $code);
}

function cors(): void {
  security_headers();
  $cfg = app_config();
  $allowed = trim((string)($cfg['cors_origin'] ?? ''));
  $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

  // Never reflect arbitrary Origin. Pin to configured app origin (or omit CORS).
  if ($allowed !== '' && $allowed !== '*') {
    if ($requestOrigin !== '' && strcasecmp($requestOrigin, $allowed) === 0) {
      header('Access-Control-Allow-Origin: ' . $allowed);
      header('Vary: Origin');
      header('Access-Control-Allow-Credentials: true');
    } elseif ($requestOrigin === '') {
      // Same-origin browser navigations / curl — no ACAO needed
    } else {
      // Cross-origin mismatch: do not grant CORS
    }
  } elseif ($allowed === '*') {
    // Credentials cannot be used with *; keep simple public read for local demos only
    header('Access-Control-Allow-Origin: *');
  }

  header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-Token');
  header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

/** Baseline API response hardening. */
function security_headers(): void {
  header('X-Content-Type-Options: nosniff');
  header('X-Frame-Options: DENY');
  header('Referrer-Policy: strict-origin-when-cross-origin');
  header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');
  header('Cache-Control: no-store');
}

function bearer_token(): ?string {
  $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
  if (preg_match('/Bearer\s+(\S+)/i', $hdr, $m)) return $m[1];
  $alt = $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
  return $alt !== '' ? $alt : null;
}

function user_access(array $user): array {
  $now = time();
  $banned = ($user['status'] ?? '') === 'banned';
  $trialEnds = !empty($user['trial_ends_at']) ? strtotime($user['trial_ends_at']) : 0;
  $paidUntil = !empty($user['paid_until']) ? strtotime($user['paid_until']) : 0;
  $trialActive = $trialEnds > $now;
  $paidActive = $paidUntil > $now;
  $active = !$banned && ($trialActive || $paidActive || ($user['role'] ?? '') === 'admin');
  return [
    'active' => $active,
    'banned' => $banned,
    'trial_active' => $trialActive,
    'paid_active' => $paidActive,
    'trial_ends_at' => $user['trial_ends_at'],
    'paid_until' => $user['paid_until'],
    'can_download' => $active,
  ];
}

function public_user(array $user): array {
  $access = user_access($user);
  return [
    'id' => (int)$user['id'],
    'username' => $user['username'] ?? '',
    'email' => $user['email'] ?? null,
    'name' => $user['name'],
    'role' => $user['role'],
    'status' => $user['status'],
    'access' => $access,
  ];
}

function normalize_username(string $raw): string {
  $u = strtolower(trim($raw));
  $u = preg_replace('/\s+/', '', $u) ?? '';
  return $u;
}

function validate_username(string $username): void {
  if ($username === '' || strlen($username) < 3) {
    fail('Username must be at least 3 characters');
  }
  if (strlen($username) > 80) fail('Username too long');
  if (!preg_match('/^[a-z0-9._-]+$/', $username)) {
    fail('Username may only use letters, numbers, dot, underscore, hyphen');
  }
}

function find_user_by_login(string $login): ?array {
  $login = trim($login);
  if ($login === '') return null;
  $username = normalize_username($login);
  $stmt = db()->prepare(
    'SELECT * FROM users WHERE username = ? OR lower(email) = lower(?) LIMIT 1'
  );
  $stmt->execute([$username, $login]);
  $user = $stmt->fetch();
  return $user ?: null;
}

function create_session(int $userId): string {
  $token = bin2hex(random_bytes(32));
  $days = (int)(app_config()['session_days'] ?? 30);
  $expires = (new DateTimeImmutable("+{$days} days"))->format('Y-m-d H:i:s');
  $stmt = db()->prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)');
  $stmt->execute([$token, $userId, $expires]);
  return $token;
}

function current_user(): ?array {
  $token = bearer_token();
  if (!$token) return null;
  $stmt = db()->prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ' . sql_now() . ' LIMIT 1'
  );
  $stmt->execute([$token]);
  $user = $stmt->fetch();
  return $user ?: null;
}

function require_user(): array {
  $user = current_user();
  if (!$user) fail('Unauthorized', 401);
  if (($user['status'] ?? '') === 'banned') fail('Account banned', 403);
  return $user;
}

function require_admin(): array {
  $user = require_user();
  if (($user['role'] ?? '') !== 'admin') fail('Admin only', 403);
  return $user;
}

function log_admin(int $adminId, string $action, ?int $targetId = null, ?array $meta = null): void {
  $stmt = db()->prepare(
    'INSERT INTO admin_actions (admin_id, target_user_id, action, meta) VALUES (?, ?, ?, ?)'
  );
  $stmt->execute([
    $adminId,
    $targetId,
    $action,
    $meta ? json_encode($meta) : null,
  ]);
}

/** Ensure activity_events exists on older installs (CREATE IF NOT EXISTS). */
function ensure_activity_schema(): void {
  static $done = false;
  if ($done) return;
  $done = true;
  $pdo = db();
  if (db_driver() === 'sqlite') {
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS activity_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NULL,
        username TEXT NULL,
        action TEXT NOT NULL,
        detail TEXT NULL,
        meta TEXT NULL,
        ip TEXT NULL,
        user_agent TEXT NULL,
        country TEXT NULL,
        region TEXT NULL,
        city TEXT NULL,
        timezone TEXT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )"
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_events(created_at)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_events(user_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_events(action)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_activity_ip ON activity_events(ip)');
    return;
  }

  $pdo->exec(
    "CREATE TABLE IF NOT EXISTS activity_events (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NULL,
      username VARCHAR(80) NULL,
      action VARCHAR(64) NOT NULL,
      detail VARCHAR(255) NULL,
      meta TEXT NULL,
      ip VARCHAR(64) NULL,
      user_agent VARCHAR(500) NULL,
      country VARCHAR(80) NULL,
      region VARCHAR(120) NULL,
      city VARCHAR(120) NULL,
      timezone VARCHAR(80) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activity_created (created_at),
      INDEX idx_activity_user (user_id),
      INDEX idx_activity_action (action),
      INDEX idx_activity_ip (ip),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
  );
}

/** Invite codes for invite-only registration (auto-migrates on live). */
function ensure_invites_schema(): void {
  $pdo = db();
  if (db_driver() === 'sqlite') {
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        created_by INTEGER NULL,
        note TEXT NULL,
        max_uses INTEGER NOT NULL DEFAULT 1,
        uses INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT NULL,
        revoked_at TEXT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_used_at TEXT NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )"
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_invites_created ON invites(created_at)');
    return;
  }

  $pdo->exec(
    "CREATE TABLE IF NOT EXISTS invites (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(32) NOT NULL UNIQUE,
      created_by INT UNSIGNED NULL,
      note VARCHAR(255) NULL,
      max_uses INT UNSIGNED NOT NULL DEFAULT 1,
      uses INT UNSIGNED NOT NULL DEFAULT 0,
      expires_at DATETIME NULL,
      revoked_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME NULL,
      INDEX idx_invites_code (code),
      INDEX idx_invites_created (created_at),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
  );
}

/** Key/value app settings (support contacts, etc.). */
function ensure_settings_schema(): void {
  static $done = false;
  if ($done) return;
  $done = true;
  $pdo = db();
  if (db_driver() === 'sqlite') {
    $pdo->exec(
      "CREATE TABLE IF NOT EXISTS app_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )"
    );
    return;
  }
  $pdo->exec(
    "CREATE TABLE IF NOT EXISTS app_settings (
      setting_key VARCHAR(64) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
  );
}

function setting_get(string $key, string $default = ''): string {
  ensure_settings_schema();
  $stmt = db()->prepare('SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1');
  $stmt->execute([$key]);
  $row = $stmt->fetch();
  if (!$row) return $default;
  return (string)$row['setting_value'];
}

function setting_set(string $key, string $value): void {
  ensure_settings_schema();
  if (db_driver() === 'sqlite') {
    db()->prepare(
      'INSERT INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ' . sql_now() . ')
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = ' . sql_now()
    )->execute([$key, $value]);
    return;
  }
  db()->prepare(
    'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
  )->execute([$key, $value]);
}

/** Normalize Telegram handle/URL → https://t.me/... or empty. */
function normalize_telegram(string $raw): string {
  $raw = trim($raw);
  if ($raw === '') return '';
  if (preg_match('#^https?://#i', $raw)) {
    return preg_replace('#^http://#i', 'https://', $raw) ?? $raw;
  }
  $raw = ltrim($raw, '@');
  $raw = preg_replace('#^(t\.me/|telegram\.me/)#i', '', $raw) ?? $raw;
  $raw = preg_replace('/[^A-Za-z0-9_]/', '', $raw) ?? '';
  if ($raw === '') return '';
  return 'https://t.me/' . $raw;
}

/** Normalize WhatsApp number/URL → https://wa.me/... or empty. */
function normalize_whatsapp(string $raw): string {
  $raw = trim($raw);
  if ($raw === '') return '';
  if (preg_match('#^https?://#i', $raw)) {
    return preg_replace('#^http://#i', 'https://', $raw) ?? $raw;
  }
  $digits = preg_replace('/\D+/', '', $raw) ?? '';
  if ($digits === '' || strlen($digits) < 8) return '';
  return 'https://wa.me/' . $digits;
}

function public_support(): array {
  $telegram = normalize_telegram(setting_get('support_telegram', ''));
  $whatsapp = normalize_whatsapp(setting_get('support_whatsapp', ''));
  $message = trim(setting_get('support_message', 'Need help? Chat with support.'));
  if ($message === '') $message = 'Need help? Chat with support.';
  return [
    'telegram_url' => $telegram !== '' ? $telegram : null,
    'whatsapp_url' => $whatsapp !== '' ? $whatsapp : null,
    'message' => $message,
    'enabled' => $telegram !== '' || $whatsapp !== '',
  ];
}

function client_ip(): string {
  $candidates = [
    $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',
    $_SERVER['HTTP_TRUE_CLIENT_IP'] ?? '',
    $_SERVER['HTTP_X_REAL_IP'] ?? '',
    '',
  ];
  $xff = (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
  if ($xff !== '') {
    $first = trim(explode(',', $xff)[0]);
    $candidates[] = $first;
  }
  $candidates[] = (string)($_SERVER['REMOTE_ADDR'] ?? '');

  foreach ($candidates as $ip) {
    $ip = trim((string)$ip);
    if ($ip !== '' && filter_var($ip, FILTER_VALIDATE_IP)) {
      return $ip;
    }
  }
  return '';
}

function client_user_agent(): string {
  $ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
  if (strlen($ua) > 480) $ua = substr($ua, 0, 480);
  return $ua;
}

/**
 * Best-effort location: Cloudflare country header, then optional ip-api lookup.
 * Never blocks the request for more than ~1s.
 */
function resolve_location(string $ip, ?string $timezoneHint = null): array {
  $country = trim((string)($_SERVER['HTTP_CF_IPCOUNTRY'] ?? ''));
  if ($country === 'XX' || $country === 'T1') $country = '';
  $region = '';
  $city = '';
  $timezone = $timezoneHint ? substr(trim($timezoneHint), 0, 80) : '';

  $private = $ip === '' || !filter_var(
    $ip,
    FILTER_VALIDATE_IP,
    FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
  );

  if (!$private && ($country === '' || $city === '')) {
    $geo = lookup_ip_geo($ip);
    if ($geo) {
      if ($country === '' && !empty($geo['country'])) $country = (string)$geo['country'];
      if (!empty($geo['region'])) $region = (string)$geo['region'];
      if (!empty($geo['city'])) $city = (string)$geo['city'];
      if ($timezone === '' && !empty($geo['timezone'])) $timezone = (string)$geo['timezone'];
    }
  }

  if ($private && $country === '') {
    $country = 'Local';
  }

  return [
    'country' => $country !== '' ? substr($country, 0, 80) : null,
    'region' => $region !== '' ? substr($region, 0, 120) : null,
    'city' => $city !== '' ? substr($city, 0, 120) : null,
    'timezone' => $timezone !== '' ? substr($timezone, 0, 80) : null,
  ];
}

function lookup_ip_geo(string $ip): ?array {
  static $cache = [];
  if (isset($cache[$ip])) return $cache[$ip];

  $url = 'http://ip-api.com/json/' . rawurlencode($ip) . '?fields=status,country,regionName,city,timezone';
  $ctx = stream_context_create([
    'http' => [
      'method' => 'GET',
      'timeout' => 1.2,
      'ignore_errors' => true,
      'header' => "Accept: application/json\r\n",
    ],
  ]);
  $raw = @file_get_contents($url, false, $ctx);
  if ($raw === false || $raw === '') {
    $cache[$ip] = null;
    return null;
  }
  $data = json_decode($raw, true);
  if (!is_array($data) || ($data['status'] ?? '') !== 'success') {
    $cache[$ip] = null;
    return null;
  }
  $out = [
    'country' => $data['country'] ?? null,
    'region' => $data['regionName'] ?? null,
    'city' => $data['city'] ?? null,
    'timezone' => $data['timezone'] ?? null,
  ];
  $cache[$ip] = $out;
  return $out;
}

/**
 * Platform activity log — logins, actions, IP, location.
 * Safe to call even if schema was just created.
 */
function log_activity(
  string $action,
  ?array $user = null,
  ?string $detail = null,
  ?array $meta = null,
  ?string $timezoneHint = null,
): void {
  try {
    ensure_activity_schema();
    $ip = client_ip();
    $geo = resolve_location($ip, $timezoneHint ?? ($meta['timezone'] ?? null));
    $username = null;
    $userId = null;
    if ($user) {
      $userId = isset($user['id']) ? (int)$user['id'] : null;
      $username = isset($user['username']) ? (string)$user['username'] : null;
    } elseif (isset($meta['username'])) {
      $username = (string)$meta['username'];
    }

    $stmt = db()->prepare(
      'INSERT INTO activity_events
        (user_id, username, action, detail, meta, ip, user_agent, country, region, city, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
      $userId,
      $username,
      substr($action, 0, 64),
      $detail !== null ? substr($detail, 0, 255) : null,
      $meta ? json_encode($meta, JSON_UNESCAPED_SLASHES) : null,
      $ip !== '' ? substr($ip, 0, 64) : null,
      client_user_agent() ?: null,
      $geo['country'],
      $geo['region'],
      $geo['city'],
      $geo['timezone'],
    ]);
  } catch (Throwable $e) {
    // Never break product flows because logging failed
  }
}

function format_location(?string $city, ?string $region, ?string $country, ?string $timezone = null): string {
  $parts = array_values(array_filter([$city, $region, $country], static fn($x) => $x !== null && $x !== ''));
  $loc = $parts ? implode(', ', $parts) : 'Unknown';
  if ($timezone) $loc .= ' · ' . $timezone;
  return $loc;
}

function revoke_user_sessions(int $userId): void {
  db()->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$userId]);
}

/** Simple IP rate limit using activity_events (best-effort, no extra tables). */
function rate_limit(string $bucket, int $max, int $windowSeconds): void {
  ensure_activity_schema();
  $ip = client_ip() ?: 'unknown';
  $action = 'rate_' . $bucket;
  $sinceExpr = db_driver() === 'sqlite'
    ? "datetime('now', '-{$windowSeconds} seconds')"
    : "DATE_SUB(NOW(), INTERVAL {$windowSeconds} SECOND)";
  try {
    $stmt = db()->prepare(
      "SELECT COUNT(*) c FROM activity_events WHERE action = ? AND ip = ? AND created_at >= {$sinceExpr}"
    );
    $stmt->execute([$action, $ip]);
    $count = (int)($stmt->fetch()['c'] ?? 0);
    if ($count >= $max) {
      fail('Too many attempts. Please wait and try again.', 429);
    }
    // Record attempt slot (meta-less) — use log_activity path carefully to avoid recursion
    $ins = db()->prepare(
      'INSERT INTO activity_events (user_id, username, action, detail, meta, ip, user_agent, created_at)
       VALUES (NULL, NULL, ?, ?, NULL, ?, ?, ' . sql_now() . ')'
    );
    $ins->execute([$action, $bucket, $ip, substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 400)]);
  } catch (Throwable $e) {
    // Never block auth if activity table missing mid-migration
  }
}

function extend_paid_until(?string $current, int $days): string {
  $base = time();
  if ($current) {
    $t = strtotime($current);
    if ($t > $base) $base = $t;
  }
  return date('Y-m-d H:i:s', $base + ($days * 86400));
}
