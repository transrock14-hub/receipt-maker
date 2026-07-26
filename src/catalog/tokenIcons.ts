/**
 * Token / brand marks — Fabric shapes with explicit top-left origins.
 * USDT mark mirrors Tether’s green disc + double-crossbar T.
 */
import { circle, rect, type FabricObj } from './fabricHelpers'

/** Centered USDT (Tether) coin — green disc + white double-bar T. */
export function usdtCoinIcon(
  prefix: string,
  cx: number,
  top: number,
  radius = 22,
): FabricObj[] {
  const left = cx - radius
  const ink = '#FFFFFF'
  const green = '#26A17B'
  const midX = cx
  const midY = top + radius

  // Official-ish Tether T: wide top bar, shorter mid bar, thick stem
  const topBarW = radius * 0.92
  const topBarH = Math.max(2.8, radius * 0.14)
  const midBarW = radius * 0.52
  const midBarH = Math.max(2.4, radius * 0.12)
  const stemW = Math.max(3.2, radius * 0.18)
  const stemH = radius * 0.72

  const topBarTop = midY - radius * 0.42
  const stemTop = topBarTop
  const stemLeft = midX - stemW / 2
  const topBarLeft = midX - topBarW / 2
  const midBarTop = topBarTop + radius * 0.34
  const midBarLeft = midX - midBarW / 2

  return [
    { ...circle(`${prefix}Bg`, left, top, radius, green), receiptGroup: 'header' },
    {
      ...rect(`${prefix}Top`, topBarLeft, topBarTop, topBarW, topBarH, ink, topBarH * 0.35),
      receiptGroup: 'header',
    },
    {
      ...rect(`${prefix}Stem`, stemLeft, stemTop, stemW, stemH, ink, stemW * 0.25),
      receiptGroup: 'header',
    },
    {
      ...rect(`${prefix}Mid`, midBarLeft, midBarTop, midBarW, midBarH, ink, midBarH * 0.35),
      receiptGroup: 'header',
    },
  ]
}

/** Coinbase blue “C” disc. */
export function coinbaseMark(
  prefix: string,
  cx: number,
  top: number,
  radius = 24,
): FabricObj[] {
  const left = cx - radius
  return [
    { ...circle(`${prefix}Bg`, left, top, radius, '#0052FF'), receiptGroup: 'header' },
    {
      type: 'IText',
      version: '7.0.0',
      left: cx,
      top: top + radius * 0.32,
      text: 'C',
      fontSize: radius * 1.05,
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontWeight: 700,
      fill: '#FFFFFF',
      originX: 'center',
      originY: 'top',
      selectable: false,
      evented: false,
      receiptId: `${prefix}C`,
      receiptGroup: 'header',
    },
  ]
}

/** MetaMask fox — geometric ears + snout (no Path; Fabric-safe). */
export function metamaskMark(
  prefix: string,
  cx: number,
  top: number,
  radius = 18,
): FabricObj[] {
  const orange = '#F6851B'
  const deep = '#E2761B'
  const dark = '#C0AD9E'
  const left = cx - radius
  return [
    { ...circle(`${prefix}Bg`, left, top, radius, orange), receiptGroup: 'header' },
    // Left ear
    {
      ...rect(`${prefix}Le`, cx - radius * 0.85, top + radius * 0.08, radius * 0.42, radius * 0.55, deep, 3),
      angle: -28,
      originX: 'center',
      originY: 'center',
      left: cx - radius * 0.55,
      top: top + radius * 0.35,
      receiptGroup: 'header',
    },
    // Right ear
    {
      ...rect(`${prefix}Re`, cx + radius * 0.15, top + radius * 0.08, radius * 0.42, radius * 0.55, deep, 3),
      angle: 28,
      originX: 'center',
      originY: 'center',
      left: cx + radius * 0.55,
      top: top + radius * 0.35,
      receiptGroup: 'header',
    },
    // Snout
    {
      ...rect(
        `${prefix}Sn`,
        cx - radius * 0.38,
        top + radius * 0.95,
        radius * 0.76,
        radius * 0.42,
        dark,
        4,
      ),
      receiptGroup: 'header',
    },
    // Brow ridge
    {
      ...rect(`${prefix}Br`, cx - radius * 0.5, top + radius * 0.55, radius, radius * 0.14, '#D6C4B3', 2),
      receiptGroup: 'header',
    },
  ]
}

