<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/rates.php';
cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';
// Support both /api/... and root when document root is /api
$path = preg_replace('#^/api#', '', $path) ?: '/';
$path = rtrim($path, '/') ?: '/';

try {
  ensure_activity_schema();
  route($method, $path);
} catch (Throwable $e) {
  respond([
    'ok' => false,
    'error' => 'Server error',
    'detail' => app_config()['crypto_provider'] === 'demo' ? $e->getMessage() : null,
  ], 500);
}

function route(string $method, string $path): void {
  if ($method === 'GET' && $path === '/health') {
    respond(['ok' => true, 'service' => 'receipt-maker-api']);
  }

  if ($method === 'POST' && $path === '/auth/register') {
    handle_register();
  }
  if ($method === 'POST' && $path === '/auth/login') {
    handle_login();
  }
  if ($method === 'POST' && $path === '/auth/logout') {
    handle_logout();
  }
  if ($method === 'GET' && $path === '/auth/me') {
    handle_me();
  }

  if ($method === 'POST' && $path === '/activity') {
    handle_activity_track();
  }
  if ($method === 'POST' && $path === '/export/check') {
    handle_export_check();
  }

  if ($method === 'GET' && $path === '/plans') {
    handle_plans();
  }
  if ($method === 'POST' && $path === '/payments/create') {
    handle_payment_create();
  }
  if ($method === 'GET' && $path === '/payments/mine') {
    handle_payments_mine();
  }
  if ($method === 'POST' && $path === '/webhooks/nowpayments') {
    handle_nowpayments_webhook();
  }
  // Demo unlock (local / testing only)
  if ($method === 'POST' && $path === '/payments/demo-complete') {
    handle_demo_complete();
  }

  if ($method === 'GET' && $path === '/admin/users') {
    handle_admin_users();
  }
  if ($method === 'POST' && $path === '/admin/users/create') {
    handle_admin_user_create();
  }
  if ($method === 'POST' && $path === '/admin/users/update') {
    handle_admin_user_update();
  }
  if ($method === 'GET' && $path === '/admin/payments') {
    handle_admin_payments();
  }
  if ($method === 'GET' && $path === '/admin/stats') {
    handle_admin_stats();
  }
  if ($method === 'GET' && $path === '/admin/activity') {
    handle_admin_activity();
  }

  if ($method === 'GET' && $path === '/rates') {
    handle_rates();
  }
  if ($method === 'GET' && ($path === '/cron/rates' || $path === '/rates/refresh')) {
    handle_rates_cron();
  }

  fail('Not found', 404);
}

