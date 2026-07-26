import type { FieldKey, ReceiptTemplate, TemplateField, TextRole } from '../types/receipt'
import { fieldKeyToRole } from '../analysis/fields'

function textObj(
  id: string,
  text: string,
  top: number,
  left: number,
  fontSize: number,
  fontWeight: number,
  fieldKey: FieldKey,
  fontFamily = '"DM Sans", sans-serif',
  fill = '#1c1b18',
) {
  const role: TextRole = fieldKeyToRole(fieldKey)
  return {
    type: 'IText',
    version: '7.0.0',
    left,
    top,
    text,
    fontSize,
    fontFamily,
    fontWeight,
    fill,
    originX: 'left',
    originY: 'top',
    padding: 0,
    lineHeight: 1,
    receiptId: id,
    receiptRole: role,
    receiptFieldKey: fieldKey,
  }
}

function labelObj(
  id: string,
  text: string,
  top: number,
  left: number,
  fontSize: number,
  fontWeight: number,
  fontFamily = '"DM Sans", sans-serif',
  fill = '#8a8a8a',
) {
  return {
    type: 'IText',
    version: '7.0.0',
    left,
    top,
    text,
    fontSize,
    fontFamily,
    fontWeight,
    fill,
    originX: 'left',
    originY: 'top',
    padding: 0,
    lineHeight: 1,
    receiptId: id,
    receiptRole: 'other',
    selectable: true,
    editable: true,
  }
}

function rectObj(
  id: string,
  left: number,
  top: number,
  width: number,
  height: number,
  fill: string,
  radius = 0,
) {
  return {
    type: 'Rect',
    version: '7.0.0',
    left,
    top,
    width,
    height,
    fill,
    rx: radius,
    ry: radius,
    strokeWidth: 0,
    selectable: false,
    evented: false,
    receiptId: id,
  }
}

function circleObj(id: string, left: number, top: number, radius: number, fill: string) {
  return {
    type: 'Circle',
    version: '7.0.0',
    left,
    top,
    radius,
    fill,
    strokeWidth: 0,
    selectable: false,
    evented: false,
    receiptId: id,
  }
}

/** Right-aligned value text (Binance detail rows). */
function textRight(
  id: string,
  text: string,
  top: number,
  right: number,
  fontSize: number,
  fontWeight: number,
  fieldKey: FieldKey,
  fontFamily = '"DM Sans", sans-serif',
  fill = '#EAECEF',
) {
  const role: TextRole = fieldKeyToRole(fieldKey)
  return {
    type: 'IText',
    version: '7.0.0',
    left: right,
    top,
    text,
    fontSize,
    fontFamily,
    fontWeight,
    fill,
    originX: 'right',
    originY: 'top',
    padding: 0,
    lineHeight: 1,
    receiptId: id,
    receiptRole: role,
    receiptFieldKey: fieldKey,
  }
}

function textCenter(
  id: string,
  text: string,
  top: number,
  centerX: number,
  fontSize: number,
  fontWeight: number,
  fieldKey: FieldKey,
  fontFamily = '"DM Sans", sans-serif',
  fill = '#EAECEF',
) {
  const role: TextRole = fieldKeyToRole(fieldKey)
  return {
    type: 'IText',
    version: '7.0.0',
    left: centerX,
    top,
    text,
    fontSize,
    fontFamily,
    fontWeight,
    fill,
    originX: 'center',
    originY: 'top',
    padding: 0,
    lineHeight: 1,
    receiptId: id,
    receiptRole: role,
    receiptFieldKey: fieldKey,
  }
}

function labelCenter(
  id: string,
  text: string,
  top: number,
  centerX: number,
  fontSize: number,
  fontWeight: number,
  fontFamily = '"DM Sans", sans-serif',
  fill = '#848E9C',
) {
  return {
    type: 'IText',
    version: '7.0.0',
    left: centerX,
    top,
    text,
    fontSize,
    fontFamily,
    fontWeight,
    fill,
    originX: 'center',
    originY: 'top',
    padding: 0,
    lineHeight: 1,
    receiptId: id,
    receiptRole: 'other',
  }
}

function field(
  id: string,
  fieldKey: FieldKey,
  label: string,
  defaultValue: string,
): TemplateField {
  return {
    id,
    fieldKey,
    role: fieldKeyToRole(fieldKey),
    label,
    defaultValue,
  }
}

