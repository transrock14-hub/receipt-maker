# Receipt Maker

Screenshot studio for wallet & bank receipt mockups. Generate device-accurate screens across crypto, banks, fintech, and mobile money — with live preview, light/dark themes, and export/copy.

Live: [codecircuit.space](https://codecircuit.space/)

## Run

```bash
npm install
npm run setup:local   # SQLite API + demo admin
npm run dev           # Vite (frontend)
npm run dev:api       # PHP API on :8080
```

Open the Vite URL (usually `http://localhost:5173`).

## Studio highlights

- **Generate** — 16 institution screens × 19 devices, status-bar chrome, Light/Dark theme
- **Study** — research kits + OCR study of your own screenshots
- **Editor** — Fabric canvas, layers, properties, keyboard shortcuts (`?`)
- **Billing** — trial + USDT plans; Admin platform monitor for logins/IPs/actions

## Stack

Vite · React · TypeScript · Fabric.js · Tesseract.js · PHP API (MySQL / SQLite) · IndexedDB

## Deploy

See `DEPLOY-CODECIRCUIT.md` and `HOSTINGER.md`. Secrets stay in `api/config.local.php` (gitignored).