function handle_register(): void {
  rate_limit('register', 5, 600);
  $body = json_input();
  $username = normalize_username((string)($body['username'] ?? $body['email'] ?? ''));
  $password = (string)($body['password'] ?? '');
  $name = trim((string)($body['name'] ?? ''));
  $timezone = isset($body['timezone']) ? (string)$body['timezone'] : null;

  validate_username($username);
  if (strlen($password) < 8) fail('Password must be at least 8 characters');
  if ($name === '') $name = $username;

  $exists = db()->prepare('SELECT id FROM users WHERE username = ?');
  $exists->execute([$username]);
  if ($exists->fetch()) fail('Username already taken', 409);

  $trialDays = (int)(app_config()['trial_days'] ?? 3);
  $trialEnds = (new DateTimeImmutable("+{$trialDays} days"))->format('Y-m-d H:i:s');
  $hash = password_hash($password, PASSWORD_DEFAULT);

  $stmt = db()->prepare(
    'INSERT INTO users (username, email, password_hash, name, role, status, trial_ends_at)
     VALUES (?, NULL, ?, ?, \'user\', \'active\', ?)'
  );
  $stmt->execute([$username, $hash, $name, $trialEnds]);
  $userId = (int)db()->lastInsertId();

  $token = create_session($userId);
  $user = db()->query("SELECT * FROM users WHERE id = {$userId}")->fetch();
  log_activity('register', $user, 'Created account', ['trial_days' => $trialDays], $timezone);
  respond(['ok' => true, 'token' => $token, 'user' => public_user($user)]);
}

function handle_login(): void {
  rate_limit('login', 12, 300);
  $body = json_input();
  $login = (string)($body['username'] ?? $body['email'] ?? '');
  $password = (string)($body['password'] ?? '');
  $timezone = isset($body['timezone']) ? (string)$body['timezone'] : null;

  $user = find_user_by_login($login);
  if (!$user || !password_verify($password, $user['password_hash'])) {
    log_activity(
      'login_failed',
      null,
      'Failed login attempt',
      ['username' => normalize_username($login) ?: substr($login, 0, 80)],
      $timezone,
    );
    fail('Invalid username or password', 401);
  }
  if ($user['status'] === 'banned') {
    log_activity('login_blocked', $user, 'Banned account tried to log in', null, $timezone);
    fail('Account banned', 403);
  }

  db()->prepare('UPDATE users SET last_login_at = ' . sql_now() . ' WHERE id = ?')->execute([(int)$user['id']]);
  $token = create_session((int)$user['id']);
  log_activity('login', $user, 'Logged in', null, $timezone);
  respond(['ok' => true, 'token' => $token, 'user' => public_user($user)]);
}

function handle_logout(): void {
  $user = current_user();
  $token = bearer_token();
  if ($token) {
    db()->prepare('DELETE FROM sessions WHERE id = ?')->execute([$token]);
  }
  if ($user) {
    log_activity('logout', $user, 'Logged out');
  }
  respond(['ok' => true]);
}

function handle_me(): void {
  $user = require_user();
  respond(['ok' => true, 'user' => public_user($user)]);
}

function handle_plans(): void {
  $rows = db()->query('SELECT id, name, price_usdt, days FROM plans WHERE active = 1 ORDER BY days ASC')->fetchAll();
  respond(['ok' => true, 'plans' => $rows]);
}

function handle_payment_create(): void {
  $user = require_user();
  $body = json_input();
  $planId = (string)($body['plan_id'] ?? 'pro30');

  $planStmt = db()->prepare('SELECT * FROM plans WHERE id = ? AND active = 1');
  $planStmt->execute([$planId]);
  $plan = $planStmt->fetch();
  if (!$plan) fail('Unknown plan');

  $cfg = app_config();
  $provider = $cfg['crypto_provider'] ?? 'demo';
  $amount = (float)$plan['price_usdt'];
  $payCurrency = $cfg['pay_currency'] ?? 'usdttrc20';

  if ($provider === 'nowpayments') {
    $result = nowpayments_create_invoice($user, $plan, $amount, $payCurrency);
  } else {
    $result = demo_create_invoice($user, $plan, $amount, $payCurrency);
  }

  $stmt = db()->prepare(
    'INSERT INTO payments (user_id, plan_id, provider, provider_payment_id, invoice_url, amount_usdt, pay_currency, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  $stmt->execute([
    (int)$user['id'],
    $planId,
    $result['provider'],
    $result['provider_payment_id'],
    $result['invoice_url'],
    $amount,
    $payCurrency,
    'waiting',
  ]);

  log_activity('payment_create', $user, "Started payment · {$planId}", [
    'plan_id' => $planId,
    'amount_usdt' => $amount,
    'provider' => $result['provider'],
  ]);

  respond([
    'ok' => true,
    'payment' => [
      'id' => (int)db()->lastInsertId(),
      'invoice_url' => $result['invoice_url'],
      'provider_payment_id' => $result['provider_payment_id'],
      'amount_usdt' => $amount,
      'pay_currency' => $payCurrency,
      'provider' => $result['provider'],
      'demo' => $provider === 'demo',
    ],
  ]);
}

function demo_create_invoice(array $user, array $plan, float $amount, string $payCurrency): array {
  $id = 'demo_' . bin2hex(random_bytes(8));
  $app = rtrim(app_config()['app_url'] ?? '', '/');
  return [
    'provider' => 'demo',
    'provider_payment_id' => $id,
    'invoice_url' => $app . '/billing?demo_payment=' . urlencode($id),
  ];
}