export function createBlankStarterTemplate(): ReceiptTemplate {
  const width = 360
  const height = 640
  const mono = '"IBM Plex Mono", monospace'
  const fields: TemplateField[] = [
    field('store', 'title', 'Store / title', 'CORNER MARKET'),
    field('date', 'date', 'Date', '01/15/2026  14:32'),
    field('item1', 'other', 'Item 1', 'Organic Milk 1L          3.49'),
    field('total', 'amountFiat', 'Total', 'TOTAL                  14.83'),
  ]

  const objects = [
    textObj('store', 'CORNER MARKET', 40, 36, 18, 700, 'title', mono),
    textObj('date', '01/15/2026  14:32', 100, 36, 11, 400, 'date', mono),
    textObj('item1', 'Organic Milk 1L          3.49', 150, 28, 12, 400, 'other', mono),
    textObj('total', 'TOTAL                  14.83', 220, 28, 14, 700, 'amountFiat', mono),
  ]

  return {
    id: 'starter-blank-receipt',
    name: 'Blank thermal receipt',
    createdAt: new Date().toISOString(),
    width,
    height,
    canvasJson: {
      version: '7.4.0',
      objects,
      background: '#f7f4ea',
    },
    fields,
    palette: ['#1c1b18', '#f7f4ea', '#c8c4b8', '#0d7a4f'],
    isStarter: true,
    category: 'thermal',
  }
}

export function createCryptoWalletStarter(): ReceiptTemplate {
  const width = 390
  const height = 780
  const sans = '"DM Sans", sans-serif'
  const mono = '"IBM Plex Mono", monospace'

  const fields: TemplateField[] = [
    field('time', 'time', 'Time', '11:40'),
    field('networkSignal', 'network', 'Signal / carrier', '5G+'),
    field('battery', 'battery', 'Battery', '100%'),
    field('title', 'title', 'Title', 'Sent BTC'),
    field('amountCrypto', 'amountCrypto', 'Crypto amount', '-0.00976991 BTC'),
    field('amountFiat', 'amountFiat', 'Fiat amount', '-$930.05'),
    field('recipient', 'recipient', 'To', 'bc1qmm2ngyc3yt79e24un57pkj8ktapteskd7xq3f5'),
    field('account', 'accountOrIban', 'Account / address', 'bc1qmm2ngyc3yt79e24un57pkj8ktapteskd7xq3f5'),
    field('price', 'price', 'Price', '$95,195.35'),
    field('networkName', 'network', 'Network', 'Bitcoin'),
    field('walletType', 'walletType', 'Wallet type', 'Crypto wallet'),
    field('fee', 'fee', 'Network fee', '$0.56'),
    field('date', 'date', 'Date', '11:40PM – Jan 13, 2026'),
    field('status', 'status', 'Status', 'Pending'),
    field('phoneType', 'phoneType', 'Phone type', 'iPhone'),
    field('cta', 'other', 'Footer CTA', 'View on block explorer'),
  ]

  const objects = [
    textObj('time', '11:40', 14, 24, 13, 600, 'time', sans),
    textObj('networkSignal', '5G+', 14, 250, 12, 500, 'network', sans, '#444'),
    textObj('battery', '100%', 14, 310, 12, 500, 'battery', sans, '#444'),
    textObj('title', 'Sent BTC', 64, 48, 17, 600, 'title', sans),
    textObj('amountCrypto', '-0.00976991 BTC', 110, 48, 15, 500, 'amountCrypto', mono, '#666'),
    textObj('amountFiat', '-$930.05', 138, 48, 36, 700, 'amountFiat', sans),
    labelObj('toLabel', 'To', 210, 48, 13, 400, sans, '#888'),
    textObj(
      'recipient',
      'bc1qmm2ngyc3yt79e24un57pkj8ktapteskd7xq3f5',
      210,
      120,
      12,
      500,
      'recipient',
      mono,
      '#222',
    ),
    labelObj('priceLabel', 'Price', 250, 48, 13, 400, sans, '#888'),
    textObj('price', '$95,195.35', 250, 240, 13, 600, 'price', sans),
    labelObj('networkLabel', 'Network', 286, 48, 13, 400, sans, '#888'),
    textObj('networkName', 'Bitcoin', 286, 240, 13, 600, 'network', sans),
    labelObj('walletLabel', 'Wallet', 322, 48, 13, 400, sans, '#888'),
    textObj('walletType', 'Crypto wallet', 322, 200, 13, 600, 'walletType', sans),
    labelObj('feeLabel', 'Network fee', 358, 48, 13, 400, sans, '#888'),
    textObj('fee', '$0.56', 358, 280, 13, 600, 'fee', sans),
    labelObj('dateLabel', 'Date', 394, 48, 13, 400, sans, '#888'),
    textObj('date', '11:40PM – Jan 13, 2026', 394, 160, 13, 500, 'date', sans),
    labelObj('statusLabel', 'Status', 460, 48, 13, 400, sans, '#888'),
    textObj('status', 'Pending', 460, 240, 14, 700, 'status', sans, '#0a7a3e'),
    textObj('phoneType', 'iPhone', 500, 48, 11, 400, 'phoneType', sans, '#999'),
    textObj('account', 'Account · bc1q…f5', 530, 48, 11, 400, 'accountOrIban', mono, '#666'),
    textObj('cta', 'View on block explorer', 600, 70, 14, 600, 'other', sans, '#1a1a1a'),
  ]

  return {
    id: 'starter-crypto-wallet',
    name: 'Crypto wallet (phone)',
    createdAt: new Date().toISOString(),
    width,
    height,
    canvasJson: {
      version: '7.4.0',
      objects,
      background: '#ffffff',
    },
    fields,
    palette: ['#1c1b18', '#ffffff', '#888888', '#0a7a3e', '#7a5af8'],
    isStarter: true,
    category: 'crypto',
  }
}

