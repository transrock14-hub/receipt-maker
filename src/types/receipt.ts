export type TextRole =
  | 'store'
  | 'item'
  | 'total'
  | 'date'
  | 'time'
  | 'phone'
  | 'battery'
  | 'network'
  | 'wallet'
  | 'account'
  | 'status'
  | 'other'

/** Structured slots used to regenerate receipts like Canva brand kits. */
export type FieldKey =
  | 'phoneType'
  | 'time'
  | 'battery'
  | 'walletType'
  | 'date'
  | 'network'
  | 'accountOrIban'
  | 'amountCrypto'
  | 'amountFiat'
  | 'recipient'
  | 'status'
  | 'fee'
  | 'title'
  | 'price'
  | 'coin'
  | 'other'

export const FIELD_DEFS: {
  key: FieldKey
  label: string
  placeholder: string
  group: 'device' | 'transaction' | 'account'
}[] = [
  { key: 'phoneType', label: 'Phone type', placeholder: 'iPhone 16 Pro · S24 Ultra', group: 'device' },
  { key: 'time', label: 'Time', placeholder: '14:26', group: 'device' },
  { key: 'battery', label: 'Battery %', placeholder: '87', group: 'device' },
  {
    key: 'walletType',
    label: 'Wallet / bank type',
    placeholder: 'Crypto wallet · Bank · Mobile money',
    group: 'account',
  },
  {
    key: 'accountOrIban',
    label: 'Account / IBAN / address',
    placeholder: 'bc1q… or IBAN',
    group: 'account',
  },
  { key: 'recipient', label: 'To / Recipient', placeholder: 'Name or address', group: 'account' },
  { key: 'title', label: 'Title', placeholder: 'Sent BTC', group: 'transaction' },
  { key: 'coin', label: 'Coin', placeholder: 'USDT', group: 'transaction' },
  { key: 'amountCrypto', label: 'Crypto amount', placeholder: '-0.00976991 BTC', group: 'transaction' },
  { key: 'amountFiat', label: 'Fiat amount', placeholder: '-$930.05', group: 'transaction' },
  { key: 'price', label: 'Price / rate', placeholder: '$95,195.35', group: 'transaction' },
  { key: 'network', label: 'Chain / network', placeholder: 'BNB Smart Chain (BEP20)', group: 'transaction' },
  { key: 'fee', label: 'Network / bank fee', placeholder: '$0.56', group: 'transaction' },
  { key: 'date', label: 'Date', placeholder: '11:40PM – Jan 13, 2026', group: 'transaction' },
  { key: 'status', label: 'Status', placeholder: 'Pending', group: 'transaction' },
  { key: 'other', label: 'Other text', placeholder: 'Custom', group: 'transaction' },
]

export interface DetectedTextBox {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
  color: string
  bgColor: string
  fontFamily: string
  fontSize: number
  fontWeight: string | number
  role: TextRole
  fieldKey?: FieldKey
}

export interface AnalysisResult {
  boxes: DetectedTextBox[]
  palette: string[]
  width: number
  height: number
}

export interface TemplateField {
  id: string
  role: TextRole
  fieldKey: FieldKey
  label: string
  defaultValue: string
}

export type WalletKind = 'crypto' | 'bank' | 'mobile'

export type InstitutionCategory =
  | 'crypto'
  | 'bank'
  | 'fintech'
  | 'mobile'
  | 'thermal'
  | 'custom'

export type DevicePlatform = 'ios' | 'android' | 'desktop'

export type DeviceId =
  | 'iphone-16-pro-max'
  | 'iphone-16-pro'
  | 'iphone-16'
  | 'iphone-15-pro'
  | 'iphone-15'
  | 'iphone-14-pro'
  | 'iphone-13'
  | 'iphone-se'
  | 's25-ultra'
  | 's24-ultra'
  | 's24'
  | 's23'
  | 'pixel-9-pro'
  | 'pixel-8'
  | 'pixel-8a'
  | 'xiaomi-14'
  | 'oneplus-12'
  | 'desktop-macos'
  | 'desktop-windows'