function nowpayments_create_invoice(array $user, array $plan, float $amount, string $payCurrency): array {
  $cfg = app_config();
  $apiKey = $cfg['nowpayments_api_key'] ?? '';
  if ($apiKey === '') fail('NOWPayments API key not configured', 500);

  $apiUrl = rtrim($cfg['nowpayments_api_url'] ?? 'https://api.nowpayments.io/v1', '/');
  $appUrl = rtrim($cfg['app_url'] ?? '', '/');
  $apiPublic = rtrim($cfg['api_url'] ?? '', '/');

  $payload = [
    'price_amount' => $amount,
    'price_currency' => 'usd',
    'pay_currency' => $payCurrency,
    'order_id' => 'user_' . $user['id'] . '_' . $plan['id'] . '_' . time(),
    'order_description' => 'Receipt Maker ' . $plan['name'],
    'ipn_callback_url' => $apiPublic . '/webhooks/nowpayments',
    'success_url' => $appUrl . '/billing?paid=1',
    'cancel_url' => $appUrl . '/billing?cancelled=1',
  ];

  $ch = curl_init($apiUrl . '/invoice');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'x-api-key: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 30,
  ]);
  $raw = curl_exec($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  $data = json_decode((string)$raw, true);
  if ($code >= 400 || !is_array($data)) {
    fail('Crypto invoice failed: ' . (is_string($raw) ? $raw : 'unknown'), 502);
  }

  $paymentId = (string)($data['id'] ?? $data['payment_id'] ?? '');
  $invoiceUrl = (string)($data['invoice_url'] ?? $data['invoice_url'] ?? '');
  if ($invoiceUrl === '' && !empty($data['id'])) {
    $invoiceUrl = 'https://nowpayments.io/payment/?iid=' . urlencode((string)$data['id']);
  }
  if ($paymentId === '') fail('Invalid NOWPayments response', 502);

  return [
    'provider' => 'nowpayments',
    'provider_payment_id' => $paymentId,
    'invoice_url' => $invoiceUrl,
  ];
}

function handle_payments_mine(): void {
  $user = require_user();
  $stmt = db()->prepare(
    'SELECT id, plan_id, provider, provider_payment_id, invoice_url, amount_usdt, pay_currency, status, created_at
     FROM payments WHERE user_id = ? ORDER BY id DESC LIMIT 50'
  );
  $stmt->execute([(int)$user['id']]);
  respond(['ok' => true, 'payments' => $stmt->fetchAll()]);
}

function apply_successful_payment(array $payment): void {
  if (in_array($payment['status'], ['confirmed', 'finished'], true)) return;

  $planStmt = db()->prepare('SELECT * FROM plans WHERE id = ?');
  $planStmt->execute([$payment['plan_id']]);
  $plan = $planStmt->fetch();
  if (!$plan) return;

  $userStmt = db()->prepare('SELECT * FROM users WHERE id = ?');
  $userStmt->execute([(int)$payment['user_id']]);
  $user = $userStmt->fetch();
  if (!$user) return;

  $until = extend_paid_until($user['paid_until'] ?? null, (int)$plan['days']);
  db()->prepare('UPDATE users SET paid_until = ? WHERE id = ?')->execute([$until, (int)$user['id']]);
  db()->prepare('UPDATE payments SET status = ?, updated_at = ' . sql_now() . ' WHERE id = ?')
    ->execute(['finished', (int)$payment['id']]);

  log_activity('payment_finished', $user, "Payment finished · {$payment['plan_id']}", [
    'plan_id' => $payment['plan_id'],
    'amount_usdt' => $payment['amount_usdt'] ?? null,
    'paid_until' => $until,
  ]);
}

function handle_demo_complete(): void {
  if ((app_config()['crypto_provider'] ?? '') !== 'demo') {
    fail('Demo payments disabled', 403);
  }
  $user = require_user();
  $body = json_input();
  $paymentId = (string)($body['provider_payment_id'] ?? '');
  if ($paymentId === '') fail('provider_payment_id required');

  $stmt = db()->prepare(
    'SELECT * FROM payments WHERE provider_payment_id = ? AND user_id = ? LIMIT 1'
  );
  $stmt->execute([$paymentId, (int)$user['id']]);
  $payment = $stmt->fetch();
  if (!$payment) fail('Payment not found', 404);

  apply_successful_payment($payment);
  $fresh = db()->query('SELECT * FROM users WHERE id = ' . (int)$user['id'])->fetch();
  respond(['ok' => true, 'user' => public_user($fresh)]);
}

