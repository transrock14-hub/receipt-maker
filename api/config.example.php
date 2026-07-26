<?php
/**
 * Copy to config.local.php on Hostinger and fill in values.
 * config.local.php is gitignored.
 */
return [
  // Local SQLite (no MySQL needed). Hostinger: omit this and use MySQL fields below.
  'db_driver' => 'mysql', // mysql | sqlite
  'sqlite_path' => __DIR__ . '/data/local.sqlite',

  // MySQL from Hostinger hPanel → Databases
  'db_host' => 'localhost',
  'db_name' => 'receipt_maker',
  'db_user' => 'root',
  'db_pass' => '',
  'db_charset' => 'utf8mb4',

  // App
  'app_url' => 'http://localhost:5173',
  'api_url' => 'http://localhost:8080',
  // Must be the exact SPA origin in production (e.g. https://codecircuit.space)
  'cors_origin' => 'http://localhost:5173',
  'session_days' => 30,
  'trial_days' => 3,

  // One-time installer lock. Required when crypto_provider is not "demo".
  // Visit /api/install.php?key=YOUR_SECRET once, then leave install.php or rotate the key.
  'install_secret' => 'change-me-install',

  // First admin (created by /api/install.php or setup-local.php)
  'admin_username' => 'admin',
  'admin_password' => 'ChangeMe123!',
  'admin_name' => 'Admin',

  // Crypto — NOWPayments (https://nowpayments.io)
  // Production MUST use nowpayments with a non-empty IPN secret.
  'crypto_provider' => 'demo', // demo | nowpayments
  'nowpayments_api_key' => '',
  'nowpayments_ipn_secret' => '',
  'nowpayments_api_url' => 'https://api.nowpayments.io/v1',
  'pay_currency' => 'usdttrc20',

  // Live crypto rates (Binance → CoinGecko fallback). Cron hits /api/cron/rates?key=…
  'cron_secret' => 'change-me-rates-cron',
  'rates_ttl_seconds' => 300,
];