export interface DeviceBezel {
  /** Outer frame padding around the screen (CSS px at 1x). */
  frame: number
  /** Screen corner radius inside the bezel. */
  screenRadius: number
  /** Outer body corner radius. */
  bodyRadius: number
  /** Bezel / body color. */
  bodyColor: string
  /** Thin rim highlight color. */
  rimColor: string
  /** Extra top chin for island/notch devices (drawn as part of bezel, not content). */
  topChin: number
  /** Bottom chin below home indicator area. */
  bottomChin: number
}

export interface DeviceProfile {
  id: DeviceId
  name: string
  platform: DevicePlatform
  /** CSS viewport width (logical pixels) — like Mobile FIRST device profiles. */
  width: number
  /** CSS viewport height. */
  height: number
  /** Device pixel ratio used for retina PNG export. */
  dpr: number
  statusBarHeight: number
  contentTop: number
  homeIndicator: boolean
  fontFamily: string
  monoFamily: string
  manufacturer?: string
  /** Dynamic Island / punch-hole style for status chrome. */
  faceId?: 'island' | 'notch' | 'hole' | 'none'
  /** Physical bezel mockup for framed transparent PNG exports. */
  bezel: DeviceBezel
}

export interface InstitutionScreen {
  id: string
  name: string
  brand: string
  category: InstitutionCategory
  recommendedDeviceIds: DeviceId[]
  fields: TemplateField[]
  palette: string[]
  /** Background behind app content (device chrome sits on top/edges). */
  background: string
  defaults: Partial<GenerateValues>
}

export interface GenerateValues {
  phoneType: string
  time: string
  battery: string
  /** Status-bar radio label: 5G, LTE, 4G, 5G+, 3G, or blank to hide. */
  cellular: string
  /** Cellular bars 1–4. */
  signal: string
  /** Wi‑Fi tiers 0–3 (0 = off). */
  wifi: string
  /** "1" / "true" when charging. */
  charging: string
  walletType: WalletKind | string
  date: string
  network: string
  accountOrIban: string
  recipient: string
  title: string
  coin: string
  amountCrypto: string
  amountFiat: string
  price: string
  fee: string
  status: string
  other: string
}

export const EMPTY_GENERATE_VALUES: GenerateValues = {
  phoneType: 'Samsung Galaxy S24 Ultra',
  time: '14:26',
  battery: '87',
  cellular: '5G',
  signal: '4',
  wifi: '3',
  charging: '',
  walletType: 'Spot Wallet',
  date: '2026-07-26 14:26:18',
  network: 'BNB Smart Chain (BEP20)',
  accountOrIban: '0x8f3a9c2e...a7e21c',
  recipient: '0x7a2f8c1d...c91e4b2d',
  title: 'Withdrawal Details',
  coin: 'USDT',
  amountCrypto: '-45 USDT',
  amountFiat: '≈ $45.00',
  price: '45 USDT',
  fee: '0.29 USDT',
  status: 'Completed',
  other: 'View on blockchain explorer',
}

export interface ReceiptTemplate {
  id: string
  name: string
  createdAt: string
  updatedAt?: string
  width: number
  height: number
  backgroundDataUrl?: string
  thumbnail?: string
  canvasJson: Record<string, unknown>
  fields: TemplateField[]
  palette: string[]
  isStarter?: boolean
  category?: InstitutionCategory
  deviceId?: DeviceId
  institutionId?: string
}

/** A saved design — kept forever until the user deletes it (Canva-style). */
export interface SavedProject {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  width: number
  height: number
  originalDataUrl?: string
  thumbnail: string
  canvasJson: Record<string, unknown>
  palette: string[]
  fieldValues: Partial<GenerateValues>
  templateId?: string
  deviceId?: DeviceId
  institutionId?: string
}

export interface SelectedObjectProps {
  id: string
  type: string
  text?: string
  fontFamily?: string
  fontSize?: number
  fill?: string
  fontWeight?: string | number
  textAlign?: string
  opacity?: number
  role?: TextRole
  fieldKey?: FieldKey
  confidence?: number
}

export const RECEIPT_FONTS = [
  { label: 'IBM Plex Mono', value: '"IBM Plex Mono", monospace' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'DM Sans', value: '"DM Sans", sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
] as const

export const CUSTOM_PROPS = [
  'receiptId',
  'receiptRole',
  'receiptFieldKey',
  'isCover',
  'isBackground',
  'ocrConfidence',
  'isGuide',
] as const