function handle_nowpayments_webhook(): void {
  $raw = file_get_contents('php://input') ?: '';
  $cfg = app_config();
  $secret = trim((string)($cfg['nowpayments_ipn_secret'] ?? ''));
  $provider = (string)($cfg['crypto_provider'] ?? 'demo');

  // Production payments must verify IPN signatures — never accept unsigned webhooks.
  if ($provider === 'nowpayments' && ($secret === '' || strlen($secret) < 8)) {
    fail('IPN secret not configured', 503);
  }

  if ($secret !== '') {
    $sig = $_SERVER['HTTP_X_NOWPAYMENTS_SIG'] ?? '';
    $calc = hash_hmac('sha512', $raw, $secret);
    if (!$sig || !hash_equals($calc, $sig)) {
      fail('Invalid IPN signature', 401);
    }
  } elseif ($provider !== 'demo') {
    fail('IPN signature required', 401);
  }

  $data = json_decode($raw, true);
  if (!is_array($data)) fail('Invalid payload');

  $paymentId = (string)($data['invoice_id'] ?? $data['payment_id'] ?? $data['id'] ?? '');
  $status = strtolower((string)($data['payment_status'] ?? $data['status'] ?? ''));

  if ($paymentId === '') fail('Missing payment id');

  $stmt = db()->prepare('SELECT * FROM payments WHERE provider_payment_id = ? LIMIT 1');
  $stmt->execute([$paymentId]);
  $payment = $stmt->fetch();
  if (!$payment) {
    // Try order_id pattern
    respond(['ok' => true, 'ignored' => true]);
  }

  db()->prepare('UPDATE payments SET raw_payload = ?, status = ?, updated_at = ' . sql_now() . ' WHERE id = ?')
    ->execute([$raw, map_nowpayments_status($status), (int)$payment['id']]);

  if (in_array($status, ['finished', 'confirmed', 'partially_paid'], true) || $status === 'finished') {
    $payment['status'] = 'waiting'; // force apply
    apply_successful_payment($payment);
  }

  respond(['ok' => true]);
}

function map_nowpayments_status(string $status): string {
  return match ($status) {
    'waiting' => 'waiting',
    'confirming', 'confirmed', 'sending' => 'confirming',
    'finished', 'partially_paid' => 'finished',
    'failed', 'refunded' => $status === 'refunded' ? 'refunded' : 'failed',
    'expired' => 'expired',
    default => 'waiting',
  };
}

function handle_admin_users(): void {
  require_admin();
  $q = trim((string)($_GET['q'] ?? ''));
  if ($q !== '') {
    $stmt = db()->prepare(
      'SELECT id, username, email, name, role, status, trial_ends_at, paid_until, created_at, last_login_at
       FROM users WHERE username LIKE ? OR name LIKE ? OR email LIKE ? ORDER BY id DESC LIMIT 200'
    );
    $like = '%' . $q . '%';
    $stmt->execute([$like, $like, $like]);
    $rows = $stmt->fetchAll();
  } else {
    $rows = db()->query(
      'SELECT id, username, email, name, role, status, trial_ends_at, paid_until, created_at, last_login_at
       FROM users ORDER BY id DESC LIMIT 200'
    )->fetchAll();
  }
  $out = array_map(static function ($u) {
    return public_user($u);
  }, $rows);
  respond(['ok' => true, 'users' => $out]);
}

