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
  ensure_invites_schema();
  ensure_settings_schema();
  ensure_notifications_schema();
  ensure_plans_schema();
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
  if ($method === 'GET' && $path === '/support') {
    handle_support_get();
  }
  if ($method === 'GET' && $path === '/notifications') {
    handle_notifications_list();
  }
  if ($method === 'POST' && $path === '/notifications/read') {
    handle_notifications_read();
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
  if ($method === 'GET' && $path === '/admin/invites') {
    handle_admin_invites();
  }
  if ($method === 'POST' && $path === '/admin/invites/create') {
    handle_admin_invite_create();
  }
  if ($method === 'POST' && $path === '/admin/invites/revoke') {
    handle_admin_invite_revoke();
  }
  if ($method === 'GET' && $path === '/admin/support') {
    handle_admin_support_get();
  }
  if ($method === 'POST' && $path === '/admin/support') {
    handle_admin_support_save();
  }
  if ($method === 'GET' && $path === '/admin/plans') {
    handle_admin_plans_list();
  }
  if ($method === 'POST' && $path === '/admin/plans') {
    handle_admin_plans_create();
  }
  if ($method === 'POST' && $path === '/admin/plans/update') {
    handle_admin_plans_update();
  }
  if ($method === 'GET' && $path === '/admin/notifications') {
    handle_admin_notifications_list();
  }
  if ($method === 'POST' && $path === '/admin/notifications') {
    handle_admin_notifications_send();
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
  ensure_invites_schema();
  $body = json_input();
  $username = normalize_username((string)($body['username'] ?? $body['email'] ?? ''));
  $password = (string)($body['password'] ?? '');
  $name = trim((string)($body['name'] ?? ''));
  $timezone = isset($body['timezone']) ? (string)$body['timezone'] : null;
  $inviteCode = strtoupper(trim((string)($body['invite'] ?? $body['invite_code'] ?? '')));
  $inviteCode = preg_replace('/[^A-Z0-9\-]/', '', $inviteCode) ?? '';

  $inviteOnly = (bool)(app_config()['invite_only'] ?? true);
  $invite = null;
  if ($inviteOnly) {
    if ($inviteCode === '') {
      fail('Invite code required — ask an admin for access', 403);
    }
    $invite = consume_invite_or_fail($inviteCode);
  }

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

  if ($invite) {
    mark_invite_used((int)$invite['id']);
  }

  $token = create_session($userId);
  $user = db()->query("SELECT * FROM users WHERE id = {$userId}")->fetch();
  log_activity('register', $user, 'Created account', [
    'trial_days' => $trialDays,
    'invite' => $invite['code'] ?? null,
  ], $timezone);
  respond(['ok' => true, 'token' => $token, 'user' => public_user($user)]);
}

/** Validate invite and return row (does not increment uses yet). */
function consume_invite_or_fail(string $code): array {
  $stmt = db()->prepare('SELECT * FROM invites WHERE code = ? LIMIT 1');
  $stmt->execute([$code]);
  $invite = $stmt->fetch();
  if (!$invite) fail('Invalid invite code', 403);
  if (!empty($invite['revoked_at'])) fail('Invite code revoked', 403);
  if (!empty($invite['expires_at'])) {
    $exp = strtotime((string)$invite['expires_at']);
    if ($exp && $exp < time()) fail('Invite code expired', 403);
  }
  $uses = (int)($invite['uses'] ?? 0);
  $max = (int)($invite['max_uses'] ?? 1);
  if ($uses >= $max) fail('Invite code already used', 403);
  return $invite;
}

function mark_invite_used(int $inviteId): void {
  db()->prepare(
    'UPDATE invites SET uses = uses + 1, last_used_at = ' . sql_now() . ' WHERE id = ?'
  )->execute([$inviteId]);
}

function generate_invite_code(): string {
  $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  $bytes = random_bytes(8);
  $out = '';
  for ($i = 0; $i < 8; $i++) {
    $out .= $alphabet[ord($bytes[$i]) % strlen($alphabet)];
  }
  return substr($out, 0, 4) . '-' . substr($out, 4, 4);
}

function public_invite(array $row): array {
  $uses = (int)($row['uses'] ?? 0);
  $max = (int)($row['max_uses'] ?? 1);
  $revoked = !empty($row['revoked_at']);
  $expired = false;
  if (!empty($row['expires_at'])) {
    $exp = strtotime((string)$row['expires_at']);
    $expired = $exp !== false && $exp < time();
  }
  $status = 'active';
  if ($revoked) $status = 'revoked';
  elseif ($expired) $status = 'expired';
  elseif ($uses >= $max) $status = 'used';

  return [
    'id' => (int)$row['id'],
    'code' => (string)$row['code'],
    'note' => $row['note'] ?? null,
    'max_uses' => $max,
    'uses' => $uses,
    'expires_at' => $row['expires_at'] ?? null,
    'revoked_at' => $row['revoked_at'] ?? null,
    'created_at' => $row['created_at'] ?? null,
    'last_used_at' => $row['last_used_at'] ?? null,
    'status' => $status,
  ];
}

function handle_admin_invites(): void {
  require_admin();
  ensure_invites_schema();
  $rows = db()->query(
    'SELECT * FROM invites ORDER BY id DESC LIMIT 200'
  )->fetchAll();
  $out = array_map(static fn($r) => public_invite($r), $rows);
  respond(['ok' => true, 'invites' => $out, 'invite_only' => (bool)(app_config()['invite_only'] ?? true)]);
}

function handle_admin_invite_create(): void {
  $admin = require_admin();
  ensure_invites_schema();
  $body = json_input();
  $note = trim((string)($body['note'] ?? ''));
  if (strlen($note) > 255) $note = substr($note, 0, 255);
  $maxUses = (int)($body['max_uses'] ?? 1);
  if ($maxUses < 1) $maxUses = 1;
  if ($maxUses > 100) $maxUses = 100;
  $days = (int)($body['expires_days'] ?? 0);
  $expiresAt = null;
  if ($days > 0) {
    $expiresAt = (new DateTimeImmutable("+{$days} days"))->format('Y-m-d H:i:s');
  }

  $code = strtoupper(trim((string)($body['code'] ?? '')));
  $code = preg_replace('/[^A-Z0-9\-]/', '', $code) ?? '';
  if ($code === '') {
    // Generate unique code
    for ($i = 0; $i < 8; $i++) {
      $candidate = generate_invite_code();
      $check = db()->prepare('SELECT id FROM invites WHERE code = ?');
      $check->execute([$candidate]);
      if (!$check->fetch()) {
        $code = $candidate;
        break;
      }
    }
  }
  if ($code === '' || strlen($code) < 4) fail('Could not create invite code');

  $exists = db()->prepare('SELECT id FROM invites WHERE code = ?');
  $exists->execute([$code]);
  if ($exists->fetch()) fail('Invite code already exists', 409);

  $stmt = db()->prepare(
    'INSERT INTO invites (code, created_by, note, max_uses, expires_at)
     VALUES (?, ?, ?, ?, ?)'
  );
  $stmt->execute([
    $code,
    (int)$admin['id'],
    $note !== '' ? $note : null,
    $maxUses,
    $expiresAt,
  ]);
  $id = (int)db()->lastInsertId();
  $row = db()->query("SELECT * FROM invites WHERE id = {$id}")->fetch();

  log_activity('admin_invite_create', $admin, "Created invite {$code}", [
    'invite_id' => $id,
    'code' => $code,
    'max_uses' => $maxUses,
  ]);

  respond(['ok' => true, 'invite' => public_invite($row)]);
}

function handle_admin_invite_revoke(): void {
  $admin = require_admin();
  ensure_invites_schema();
  $body = json_input();
  $id = (int)($body['invite_id'] ?? 0);
  if ($id < 1) fail('invite_id required');

  $stmt = db()->prepare('SELECT * FROM invites WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row) fail('Invite not found', 404);

  db()->prepare(
    'UPDATE invites SET revoked_at = ' . sql_now() . ' WHERE id = ?'
  )->execute([$id]);

  log_activity('admin_invite_revoke', $admin, 'Revoked invite ' . $row['code'], [
    'invite_id' => $id,
    'code' => $row['code'],
  ]);

  $fresh = db()->query("SELECT * FROM invites WHERE id = {$id}")->fetch();
  respond(['ok' => true, 'invite' => public_invite($fresh)]);
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
  ensure_plans_schema();
  $rows = db()->query(
    'SELECT id, name, price_usdt, days, active, sort_order, recommended, features
     FROM plans WHERE active = 1
     ORDER BY sort_order ASC, days ASC, name ASC'
  )->fetchAll();
  respond([
    'ok' => true,
    'plans' => array_map('plan_to_public', $rows),
  ]);
}

function handle_admin_plans_list(): void {
  require_admin();
  ensure_plans_schema();
  $rows = db()->query(
    'SELECT id, name, price_usdt, days, active, sort_order, recommended, features
     FROM plans
     ORDER BY sort_order ASC, days ASC, name ASC'
  )->fetchAll();
  respond([
    'ok' => true,
    'plans' => array_map('plan_to_public', $rows),
  ]);
}

function handle_admin_plans_create(): void {
  $admin = require_admin();
  ensure_plans_schema();
  $body = json_input();

  $name = trim((string)($body['name'] ?? ''));
  $price = (float)($body['price_usdt'] ?? $body['price'] ?? 0);
  $days = (int)($body['days'] ?? 0);
  $sort = isset($body['sort_order']) ? (int)$body['sort_order'] : $days;
  $recommended = !empty($body['recommended']);
  $active = array_key_exists('active', $body) ? !empty($body['active']) : true;
  $featuresJson = encode_plan_features($body['features'] ?? default_plan_features());

  $id = trim((string)($body['id'] ?? ''));
  if ($id === '') {
    $id = slugify_plan_id($name);
    if ($days > 0) {
      $withDays = $id . $days;
      if (strlen($withDays) <= 32) $id = $withDays;
    }
  }
  $id = strtolower(preg_replace('/[^a-z0-9_\-]/', '', $id) ?? '');
  if ($id === '') fail('Plan id is required');
  if (strlen($id) > 32) $id = substr($id, 0, 32);

  if ($name === '') fail('Plan name is required');
  if ($price < 0) fail('Price must be >= 0');
  if ($days < 1) fail('Days must be at least 1');
  if (strlen($name) > 80) $name = substr($name, 0, 80);

  $exists = db()->prepare('SELECT id FROM plans WHERE id = ? LIMIT 1');
  $exists->execute([$id]);
  if ($exists->fetch()) fail('Plan id already exists');

  if ($recommended) clear_other_recommended(null);

  db()->prepare(
    'INSERT INTO plans (id, name, price_usdt, days, active, sort_order, recommended, features)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )->execute([
    $id,
    $name,
    round($price, 2),
    $days,
    $active ? 1 : 0,
    $sort,
    $recommended ? 1 : 0,
    $featuresJson,
  ]);

  log_activity('admin_plan_create', $admin, $name, ['plan_id' => $id, 'price_usdt' => $price, 'days' => $days]);
  log_admin((int)$admin['id'], 'plan_create', null, ['plan_id' => $id]);

  $stmt = db()->prepare('SELECT * FROM plans WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  respond(['ok' => true, 'plan' => plan_to_public($stmt->fetch())]);
}

function handle_admin_plans_update(): void {
  $admin = require_admin();
  ensure_plans_schema();
  $body = json_input();
  $id = trim((string)($body['id'] ?? $body['plan_id'] ?? ''));
  if ($id === '') fail('Plan id is required');

  $stmt = db()->prepare('SELECT * FROM plans WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $plan = $stmt->fetch();
  if (!$plan) fail('Plan not found', 404);

  $name = array_key_exists('name', $body) ? trim((string)$body['name']) : (string)$plan['name'];
  $price = array_key_exists('price_usdt', $body)
    ? (float)$body['price_usdt']
    : (array_key_exists('price', $body) ? (float)$body['price'] : (float)$plan['price_usdt']);
  $days = array_key_exists('days', $body) ? (int)$body['days'] : (int)$plan['days'];
  $sort = array_key_exists('sort_order', $body) ? (int)$body['sort_order'] : (int)($plan['sort_order'] ?? $days);
  $active = array_key_exists('active', $body) ? !empty($body['active']) : !empty($plan['active']);
  $recommended = array_key_exists('recommended', $body)
    ? !empty($body['recommended'])
    : !empty($plan['recommended']);
  $featuresJson = array_key_exists('features', $body)
    ? encode_plan_features($body['features'])
    : encode_plan_features($plan['features'] ?? '');

  if ($name === '') fail('Plan name is required');
  if ($price < 0) fail('Price must be >= 0');
  if ($days < 1) fail('Days must be at least 1');
  if (strlen($name) > 80) $name = substr($name, 0, 80);

  if ($recommended) clear_other_recommended($id);

  db()->prepare(
    'UPDATE plans SET name = ?, price_usdt = ?, days = ?, active = ?, sort_order = ?, recommended = ?, features = ?
     WHERE id = ?'
  )->execute([
    $name,
    round($price, 2),
    $days,
    $active ? 1 : 0,
    $sort,
    $recommended ? 1 : 0,
    $featuresJson,
    $id,
  ]);

  log_activity('admin_plan_update', $admin, $name, [
    'plan_id' => $id,
    'price_usdt' => $price,
    'days' => $days,
    'active' => $active,
    'recommended' => $recommended,
  ]);
  log_admin((int)$admin['id'], 'plan_update', null, ['plan_id' => $id]);

  $stmt->execute([$id]);
  respond(['ok' => true, 'plan' => plan_to_public($stmt->fetch())]);
}

function handle_support_get(): void {
  respond(['ok' => true, 'support' => public_support()]);
}

function notification_row_public(array $row): array {
  return [
    'id' => (int)$row['id'],
    'title' => (string)$row['title'],
    'body' => (string)$row['body'],
    'created_at' => $row['created_at'] ?? null,
    'read' => !empty($row['is_read']),
    'audience' => empty($row['target_user_id']) ? 'all' : 'user',
  ];
}

function handle_notifications_list(): void {
  $user = require_user();
  ensure_notifications_schema();
  $uid = (int)$user['id'];
  $stmt = db()->prepare(
    'SELECT n.id, n.title, n.body, n.target_user_id, n.created_at,
            CASE WHEN r.user_id IS NULL THEN 0 ELSE 1 END AS is_read
     FROM notifications n
     LEFT JOIN notification_reads r
       ON r.notification_id = n.id AND r.user_id = ?
     WHERE n.target_user_id IS NULL OR n.target_user_id = ?
     ORDER BY n.created_at DESC, n.id DESC
     LIMIT 40'
  );
  $stmt->execute([$uid, $uid]);
  $rows = $stmt->fetchAll();
  $items = array_map('notification_row_public', $rows);
  $unread = 0;
  foreach ($items as $item) {
    if (!$item['read']) $unread++;
  }
  respond(['ok' => true, 'notifications' => $items, 'unread' => $unread]);
}

function handle_notifications_read(): void {
  $user = require_user();
  ensure_notifications_schema();
  $body = json_input();
  $uid = (int)$user['id'];
  $ids = $body['ids'] ?? null;
  $markAll = !empty($body['all']);

  if ($markAll) {
    $stmt = db()->prepare(
      'SELECT n.id FROM notifications n
       LEFT JOIN notification_reads r
         ON r.notification_id = n.id AND r.user_id = ?
       WHERE (n.target_user_id IS NULL OR n.target_user_id = ?) AND r.user_id IS NULL'
    );
    $stmt->execute([$uid, $uid]);
    $ids = array_map(static fn($r) => (int)$r['id'], $stmt->fetchAll());
  } elseif (!is_array($ids)) {
    $single = (int)($body['id'] ?? 0);
    $ids = $single > 0 ? [$single] : [];
  } else {
    $ids = array_values(array_filter(array_map('intval', $ids), static fn($id) => $id > 0));
  }

  if ($ids) {
    $ins = db()->prepare(
      'INSERT IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)'
    );
    if (db_driver() === 'sqlite') {
      $ins = db()->prepare(
        'INSERT OR IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)'
      );
    }
    foreach ($ids as $nid) {
      // Only mark notifications this user can see
      $check = db()->prepare(
        'SELECT id FROM notifications WHERE id = ? AND (target_user_id IS NULL OR target_user_id = ?) LIMIT 1'
      );
      $check->execute([$nid, $uid]);
      if ($check->fetch()) {
        $ins->execute([$nid, $uid]);
      }
    }
  }

  handle_notifications_list();
}

function handle_admin_notifications_list(): void {
  require_admin();
  ensure_notifications_schema();
  $rows = db()->query(
    'SELECT n.id, n.title, n.body, n.target_user_id, n.created_at, n.created_by,
            u.username AS target_username
     FROM notifications n
     LEFT JOIN users u ON u.id = n.target_user_id
     ORDER BY n.created_at DESC, n.id DESC
     LIMIT 50'
  )->fetchAll();
  $items = [];
  foreach ($rows as $row) {
    $items[] = [
      'id' => (int)$row['id'],
      'title' => (string)$row['title'],
      'body' => (string)$row['body'],
      'created_at' => $row['created_at'] ?? null,
      'audience' => empty($row['target_user_id']) ? 'all' : 'user',
      'target_user_id' => $row['target_user_id'] !== null ? (int)$row['target_user_id'] : null,
      'target_username' => $row['target_username'] ?? null,
    ];
  }
  respond(['ok' => true, 'notifications' => $items]);
}

function handle_admin_notifications_send(): void {
  $admin = require_admin();
  ensure_notifications_schema();
  $body = json_input();
  $title = trim((string)($body['title'] ?? ''));
  $message = trim((string)($body['body'] ?? $body['message'] ?? ''));
  $targetId = $body['user_id'] ?? $body['target_user_id'] ?? null;
  if ($targetId === '' || $targetId === 'all' || $targetId === 0 || $targetId === '0') {
    $targetId = null;
  } elseif ($targetId !== null) {
    $targetId = (int)$targetId;
  }

  if ($title === '') fail('Title is required');
  if ($message === '') fail('Message is required');
  if (strlen($title) > 120) $title = substr($title, 0, 120);
  if (strlen($message) > 2000) $message = substr($message, 0, 2000);

  if ($targetId !== null) {
    $stmt = db()->prepare('SELECT id, username FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$targetId]);
    $target = $stmt->fetch();
    if (!$target) fail('User not found', 404);
  }

  db()->prepare(
    'INSERT INTO notifications (title, body, target_user_id, created_by) VALUES (?, ?, ?, ?)'
  )->execute([$title, $message, $targetId, (int)$admin['id']]);

  $id = (int)db()->lastInsertId();
  log_activity('admin_notification_send', $admin, $title, [
    'notification_id' => $id,
    'audience' => $targetId === null ? 'all' : 'user',
    'target_user_id' => $targetId,
  ]);
  log_admin((int)$admin['id'], 'notification_send', $targetId, [
    'notification_id' => $id,
    'title' => $title,
  ]);

  respond([
    'ok' => true,
    'notification' => [
      'id' => $id,
      'title' => $title,
      'body' => $message,
      'audience' => $targetId === null ? 'all' : 'user',
      'target_user_id' => $targetId,
      'target_username' => $target['username'] ?? null,
    ],
  ]);
}

function handle_admin_support_get(): void {
  require_admin();
  respond([
    'ok' => true,
    'support' => public_support(),
    'raw' => [
      'telegram' => setting_get('support_telegram', ''),
      'whatsapp' => setting_get('support_whatsapp', ''),
      'message' => setting_get('support_message', 'Need help? Chat with support.'),
    ],
  ]);
}

function handle_admin_support_save(): void {
  $admin = require_admin();
  $body = json_input();
  $telegram = trim((string)($body['telegram'] ?? ''));
  $whatsapp = trim((string)($body['whatsapp'] ?? ''));
  $message = trim((string)($body['message'] ?? ''));
  if (strlen($message) > 200) $message = substr($message, 0, 200);

  // Store raw-ish values; normalize on read for links
  $tgStore = $telegram;
  if ($tgStore !== '' && !preg_match('#^https?://#i', $tgStore)) {
    $tgStore = ltrim($tgStore, '@');
  }
  $waStore = $whatsapp;

  setting_set('support_telegram', $tgStore);
  setting_set('support_whatsapp', $waStore);
  setting_set('support_message', $message !== '' ? $message : 'Need help? Chat with support.');

  log_activity('admin_support_update', $admin, 'Updated customer support contacts', [
    'telegram' => $tgStore !== '',
    'whatsapp' => $waStore !== '',
  ]);

  respond([
    'ok' => true,
    'support' => public_support(),
    'raw' => [
      'telegram' => setting_get('support_telegram', ''),
      'whatsapp' => setting_get('support_whatsapp', ''),
      'message' => setting_get('support_message', ''),
    ],
  ]);
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
