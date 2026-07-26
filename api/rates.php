<?php
/**
 * Live crypto USD rates — Binance primary, CoinGecko fallback.
 * Cache: api/data/rates.json (gitignored via api/data/).
 */

function rates_cache_path(): string {
  $dir = __DIR__ . '/data';
  if (!is_dir($dir)) {
    @mkdir($dir, 0775, true);
  }
  return $dir . '/rates.json';
}

/** Symbols we keep in sync with the frontend coin catalog. */
function rates_symbols(): array {
  return [
    'BTC' => ['binance' => 'BTCUSDT', 'coingecko' => 'bitcoin'],
    'ETH' => ['binance' => 'ETHUSDT', 'coingecko' => 'ethereum'],
    'USDT' => ['binance' => null, 'coingecko' => 'tether'],
    'USDC' => ['binance' => 'USDCUSDT', 'coingecko' => 'usd-coin'],
    'BNB' => ['binance' => 'BNBUSDT', 'coingecko' => 'binancecoin'],
    'SOL' => ['binance' => 'SOLUSDT', 'coingecko' => 'solana'],
    'XRP' => ['binance' => 'XRPUSDT', 'coingecko' => 'ripple'],
    'DOGE' => ['binance' => 'DOGEUSDT', 'coingecko' => 'dogecoin'],
    'TRX' => ['binance' => 'TRXUSDT', 'coingecko' => 'tron'],
    'TON' => ['binance' => 'TONUSDT', 'coingecko' => 'the-open-network'],
    'ADA' => ['binance' => 'ADAUSDT', 'coingecko' => 'cardano'],
    'AVAX' => ['binance' => 'AVAXUSDT', 'coingecko' => 'avalanche-2'],
    'LINK' => ['binance' => 'LINKUSDT', 'coingecko' => 'chainlink'],
    'DOT' => ['binance' => 'DOTUSDT', 'coingecko' => 'polkadot'],
    'MATIC' => ['binance' => 'MATICUSDT', 'coingecko' => 'matic-network'],
  ];
}

function rates_fallback(): array {
  return [
    'BTC' => 95000.0,
    'ETH' => 3400.0,
    'USDT' => 1.0,
    'USDC' => 1.0,
    'BNB' => 620.0,
    'SOL' => 180.0,
    'XRP' => 2.4,
    'DOGE' => 0.18,
    'TRX' => 0.25,
    'TON' => 5.5,
    'ADA' => 0.75,
    'AVAX' => 28.0,
    'LINK' => 18.0,
    'DOT' => 7.5,
    'MATIC' => 0.45,
  ];
}

function rates_read_cache(): ?array {
  $path = rates_cache_path();
  if (!is_file($path)) return null;
  $raw = @file_get_contents($path);
  if ($raw === false || $raw === '') return null;
  $data = json_decode($raw, true);
  return is_array($data) ? $data : null;
}

function rates_write_cache(array $payload): void {
  $path = rates_cache_path();
  @file_put_contents($path, json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
}

function http_get_json(string $url, int $timeout = 12): ?array {
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_CONNECTTIMEOUT => 6,
      CURLOPT_TIMEOUT => $timeout,
      CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'User-Agent: ReceiptMakerRates/1.0',
      ],
    ]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false || $code < 200 || $code >= 300) return null;
    $data = json_decode($body, true);
    return is_array($data) ? $data : null;
  }

  $ctx = stream_context_create([
    'http' => [
      'method' => 'GET',
      'timeout' => $timeout,
      'header' => "Accept: application/json\r\nUser-Agent: ReceiptMakerRates/1.0\r\n",
    ],
  ]);
  $body = @file_get_contents($url, false, $ctx);
  if ($body === false) return null;
  $data = json_decode($body, true);
  return is_array($data) ? $data : null;
}

function rates_fetch_binance(): ?array {
  $symbols = [];
  foreach (rates_symbols() as $meta) {
    if (!empty($meta['binance'])) $symbols[] = $meta['binance'];
  }
  $symbols = array_values(array_unique($symbols));
  $url = 'https://api.binance.com/api/v3/ticker/price';
  $rows = http_get_json($url);
  if (!$rows || !is_array($rows)) return null;

  $bySym = [];
  foreach ($rows as $row) {
    if (!is_array($row)) continue;
    $sym = (string)($row['symbol'] ?? '');
    $price = (float)($row['price'] ?? 0);
    if ($sym !== '' && $price > 0) $bySym[$sym] = $price;
  }

  $out = ['USDT' => 1.0];
  foreach (rates_symbols() as $coin => $meta) {
    if ($coin === 'USDT') continue;
    $pair = $meta['binance'] ?? null;
    if ($pair && isset($bySym[$pair])) {
      $out[$coin] = (float)$bySym[$pair];
    }
  }
  // Need most majors
  if (!isset($out['BTC']) || !isset($out['ETH'])) return null;
  return $out;
}

function rates_fetch_coingecko(): ?array {
  $ids = [];
  foreach (rates_symbols() as $meta) {
    $ids[] = $meta['coingecko'];
  }
  $ids = array_values(array_unique($ids));
  $url = 'https://api.coingecko.com/api/v3/simple/price?ids=' . rawurlencode(implode(',', $ids)) . '&vs_currencies=usd';
  $data = http_get_json($url);
  if (!$data) return null;

  $out = [];
  foreach (rates_symbols() as $coin => $meta) {
    $id = $meta['coingecko'];
    $usd = $data[$id]['usd'] ?? null;
    if (is_numeric($usd) && (float)$usd > 0) {
      $out[$coin] = (float)$usd;
    }
  }
  if (!isset($out['BTC'])) return null;
  if (!isset($out['USDT'])) $out['USDT'] = 1.0;
  return $out;
}

function rates_refresh(bool $force = false): array {
  $ttl = (int)(app_config()['rates_ttl_seconds'] ?? 300);
  $cached = rates_read_cache();
  if (!$force && $cached && !empty($cached['updated_at'])) {
    $age = time() - strtotime((string)$cached['updated_at']);
    if ($age >= 0 && $age < $ttl && !empty($cached['rates'])) {
      $cached['stale'] = false;
      return $cached;
    }
  }

  $source = 'fallback';
  $rates = rates_fetch_binance();
  if ($rates) {
    $source = 'binance';
  } else {
    $rates = rates_fetch_coingecko();
    if ($rates) $source = 'coingecko';
  }

  if (!$rates) {
    $rates = rates_fallback();
    if ($cached && !empty($cached['rates'])) {
      $rates = array_merge($rates, $cached['rates']);
      $source = ($cached['source'] ?? 'cache') . '+fallback';
    }
  } else {
    $rates = array_merge(rates_fallback(), $rates);
  }

  $stale = ($source === 'fallback' || strpos($source, 'fallback') !== false);
  $payload = [
    'ok' => true,
    'rates' => $rates,
    'updated_at' => gmdate('c'),
    'source' => $source,
    'stale' => $stale,
  ];
  rates_write_cache($payload);
  return $payload;
}

function rates_public_payload(bool $refreshIfStale = true): array {
  $ttl = (int)(app_config()['rates_ttl_seconds'] ?? 300);
  $cached = rates_read_cache();
  $needs = true;
  if ($cached && !empty($cached['updated_at']) && !empty($cached['rates'])) {
    $age = time() - strtotime((string)$cached['updated_at']);
    $needs = $age < 0 || $age >= $ttl;
  }
  if ($refreshIfStale && $needs) {
    return rates_refresh(false);
  }
  if ($cached) {
    $cached['ok'] = true;
    $cached['stale'] = $needs;
    return $cached;
  }
  return rates_refresh(true);
}