/** PayPal overlapping P marks (simplified). */
export function paypalMark(prefix: string, cx: number, top: number, size = 36): FabricObj[] {
  const blue = '#003087'
  const light = '#009CDE'
  return [
    {
      type: 'IText',
      version: '7.0.0',
      left: cx - 6,
      top,
      text: 'P',
      fontSize: size,
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontWeight: 800,
      fill: blue,
      originX: 'center',
      originY: 'top',
      selectable: false,
      evented: false,
      receiptId: `${prefix}a`,
      receiptGroup: 'header',
    },
    {
      type: 'IText',
      version: '7.0.0',
      left: cx + 6,
      top: top + 4,
      text: 'P',
      fontSize: size,
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontWeight: 800,
      fill: light,
      originX: 'center',
      originY: 'top',
      selectable: false,
      evented: false,
      receiptId: `${prefix}b`,
      receiptGroup: 'header',
    },
  ]
}

/** Wise green circle mark. */
export function wiseMark(prefix: string, cx: number, top: number, radius = 18): FabricObj[] {
  return [
    { ...circle(`${prefix}Bg`, cx - radius, top, radius, '#9FE870'), receiptGroup: 'header' },
    {
      type: 'IText',
      version: '7.0.0',
      left: cx,
      top: top + radius * 0.35,
      text: 'W',
      fontSize: radius * 0.95,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 800,
      fill: '#163300',
      originX: 'center',
      originY: 'top',
      selectable: false,
      evented: false,
      receiptId: `${prefix}W`,
      receiptGroup: 'header',
    },
  ]
}

/** Generic colored disc + ticker letter(s) for any coin. */
export function brandedCoinIcon(
  prefix: string,
  cx: number,
  top: number,
  symbol: string,
  color: string,
  radius = 22,
): FabricObj[] {
  const label = symbol.length <= 2 ? symbol : symbol.slice(0, 1)
  return [
    { ...circle(`${prefix}Bg`, cx - radius, top, radius, color), receiptGroup: 'header' },
    {
      type: 'IText',
      version: '7.0.0',
      left: cx,
      top: top + radius * (label.length > 1 ? 0.38 : 0.28),
      text: label,
      fontSize: radius * (label.length > 1 ? 0.72 : 1.0),
      fontFamily: 'Inter, Roboto, sans-serif',
      fontWeight: 800,
      fill: '#FFFFFF',
      originX: 'center',
      originY: 'top',
      selectable: false,
      evented: false,
      receiptId: `${prefix}L`,
      receiptGroup: 'header',
    },
  ]
}

/** Pick the right mark for a coin symbol. */
export function coinIconFor(
  symbol: string,
  prefix: string,
  cx: number,
  top: number,
  radius = 22,
): FabricObj[] {
  const s = symbol.toUpperCase()
  if (s === 'USDT') return usdtCoinIcon(prefix, cx, top, radius)
  const colors: Record<string, string> = {
    BTC: '#F7931A',
    ETH: '#627EEA',
    USDC: '#2775CA',
    BNB: '#F3BA2F',
    SOL: '#9945FF',
    XRP: '#23292F',
    DOGE: '#C2A633',
    TRX: '#FF0013',
    TON: '#0098EA',
    ADA: '#0033AD',
    AVAX: '#E84142',
    LINK: '#2A5ADA',
    DOT: '#E6007A',
    MATIC: '#8247E5',
  }
  return brandedCoinIcon(prefix, cx, top, s, colors[s] || '#7A5AF8', radius)
}