function handle_admin_user_create(): void {
  $admin = require_admin();
  $body = json_input();

  $username = normalize_username((string)($body['username'] ?? $body['email'] ?? ''));
  $password = (string)($body['password'] ?? '');
  $name = trim((string)($body['name'] ?? ''));
  $paidDays = (int)($body['paid_days'] ?? 0);
  $role = (string)($body['role'] ?? 'user');
  if (!in_array($role, ['user', 'admin'], true)) $role = 'user';

  validate_username($username);
  if (strlen($password) < 8) fail('Password must be at least 8 characters');
  if ($name === '') $name = $username;

  $exists = db()->prepare('SELECT id FROM users WHERE username = ?');
  $exists->execute([$username]);
  if ($exists->fetch()) fail('Username already taken', 409);

  $paidUntil = null;
  if ($paidDays > 0) {
    $paidUntil = extend_paid_until(null, $paidDays);
  }

  $hash = password_hash($password, PASSWORD_DEFAULT);
  $stmt = db()->prepare(
    'INSERT INTO users (username, email, password_hash, name, role, status, trial_ends_at, paid_until)
     VALUES (?, NULL, ?, ?, ?, \'active\', NULL, ?)'
  );
  $stmt->execute([$username, $hash, $name, $role, $paidUntil]);
  $userId = (int)db()->lastInsertId();

  log_admin((int)$admin['id'], 'user_create', $userId, [
    'username' => $username,
    'role' => $role,
    'paid_days' => $paidDays,
  ]);
  log_activity('admin_user_create', $admin, "Created user @{$username}", [
    'target_user_id' => $userId,
    'username' => $username,
    'paid_days' => $paidDays,
  ]);

  $fresh = db()->query("SELECT * FROM users WHERE id = {$userId}")->fetch();
  respond([
    'ok' => true,
    'user' => public_user($fresh),
    'credentials' => [
      'username' => $username,
      'password' => $password,
      'name' => $name,
    ],
  ]);
}

function handle_admin_user_update(): void {
  $admin = require_admin();
  $body = json_input();
  $userId = (int)($body['user_id'] ?? 0);
  if ($userId < 1) fail('user_id required');

  $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
  $stmt->execute([$userId]);
  $user = $stmt->fetch();
  if (!$user) fail('User not found', 404);

  if (isset($body['status']) && in_array($body['status'], ['active', 'banned'], true)) {
    db()->prepare('UPDATE users SET status = ? WHERE id = ?')->execute([$body['status'], $userId]);
    if ($body['status'] === 'banned') {
      revoke_user_sessions($userId);
    }
  }
  if (isset($body['role']) && in_array($body['role'], ['user', 'admin'], true)) {
    db()->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$body['role'], $userId]);
  }
  if (!empty($body['extend_days'])) {
    $days = (int)$body['extend_days'];
    $until = extend_paid_until($user['paid_until'] ?? null, $days);
    db()->prepare('UPDATE users SET paid_until = ? WHERE id = ?')->execute([$until, $userId]);
  }
  if (!empty($body['password'])) {
    $password = (string)$body['password'];
    if (strlen($password) < 8) fail('Password must be at least 8 characters');
    $hash = password_hash($password, PASSWORD_DEFAULT);
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $userId]);
    revoke_user_sessions($userId);
  }
  if (array_key_exists('paid_until', $body)) {
    $val = $body['paid_until'];
    db()->prepare('UPDATE users SET paid_until = ? WHERE id = ?')->execute([$val ?: null, $userId]);
  }

  log_admin((int)$admin['id'], 'user_update', $userId, array_diff_key($body, ['password' => true]));
  $detailBits = [];
  if (isset($body['status'])) $detailBits[] = 'status=' . $body['status'];
  if (!empty($body['extend_days'])) $detailBits[] = '+' . (int)$body['extend_days'] . ' days';
  if (!empty($body['password'])) $detailBits[] = 'password reset';
  log_activity(
    'admin_user_update',
    $admin,
    'Updated @' . ($user['username'] ?? $userId) . ($detailBits ? ' · ' . implode(', ', $detailBits) : ''),
    array_merge(array_diff_key($body, ['password' => true]), ['target_user_id' => $userId]),
  );
  $fresh = db()->query("SELECT * FROM users WHERE id = {$userId}")->fetch();
  $out = ['ok' => true, 'user' => public_user($fresh)];
  if (!empty($body['password'])) {
    $out['credentials'] = [
      'username' => $fresh['username'],
      'password' => (string)$body['password'],
      'name' => $fresh['name'],
    ];
  }
  respond($out);
}

