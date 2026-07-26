# Deploy Receipt Maker → codecircuit.space (Hostinger)

Package ready: `deploy/receipt-maker-codecircuit.zip` (also on your Desktop).

Your DB is already created:
- Database: `u394661966_receipt`
- User: `u394661966_receipt`
- Password: (set in the zip’s `api/config.local.php`)

## A) Import the database (required once)

1. hPanel → **codecircuit.space** → **Databases** → **Enter phpMyAdmin**
2. Select database `u394661966_receipt`
3. **Import** → choose `sql/schema.sql` from the unzipped package → Go

## B) Upload the site (File Manager)

1. hPanel → **File Manager** → open `public_html` for **codecircuit.space**
2. Upload `receipt-maker-codecircuit.zip`
3. Right-click zip → **Extract** into `public_html` (so you see `index.html` + `api/` at the root of `public_html`)
4. Delete the zip after extract

You should have:

```
public_html/
  index.html
  assets/
  .htaccess
  api/
    index.php
    bootstrap.php
    install.php
    config.local.php
    …
  sql/schema.sql   (optional to keep)
```

## C) Create admin

Open once:

https://codecircuit.space/api/install.php

Then **delete** `public_html/api/install.php` in File Manager.

Login:
- Username: `admin`
- Password: `ChangeMe123!`

Change that password after first login (or edit `api/config.local.php` before install and re-run).

## D) Verify

- Site: https://codecircuit.space/
- API health: https://codecircuit.space/api/health  
  Should return `{"ok":true,"service":"receipt-maker-api"}`

DNS can take up to 24h if nameservers just changed.

## Deploy via Hostinger API (optional)

This machine has **no Hostinger API token**, so API deploy can’t run from here yet.

1. hPanel → profile / API → create **API token**
2. Send the token (or set `HOSTINGER_API_TOKEN` in the environment)
3. Ask again to “deploy via Hostinger API” — we can upload the same zip with `hosting_deployStaticWebsite`

## Live crypto rates (cron)

Receipt fields auto-price BTC, ETH, USDT (TRC20/ERC20/BEP20), and more from live USD rates.

1. Set in `api/config.local.php`:
   - `cron_secret` → long random string
   - `rates_ttl_seconds` → `300` (5 minutes)
2. In Hostinger hPanel → **Cron Jobs**, add every 5 minutes:

```bash
curl -fsS "https://codecircuit.space/api/cron/rates?key=YOUR_CRON_SECRET" >/dev/null 2>&1
```

3. App reads `GET /api/rates` (cached). Cron forces a Binance refresh (CoinGecko fallback).

Manual refresh once after deploy:

```bash
curl -fsS "https://codecircuit.space/api/cron/rates?key=YOUR_CRON_SECRET"
```