/**
 * Authentic Binance “Withdrawal Details” on Samsung Galaxy S24 Ultra (One UI).
 * Looks like an original phone screenshot — not a labeled mockup.
 */
export function createBinanceWalletStarter(): ReceiptTemplate {
  const width = 360
  const height = 800
  const sans = 'Roboto, "DM Sans", sans-serif'
  const mono = '"Roboto Mono", "IBM Plex Mono", monospace'
  const ink = '#EAECEF'
  const muted = '#848E9C'
  const yellow = '#F0B90B'
  const bg = '#181A20'
  const green = '#0ECB81'
  const usdt = '#26A17B'
  const line = '#2B3139'
  const right = 344
  const cx = width / 2

  const fields: TemplateField[] = [
    field('time', 'time', 'Time', '14:26'),
    field('battery', 'battery', 'Battery', '87'),
    field('phoneType', 'phoneType', 'Phone type', 'Samsung Galaxy S24 Ultra'),
    field('walletType', 'walletType', 'Wallet type', 'Spot Wallet'),
    field('title', 'title', 'Screen title', 'Withdrawal Details'),
    field('amountCrypto', 'amountCrypto', 'Crypto amount', '-45 USDT'),
    field('amountFiat', 'amountFiat', 'Fiat amount', '≈ $45.00'),
    field('recipient', 'recipient', 'Address', '0x7a2f8c1d...c91e4b2d'),
    field('account', 'accountOrIban', 'TxID', '0x8f3a9c2e...a7e21c'),
    field('networkName', 'network', 'Network', 'BNB Smart Chain (BEP20)'),
    field('fee', 'fee', 'Network fee', '0.29 USDT'),
    field('date', 'date', 'Date', '2026-07-26 14:26:18'),
    field('status', 'status', 'Status', 'Completed'),
    field('price', 'price', 'Withdraw amount', '45 USDT'),
    field('cta', 'other', 'Explorer link', 'View on blockchain explorer'),
  ]

  const battOutline = {
    type: 'Rect',
    version: '7.0.0',
    left: 318,
    top: 14,
    width: 22,
    height: 11,
    fill: '',
    stroke: ink,
    strokeWidth: 1.2,
    rx: 2,
    ry: 2,
    selectable: false,
    evented: false,
    receiptId: 'battOutline',
  }

  const objects = [
    // Status bar — One UI style (geometry icons, no fake emoji)
    textObj('time', '14:26', 12, 14, 13, 500, 'time', sans, ink),
    rectObj('sig1', 248, 20, 3, 5, ink, 0.5),
    rectObj('sig2', 253, 18, 3, 7, ink, 0.5),
    rectObj('sig3', 258, 15, 3, 10, ink, 0.5),
    rectObj('sig4', 263, 13, 3, 12, ink, 0.5),
    labelObj('fiveG', '5G', 12, 272, 11, 700, sans, ink),
    rectObj('wf1', 298, 14, 10, 2, ink, 1),
    rectObj('wf2', 300, 18, 6, 2, ink, 1),
    rectObj('wf3', 302, 22, 2, 2, ink, 1),
    battOutline,
    rectObj('battFill', 320, 16, 15, 7, ink, 1),
    rectObj('battTip', 340, 17, 2, 5, ink, 1),
    textObj('battery', '87', 12, 346, 11, 500, 'battery', sans, ink),

    // App bar
    labelObj('back', '←', 48, 10, 20, 400, sans, ink),
    textCenter('title', 'Withdrawal Details', 52, cx, 16, 500, 'title', sans, ink),

    // Compact USDT mark (real Binance shows asset icon)
    circleObj('usdtBg', cx - 14, 96, 14, usdt),
    labelCenter('usdtT', 'T', 101, cx, 14, 700, sans, '#FFFFFF'),

    textCenter('amountCrypto', '-45 USDT', 136, cx, 26, 700, 'amountCrypto', sans, ink),
    textCenter('amountFiat', '≈ $45.00', 170, cx, 13, 400, 'amountFiat', sans, muted),
    textCenter('status', 'Completed', 196, cx, 13, 500, 'status', sans, green),

    // Detail list
    labelObj('coinL', 'Coin', 248, 16, 14, 400, sans, muted),
    labelObj('coinV', 'USDT', 248, 304, 14, 400, sans, ink),
    rectObj('d1', 16, 284, 328, 1, line),

    labelObj('addrL', 'Address', 308, 16, 14, 400, sans, muted),
    textRight('recipient', '0x7a2f8c1d...c91e4b2d', 308, right, 13, 400, 'recipient', mono, ink),
    rectObj('d2', 16, 344, 328, 1, line),

    labelObj('netL', 'Network', 368, 16, 14, 400, sans, muted),
    textRight('networkName', 'BNB Smart Chain (BEP20)', 368, right, 12, 400, 'network', sans, ink),
    rectObj('d3', 16, 404, 328, 1, line),

    labelObj('amtL', 'Withdraw amount', 428, 16, 14, 400, sans, muted),
    textRight('price', '45 USDT', 428, right, 14, 400, 'price', sans, ink),
    rectObj('d4', 16, 464, 328, 1, line),

    labelObj('feeL', 'Network fee', 488, 16, 14, 400, sans, muted),
    textRight('fee', '0.29 USDT', 488, right, 14, 400, 'fee', sans, ink),
    rectObj('d5', 16, 524, 328, 1, line),

    labelObj('dateL', 'Date', 548, 16, 14, 400, sans, muted),
    textRight('date', '2026-07-26 14:26:18', 548, right, 12, 400, 'date', sans, ink),
    rectObj('d6', 16, 584, 328, 1, line),

    labelObj('txL', 'TxID', 608, 16, 14, 400, sans, muted),
    textRight('account', '0x8f3a9c2e...a7e21c >', 608, right, 12, 400, 'accountOrIban', mono, yellow),
    rectObj('d7', 16, 644, 328, 1, line),

    labelObj('stL', 'Status', 668, 16, 14, 400, sans, muted),
    labelObj('stV', 'Completed', 668, 252, 14, 500, sans, green),
    rectObj('d8', 16, 704, 328, 1, line),

    labelObj('walL', 'Wallet', 728, 16, 14, 400, sans, muted),
    textRight('walletType', 'Spot Wallet', 728, right, 14, 400, 'walletType', sans, ink),

    textCenter('cta', 'View on blockchain explorer', 770, cx, 14, 400, 'other', sans, yellow),
    rectObj('homeBar', 130, 788, 100, 4, '#474D57', 2),

    textObj('phoneType', 'Samsung Galaxy S24 Ultra', -40, 0, 1, 400, 'phoneType', sans, bg),
  ]

  return {
    id: 'starter-binance-wallet',
    name: 'Binance · Withdrawal · S24 Ultra',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    width,
    height,
    canvasJson: {
      version: '7.4.0',
      objects,
      background: bg,
    },
    fields,
    palette: [bg, ink, yellow, green, usdt, muted],
    isStarter: true,
    category: 'crypto',
  }
}

export const BINANCE_USDT_45_VALUES = {
  phoneType: 'Samsung Galaxy S24 Ultra',
  time: '14:26',
  battery: '87',
  walletType: 'Spot Wallet',
  date: '2026-07-26 14:26:18',
  network: 'BNB Smart Chain (BEP20)',
  accountOrIban: '0x8f3a9c2e...a7e21c >',
  recipient: '0x7a2f8c1d...c91e4b2d',
  title: 'Withdrawal Details',
  amountCrypto: '-45 USDT',
  amountFiat: '≈ $45.00',
  price: '45 USDT',
  fee: '0.29 USDT',
  status: 'Completed',
  other: 'View on blockchain explorer',
} as const