function handle_admin_payments(): void {
  require_admin();
  $rows = db()->query(
    'SELECT p.*, u.username AS user_username, u.email AS user_email
     FROM payments p JOIN users u ON u.id = p.user_id
     ORDER BY p.id DESC LIMIT 200'
  )->fetchAll();
  respond(['ok' => true, 'payments' => $rows]);
}

function handle_admin_stats(): void {
  require_admin();
  $users = (int)db()->query('SELECT COUNT(*) c FROM users')->fetch()['c'];
  $activePaid = (int)db()->query(
    "SELECT COUNT(*) c FROM users WHERE status = 'active' AND paid_until > " . sql_now()
  )->fetch()['c'];
  $trials = (int)db()->query(
    "SELECT COUNT(*) c FROM users WHERE status = 'active' AND trial_ends_at > " . sql_now() . " AND (paid_until IS NULL OR paid_until < " . sql_now() . ")"
  )->fetch()['c'];
  $finished = (int)db()->query(
    "SELECT COUNT(*) c FROM payments WHERE status IN ('finished','confirmed')"
  )->fetch()['c'];
  $revenue = (float)db()->query(
    "SELECT COALESCE(SUM(amount_usdt),0) s FROM payments WHERE status IN ('finished','confirmed')"
  )->fetch()['s'];
  respond([
    'ok' => true,
    'stats' => [
      'users' => $users,
      'active_paid' => $activePaid,
      'active_trials' => $trials,
      'payments_finished' => $finished,
      'revenue_usdt' => $revenue,
    ],
  ]);
}

/** Server-side entitlement gate before client download/copy. */
function handle_export_check(): void {
  rate_limit('export_check', 40, 60);
  $user = require_user();
  $access = user_access($user);
  if (!empty($access['banned'])) {
    fail('Account banned', 403);
  }
  if (empty($access['can_download'])) {
    fail('Download locked — subscribe to unlock', 403);
  }
  $body = json_input();
  $kind = strtolower(trim((string)($body['kind'] ?? 'download')));
  if (!in_array($kind, ['download', 'copy', 'batch'], true)) {
    $kind = 'download';
  }
  log_activity(
    'export_authorized',
    $user,
    'Export authorized · ' . $kind,
    [
      'kind' => $kind,
      'device' => isset($body['device']) ? substr((string)$body['device'], 0, 64) : null,
      'institution' => isset($body['institution']) ? substr((string)$body['institution'], 0, 64) : null,
    ],
    isset($body['timezone']) ? (string)$body['timezone'] : null,
  );
  respond([
    'ok' => true,
    'can_download' => true,
    'username' => (string)($user['username'] ?? ''),
  ]);
}

/** Client-reported product actions (download, copy, generate…). */
function handle_activity_track(): void {
  $user = require_user();
  $body = json_input();
  $action = strtolower(trim((string)($body['action'] ?? '')));
  $allowed = [
    'download_screenshot' => 'Downloaded screenshot',
    'copy_screenshot' => 'Copied screenshot',
    'batch_export' => 'Batch exported screenshots',
    'generate_receipt' => 'Generated receipt',
    'save_project' => 'Saved project',
    'open_billing' => 'Opened billing',
  ];
  if (!isset($allowed[$action])) fail('Unknown activity action');

  // Honor-system tracking still requires an entitled account for export actions
  if (in_array($action, ['download_screenshot', 'copy_screenshot', 'batch_export'], true)) {
    $access = user_access($user);
    if (empty($access['can_download'])) {
      fail('Download locked — subscribe to unlock', 403);
    }
  }

  $detail = isset($body['detail']) && is_string($body['detail'])
    ? substr($body['detail'], 0, 255)
    : $allowed[$action];
  $meta = [];
  if (isset($body['meta']) && is_array($body['meta'])) {
    $meta = $body['meta'];
  }
  $timezone = isset($body['timezone']) ? (string)$body['timezone'] : null;

  log_activity($action, $user, $detail, $meta ?: null, $timezone);
  respond(['ok' => true]);
}

