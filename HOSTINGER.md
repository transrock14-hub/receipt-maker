# Hostinger shared hosting (no VPS)

Receipt Maker runs as a static React SPA + PHP/MySQL API on Hostinger shared hosting.

## What you upload

```
public_html/
  index.html          ← from dist/
  assets/             ← from dist/assets/
  .htaccess           ← from public/.htaccess (SPA + leave /api alone)
  api/
    index.php
    bootstrap.php
    install.php
    .htaccess
    config.example.php
    config.local.php  ← create on server, never commit
  (optional) sql/schema.sql for reference
```

## 1. Database

1. In hPanel → **Databases** → create MySQL database + user.
2. phpMyAdmin → Import `sql/schema.sql`.
3. Copy `api/config.example.php` → `api/config.local.php` and set:

```php
return [
  'db_host' => 'localhost',
  'db_name' => 'uXXXX_receipt',
  'db_user' => 'uXXXX_user',
  'db_pass' => 'your-password',
  'app_url' => 'https://yourdomain.com',
  'api_url' => 'https://yourdomain.com/api',
  'cors_origin' => 'https://yourdomain.com',
  'trial_days' => 3,
  'admin_email' => 'you@email.com',
  'admin_password' => 'StrongPassword123!',
  'admin_name' => 'Admin',
  // Start with demo; switch to nowpayments when ready
  'crypto_provider' => 'demo',
  'nowpayments_api_key' => '',
  'nowpayments_ipn_secret' => '',
  'pay_currency' => 'usdttrc20',
];
```

## 2. Create admin

Visit once: `https://yourdomain.com/api/install.php`  
Then delete or protect `install.php`.

## 3. Build & upload frontend

```bash
npm install
npm run build
```

Upload contents of `dist/` into `public_html/`.  
Ensure `public/.htaccess` is present as `public_html/.htaccess`.

Optional: set `VITE_API_URL=/api` before build (default already uses `/api`).

## 4. Crypto payments (NOWPayments)

1. Create account at [nowpayments.io](https://nowpayments.io).
2. Set in `config.local.php`:
   - `crypto_provider` → `nowpayments`
   - `nowpayments_api_key`
   - `nowpayments_ipn_secret`
3. IPN/callback URL: `https://yourdomain.com/api/webhooks/nowpayments`

Until then, leave `crypto_provider` as `demo` and use **Simulate payment** on the Billing page.

## 5. Local development (no Hostinger / MySQL needed)

This machine can use **SQLite** for a quick preview:

```bash
npm run setup:local   # creates api/data/local.sqlite + admin
npm run dev:api       # PHP API on :8080
npm run dev           # Vite on :5173 (proxies /api)
```

Open **http://127.0.0.1:5173/**

- Admin: `admin` / `ChangeMe123!` (from `api/config.local.php`)
- Or register a new account (gets a 3-day trial)
- Billing → Pay with crypto → **Simulate payment** (demo mode)

Hostinger production still uses MySQL (`sql/schema.sql`) — set `db_driver` to `mysql` there.

## Access rules

- Register → short trial (`trial_days`).
- Download / batch export require active trial, paid plan, or admin.
- Admin UI: toolbar **Admin** (admin role only).
- Ban / +30 days / payment list live in Admin.

## Notes

- Shared hosting only — no Node server, no VPS.
- Sessions are bearer tokens in MySQL (`sessions` table).
- Do not commit `api/config.local.php`.