function handle_admin_activity(): void {
  require_admin();
  ensure_activity_schema();

  $q = trim((string)($_GET['q'] ?? ''));
  $action = trim((string)($_GET['action'] ?? ''));
  $limit = (int)($_GET['limit'] ?? 150);
  if ($limit < 1) $limit = 50;
  if ($limit > 500) $limit = 500;

  $sql = 'SELECT * FROM activity_events WHERE 1=1';
  $params = [];
  if ($q !== '') {
    $like = '%' . $q . '%';
    $sql .= ' AND (username LIKE ? OR ip LIKE ? OR detail LIKE ? OR country LIKE ? OR city LIKE ? OR action LIKE ?)';
    array_push($params, $like, $like, $like, $like, $like, $like);
  }
  if ($action !== '' && $action !== 'all') {
    $sql .= ' AND action = ?';
    $params[] = $action;
  }
  $sql .= ' ORDER BY id DESC LIMIT ' . $limit;

  $stmt = db()->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll();

  $events = array_map(static function (array $row): array {
    return [
      'id' => (int)$row['id'],
      'user_id' => $row['user_id'] !== null ? (int)$row['user_id'] : null,
      'username' => $row['username'],
      'action' => $row['action'],
      'detail' => $row['detail'],
      'meta' => $row['meta'] ? json_decode((string)$row['meta'], true) : null,
      'ip' => $row['ip'],
      'user_agent' => $row['user_agent'],
      'country' => $row['country'],
      'region' => $row['region'],
      'city' => $row['city'],
      'timezone' => $row['timezone'],
      'location' => format_location(
        $row['city'] ?? null,
        $row['region'] ?? null,
        $row['country'] ?? null,
        $row['timezone'] ?? null,
      ),
      'created_at' => $row['created_at'],
    ];
  }, $rows);

  $summary = [
    'total' => count($events),
    'logins_24h' => (int)db()->query(
      "SELECT COUNT(*) c FROM activity_events WHERE action = 'login' AND created_at >= " .
      (db_driver() === 'sqlite' ? "datetime('now', '-1 day')" : 'DATE_SUB(NOW(), INTERVAL 1 DAY)')
    )->fetch()['c'],
    'failed_24h' => (int)db()->query(
      "SELECT COUNT(*) c FROM activity_events WHERE action = 'login_failed' AND created_at >= " .
      (db_driver() === 'sqlite' ? "datetime('now', '-1 day')" : 'DATE_SUB(NOW(), INTERVAL 1 DAY)')
    )->fetch()['c'],
    'unique_ips_24h' => (int)db()->query(
      "SELECT COUNT(DISTINCT ip) c FROM activity_events WHERE ip IS NOT NULL AND created_at >= " .
      (db_driver() === 'sqlite' ? "datetime('now', '-1 day')" : 'DATE_SUB(NOW(), INTERVAL 1 DAY)')
    )->fetch()['c'],
  ];

  respond(['ok' => true, 'events' => $events, 'summary' => $summary]);
}

function handle_rates(): void {
  $payload = rates_public_payload(true);
  respond([
    'ok' => true,
    'rates' => $payload['rates'] ?? [],
    'updated_at' => $payload['updated_at'] ?? null,
    'source' => $payload['source'] ?? 'unknown',
    'stale' => (bool)($payload['stale'] ?? false),
  ]);
}

function handle_rates_cron(): void {
  $cfg = app_config();
  $secret = (string)($cfg['cron_secret'] ?? '');
  $provided = (string)($_GET['key'] ?? '');
  $hdr = $_SERVER['HTTP_X_CRON_KEY'] ?? '';
  if ($secret === '') {
    fail('cron_secret not configured', 503);
  }
  if (!hash_equals($secret, $provided) && !hash_equals($secret, (string)$hdr)) {
    fail('Unauthorized', 401);
  }
  $payload = rates_refresh(true);
  respond([
    'ok' => true,
    'refreshed' => true,
    'rates' => $payload['rates'] ?? [],
    'updated_at' => $payload['updated_at'] ?? null,
    'source' => $payload['source'] ?? 'unknown',
  ]);
}
