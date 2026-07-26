import type { DeviceId, DeviceBezel, DeviceProfile, GenerateValues } from '../types/receipt'
import { circle, label, rect, textObj, type FabricObj } from './fabricHelpers'
import {
  batteryPctWidth,
  batterySize,
  cellularLabelWidth,
  drawBattery,
  drawSignal,
  drawWifi,
  signalSize,
  wifiSize,
} from './statusIcons'

const iosBezel = (opts?: Partial<DeviceBezel>): DeviceBezel => ({
  frame: 14,
  screenRadius: 44,
  bodyRadius: 52,
  bodyColor: '#1C1C1E',
  rimColor: '#3A3A3C',
  topChin: 0,
  bottomChin: 0,
  ...opts,
})

const androidBezel = (opts?: Partial<DeviceBezel>): DeviceBezel => ({
  frame: 10,
  screenRadius: 28,
  bodyRadius: 34,
  bodyColor: '#111111',
  rimColor: '#2C2C2C',
  topChin: 0,
  bottomChin: 0,
  ...opts,
})

const desktopBezel = (opts?: Partial<DeviceBezel>): DeviceBezel => ({
  frame: 12,
  screenRadius: 10,
  bodyRadius: 12,
  bodyColor: '#2C2C2E',
  rimColor: '#48484A',
  topChin: 0,
  bottomChin: 0,
  ...opts,
})

const IOS_FONT = '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif'
const IOS_MONO = 'ui-monospace, "SF Mono", "IBM Plex Mono", monospace'
const ANDROID_FONT = 'Roboto, "Noto Sans", "DM Sans", sans-serif'
const ANDROID_MONO = '"Roboto Mono", "IBM Plex Mono", monospace'

export const DEVICES: DeviceProfile[] = [
  // —— Apple ——
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    manufacturer: 'Apple',
    platform: 'ios',
    width: 440,
    height: 956,
    dpr: 3,
    statusBarHeight: 62,
    contentTop: 62,
    homeIndicator: true,
    faceId: 'island',
    fontFamily: IOS_FONT,
    monoFamily: IOS_MONO,
    bezel: iosBezel({ screenRadius: 52, bodyRadius: 60, bodyColor: '#2C2C2A', frame: 13 }),
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    manufacturer: 'Apple',
    platform: 'ios',
    width: 402,
    height: 874,
    dpr: 3,
    statusBarHeight: 62,
    contentTop: 62,
    homeIndicator: true,
    faceId: 'island',
    fontFamily: IOS_FONT,
    monoFamily: IOS_MONO,
    bezel: iosBezel({ screenRadius: 48, bodyRadius: 56, bodyColor: '#2C2C2A' }),
  },
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    manufacturer: 'Apple',
    platform: 'ios',
    width: 393,
    height: 852,
    dpr: 3,
    statusBarHeight: 59,
    contentTop: 59,
    homeIndicator: true,
    faceId: 'island',
    fontFamily: IOS_FONT,
    monoFamily: IOS_MONO,
    bezel: iosBezel({ bodyColor: '#1C1C1E' }),
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    manufacturer: 'Apple',
    platform: 'ios',
    width: 393,
    height: 852,
    dpr: 3,
    statusBarHeight: 59,
    contentTop: 59,
    homeIndicator: true,
    faceId: 'island',
    fontFamily: IOS_FONT,
    monoFamily: IOS_MONO,
    bezel: iosBezel({ screenRadius: 46, bodyRadius: 54, bodyColor: '#3A3A3C' }),
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    manufacturer: 'Apple',
    platform: 'ios',
    width: 393,
    height: 852,
    dpr: 3,
    statusBarHeight: 59,
    contentTop: 59,
    homeIndicator: true,
    faceId: 'island',
    fontFamily: IOS_FONT,
    monoFamily: IOS_MONO,
    bezel: iosBezel({ bodyColor: '#1C1C1E' }),
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    manufacturer: 'Apple',
    platform: 'ios',
    width: 393,
    height: 852,
    dpr: 3,
    statusBarHeight: 59,
    contentTop: 59,
    homeIndicator: true,
    faceId: 'island',
    fontFamily: IOS_FONT,
    monoFamily: IOS_MONO,
    bezel: iosBezel({ bodyColor: '#2C2C2E' }),
  },
  {
    id: 'iphone-13',
    name: 'iPhone 13',
    manufacturer: 'Apple',
    platform: 'ios',
    width: 390,
    height: 844,
    dpr: 3,
    statusBarHeight: 47,
    contentTop: 47,
    homeIndicator: true,
    faceId: 'notch',
    fontFamily: IOS_FONT,
    monoFamily: IOS_MONO,
    bezel: iosBezel({ screenRadius: 40, bodyRadius: 48, frame: 12 }),
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE (3rd)',
    manufacturer: 'Apple',
    platform: 'ios',
    width: 375,
    height: 667,
    dpr: 2,
    statusBarHeight: 20,
    contentTop: 20,
    homeIndicator: false,
    faceId: 'none',
    fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
    monoFamily: IOS_MONO,
    bezel: iosBezel({
      frame: 16,
      screenRadius: 8,
      bodyRadius: 36,
      topChin: 18,
      bottomChin: 48,
      bodyColor: '#1C1C1E',
    }),
  },
  // —— Samsung ——
  {
    id: 's25-ultra',
    name: 'Samsung Galaxy S25 Ultra',
    manufacturer: 'Samsung',
    platform: 'android',
    width: 360,
    height: 780,
    dpr: 3,
    statusBarHeight: 36,
    contentTop: 36,
    homeIndicator: true,
    faceId: 'hole',
    fontFamily: ANDROID_FONT,
    monoFamily: ANDROID_MONO,
    bezel: androidBezel({ frame: 4, screenRadius: 14, bodyRadius: 18, bodyColor: '#050505' }),
  },
  {
    id: 's24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    manufacturer: 'Samsung',
    platform: 'android',
    width: 360,
    height: 780,
    dpr: 3,
    statusBarHeight: 36,
    contentTop: 36,
    homeIndicator: true,
    faceId: 'hole',
    fontFamily: ANDROID_FONT,
    monoFamily: ANDROID_MONO,
    bezel: androidBezel({ frame: 5, screenRadius: 16, bodyRadius: 20, bodyColor: '#0A0A0A' }),
  },
  {
    id: 's24',
    name: 'Samsung Galaxy S24',
    manufacturer: 'Samsung',
    platform: 'android',
    width: 360,
    height: 780,
    dpr: 3,
    statusBarHeight: 36,
    contentTop: 36,
    homeIndicator: true,
    faceId: 'hole',
    fontFamily: ANDROID_FONT,
    monoFamily: ANDROID_MONO,
    bezel: androidBezel({ frame: 6, screenRadius: 26, bodyRadius: 32, bodyColor: '#101010' }),
  },
  {
    id: 's23',
    name: 'Samsung Galaxy S23',
    manufacturer: 'Samsung',
    platform: 'android',
    width: 360,
    height: 780,
    dpr: 3,
    statusBarHeight: 36,
    contentTop: 36,
    homeIndicator: true,
    faceId: 'hole',
    fontFamily: ANDROID_FONT,
    monoFamily: ANDROID_MONO,
    bezel: androidBezel({ frame: 6, screenRadius: 28, bodyRadius: 34 }),
  },
  // —— Google ——
  {
    id: 'pixel-9-pro',
    name: 'Google Pixel 9 Pro',
    manufacturer: 'Google',
    platform: 'android',
    width: 412,
    height: 915,
    dpr: 2.625,
    statusBarHeight: 40,
    contentTop: 40,
    homeIndicator: true,
    faceId: 'hole',
    fontFamily: 'Roboto, "Google Sans", "DM Sans", sans-serif',
    monoFamily: ANDROID_MONO,
    bezel: androidBezel({ frame: 8, screenRadius: 36, bodyRadius: 42, bodyColor: '#1A1C1E' }),
  },
  {
    id: 'pixel-8',
    name: 'Google Pixel 8',
    manufacturer: 'Google',
    platform: 'android',
    width: 412,
    height: 915,
    dpr: 2.625,
    statusBarHeight: 40,
    contentTop: 40,
    homeIndicator: true,
    faceId: 'hole',
    fontFamily: 'Roboto, "Google Sans", "DM Sans", sans-serif',
    monoFamily: ANDROID_MONO,
    bezel: androidBezel({ frame: 8, screenRadius: 32, bodyRadius: 38, bodyColor: '#1A1C1E' }),
  },
  {
    id: 'pixel-8a',
    name: 'Google Pixel 8a',
    manufacturer: 'Google',
    platform: 'android',
    width: 412,
    height: 915,
    dpr: 2.625,
    statusBarHeight: 40,
    contentTop: 40,
    homeIndicator: true,
    faceId: 'hole',
    fontFamily: 'Roboto, "Google Sans", "DM Sans", sans-serif',
    monoFamily: ANDROID_MONO,
    bezel: androidBezel({ frame: 9, screenRadius: 30, bodyRadius: 36, bodyColor: '#202124' }),
  },
  // —— Others ——
  {
    id: 'xiaomi-14',
    name: 'Xiaomi 14',
    manufacturer: 'Xiaomi',
    platform: 'android',
    width: 360,
    height: 800,
    dpr: 3,
    statusBarHeight: 36,
    contentTop: 36,
    homeIndicator: true,
    faceId: 'hole',
    fontFamily: 'Roboto, "MiSans", "Noto Sans", sans-serif',
    monoFamily: ANDROID_MONO,
    bezel: androidBezel({ frame: 6, screenRadius: 24, bodyRadius: 30, bodyColor: '#0D0D0D' }),
  },
  {
    id: 'oneplus-12',
    name: 'OnePlus 12',
    manufacturer: 'OnePlus',
    platform: 'android',
    width: 360,
    height: 800,
    dpr: 3,
    statusBarHeight: 36,
    contentTop: 36,
    homeIndicator: true,
    faceId: 'hole',
    fontFamily: 'Roboto, "OnePlus Sans", "Noto Sans", sans-serif',
    monoFamily: ANDROID_MONO,
    bezel: androidBezel({ frame: 5, screenRadius: 22, bodyRadius: 28, bodyColor: '#111111' }),
  },
  // —— Desktop ——
  {
    id: 'desktop-macos',
    name: 'macOS Browser',
    manufacturer: 'Apple',
    platform: 'desktop',
    width: 1280,
    height: 800,
    dpr: 2,
    statusBarHeight: 72,
    contentTop: 72,
    homeIndicator: false,
    faceId: 'none',
    fontFamily: '-apple-system, "SF Pro Text", Inter, "DM Sans", sans-serif',
    monoFamily: 'ui-monospace, "SF Mono", monospace',
    bezel: desktopBezel({ frame: 16, screenRadius: 8, bodyRadius: 14 }),
  },
  {
    id: 'desktop-windows',
    name: 'Windows Browser',
    manufacturer: 'Microsoft',
    platform: 'desktop',
    width: 1280,
    height: 800,
    dpr: 1.5,
    statusBarHeight: 64,
    contentTop: 64,
    homeIndicator: false,
    faceId: 'none',
    fontFamily: '"Segoe UI", Roboto, "DM Sans", sans-serif',
    monoFamily: 'Consolas, "IBM Plex Mono", monospace',
    bezel: desktopBezel({ frame: 10, screenRadius: 4, bodyRadius: 6, bodyColor: '#202020' }),
  },
]

export function getDevice(id: DeviceId): DeviceProfile {
  const d = DEVICES.find((x) => x.id === id)
  if (!d) throw new Error(`Unknown device: ${id}`)
  return d
}

export function devicesByManufacturer(): Record<string, DeviceProfile[]> {
  const map: Record<string, DeviceProfile[]> = {}
  for (const d of DEVICES) {
    const m = d.manufacturer || 'Other'
    if (!map[m]) map[m] = []
    map[m].push(d)
  }
  return map
}

function parseBatteryPct(raw: string | undefined, fallback: number): number {
  const n = Number(String(raw ?? fallback).replace('%', '').replace(/charging/i, '').trim())
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.min(100, Math.round(n)))
}

function isCharging(values: GenerateValues): boolean {
  const c = String(values.charging || '').trim().toLowerCase()
  if (c === '1' || c === 'true' || c === 'yes' || c === 'on') return true
  return /charg/i.test(String(values.battery || ''))
}

function parseBars(raw: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number(String(raw ?? fallback).trim())
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

function cellularLabel(values: GenerateValues): string {
  const raw = String(values.cellular ?? '5G').trim()
  if (!raw || /^(off|none|hide|0)$/i.test(raw)) return ''
  // Don't show chain names in the status bar
  if (/smart\s*chain|bep20|erc20|bitcoin|ethereum|base\b|solana/i.test(raw)) return '5G'
  return raw.slice(0, 6)
}

function formatStatusTime(raw: string | undefined, platform: 'ios' | 'android'): string {
  const t = (raw || (platform === 'ios' ? '9:41' : '14:26')).trim()
  const m = t.match(/(\d{1,2}):(\d{2})/)
  if (!m) return t
  const h = Number(m[1])
  const min = m[2]
  if (platform === 'ios') return `${h}:${min}`
  return `${String(h).padStart(2, '0')}:${min}`
}

function inkIsLight(ink: string): boolean {
  const h = ink.replace('#', '').trim()
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
}

/**
 * Samsung One UI status bar.
 * Order (L→R toward edge): radio · signal · wifi · % · battery
 */
function samsungStatus(
  device: DeviceProfile,
  values: GenerateValues,
  ink: string,
  mask: string,
): FabricObj[] {
  const w = device.width
  const time = formatStatusTime(values.time, 'android')
  const pct = parseBatteryPct(values.battery, 87)
  const charging = isCharging(values)
  const bars = parseBars(values.signal, 1, 4, 4)
  const wifiLvl = parseBars(values.wifi, 0, 3, 3)
  const radio = cellularLabel(values)
  const font = device.fontFamily
  const edge = 16
  const iconTop = 12
  const gap = 6
  const sigOpts = { barW: 2.85, gap: 1.55, maxH: 11.2, bars }

  const battW = batterySize('oneui').width
  const wifiW = wifiSize('oneui').width
  const sigW = signalSize(sigOpts).width
  const pctStr = String(pct)
  const pctW = batteryPctWidth(pctStr, 12)
  const radioW = radio ? cellularLabelWidth(radio, 11) : 0

  const battLeft = w - edge - battW
  const pctLeft = battLeft - 4 - pctW
  const wifiLeft = pctLeft - gap - wifiW
  const sigLeft = wifiLeft - gap - sigW
  const radioLeft = sigLeft - (radioW ? gap * 0.85 + radioW : 0)

  const objs: FabricObj[] = [
    textObj('time', time, iconTop - 1, 16, 13.5, 600, 'time', font, ink),
  ]
  if (radio) {
    objs.push(label('cellular', radio, iconTop + 0.2, radioLeft, 11, 700, font, ink))
  }
  objs.push(
    ...drawSignal('sig', sigLeft, iconTop, ink, { ...sigOpts, style: 'oneui' }).objs,
    ...drawWifi('wf', wifiLeft, iconTop - 0.2, ink, mask, wifiLvl, 'oneui').objs,
    textObj('battery', pctStr, iconTop - 0.2, pctLeft, 12, 600, 'battery', font, ink),
    ...drawBattery('batt', battLeft, iconTop + 0.35, pct, ink, 'oneui', { charging }).objs,
  )
  return objs
}

/** Pixel / Material You (+ Xiaomi / OnePlus). */
function pixelStatus(
  device: DeviceProfile,
  values: GenerateValues,
  ink: string,
  mask: string,
): FabricObj[] {
  const w = device.width
  const time = formatStatusTime(values.time, 'android')
  const pct = parseBatteryPct(values.battery, 87)
  const charging = isCharging(values)
  const bars = parseBars(values.signal, 1, 4, 4)
  const wifiLvl = parseBars(values.wifi, 0, 3, 3)
  const radio = cellularLabel(values)
  const font = device.fontFamily
  const edge = 18
  const iconTop = 12
  const gap = 6.5
  const sigOpts = { barW: 3, gap: 1.65, maxH: 11.2, bars }

  const battW = batterySize('material').width
  const wifiW = wifiSize('material').width
  const sigW = signalSize(sigOpts).width
  const pctStr = String(pct)
  const pctW = batteryPctWidth(pctStr, 12)
  const radioW = radio ? cellularLabelWidth(radio, 11) : 0

  const battLeft = w - edge - battW
  const pctLeft = battLeft - 5 - pctW
  const wifiLeft = pctLeft - gap - wifiW
  const sigLeft = wifiLeft - gap - sigW
  const radioLeft = sigLeft - (radioW ? gap * 0.85 + radioW : 0)

  const objs: FabricObj[] = [
    textObj('time', time, iconTop - 1, 18, 13.5, 500, 'time', font, ink),
  ]
  if (radio) {
    objs.push(label('cellular', radio, iconTop + 0.2, radioLeft, 11, 600, font, ink))
  }
  objs.push(
    ...drawSignal('sig', sigLeft, iconTop, ink, { ...sigOpts, style: 'material' }).objs,
    ...drawWifi('wf', wifiLeft, iconTop - 0.2, ink, mask, wifiLvl, 'material').objs,
    textObj('battery', pctStr, iconTop - 0.2, pctLeft, 12, 500, 'battery', font, ink),
    ...drawBattery('batt', battLeft, iconTop + 0.2, pct, ink, 'material', { charging }).objs,
  )
  return objs
}

function androidStatus(
  device: DeviceProfile,
  values: GenerateValues,
  ink: string,
  mask: string,
): FabricObj[] {
  if (device.manufacturer === 'Samsung') return samsungStatus(device, values, ink, mask)
  return pixelStatus(device, values, ink, mask)
}

function iosStatus(
  device: DeviceProfile,
  values: GenerateValues,
  ink: string,
  mask: string,
): FabricObj[] {
  const w = device.width
  const time = formatStatusTime(values.time, 'ios')
  const pct = parseBatteryPct(values.battery, 100)
  const charging = isCharging(values)
  const bars = parseBars(values.signal, 1, 4, 4)
  const wifiLvl = parseBars(values.wifi, 0, 3, 3)
  const face = device.faceId || (device.id === 'iphone-se' ? 'none' : 'island')
  const island = face === 'island'
  const notch = face === 'notch'
  const objs: FabricObj[] = []
  const font = device.fontFamily
  const gap = 5.25
  const sigOpts = { barW: 3.05, gap: 1.55, maxH: 10.8, bars }

  objs.push(textObj('time', time, island || notch ? 14.5 : 11.5, 28, 15.5, 600, 'time', font, ink))

  if (island) {
    const iw = device.id.includes('pro-max') ? 134 : 125
    const ih = 35
    objs.push(rect('island', w / 2 - iw / 2, 11, iw, ih, '#000000', ih / 2))
  } else if (notch) {
    objs.push(rect('notch', w / 2 - 75, 0, 150, 32, '#000000', 18))
  } else if (face === 'none') {
    objs.push(rect('earpiece', w / 2 - 30, 7, 60, 6, '#000000', 3))
  }

  // iOS: radio · signal · wifi · % · battery
  const iconTop = island || notch ? 16.5 : 12.5
  const edge = 16
  const radio = cellularLabel(values)
  const battW = batterySize('ios').width
  const wifiW = wifiSize('ios').width
  const sigW = signalSize(sigOpts).width
  const pctStr = String(pct)
  const pctW = batteryPctWidth(pctStr, 12.5)
  const radioW = radio ? cellularLabelWidth(radio, 12) : 0

  const battLeft = w - edge - battW
  const pctLeft = battLeft - 4.5 - pctW
  const wifiLeft = pctLeft - gap - wifiW
  const sigLeft = wifiLeft - gap - sigW
  const radioLeft = sigLeft - (radioW ? gap * 0.7 + radioW : 0)

  if (radio) {
    objs.push(label('cellular', radio, iconTop - 0.15, radioLeft, 12, 600, font, ink))
  }
  objs.push(
    ...drawSignal('sig', sigLeft, iconTop, ink, { ...sigOpts, style: 'ios' }).objs,
    ...drawWifi('wf', wifiLeft, iconTop - 0.1, ink, mask, wifiLvl, 'ios').objs,
    textObj('battery', pctStr, iconTop - 0.35, pctLeft, 12.5, 600, 'battery', font, ink),
    ...drawBattery('batt', battLeft, iconTop + 0.05, pct, ink, 'ios', { charging }).objs,
  )
  return objs
}

function desktopChrome(
  device: DeviceProfile,
  values: GenerateValues,
  ink: string,
  bar: string,
  appUrl?: string,
): FabricObj[] {
  const w = device.width
  const isMac = device.id === 'desktop-macos'
  const url = appUrl || 'https://app.binance.com/wallet/withdraw'
  const objs: FabricObj[] = [
    { ...rect('titleBar', 0, 0, w, device.statusBarHeight, bar), receiptGroup: 'chrome' },
  ]
  if (isMac) {
    objs.push(
      { ...circle('tlRed', 14, 14, 6, '#FF5F57'), receiptGroup: 'chrome' },
      { ...circle('tlYellow', 34, 14, 6, '#FEBC2E'), receiptGroup: 'chrome' },
      { ...circle('tlGreen', 54, 14, 6, '#28C840'), receiptGroup: 'chrome' },
      { ...rect('urlBar', 120, 18, w - 240, 28, '#2A2A2C', 8), receiptGroup: 'chrome' },
      { ...label('urlText', url, 24, 136, 12, 400, device.fontFamily, '#A1A1A6'), receiptGroup: 'chrome' },
    )
  } else {
    objs.push(
      { ...label('winTitle', 'Receipt — Secure Browser', 12, 16, 13, 500, device.fontFamily, ink), receiptGroup: 'chrome' },
      { ...rect('urlBar', 16, 34, w - 120, 22, '#1F1F1F', 4), receiptGroup: 'chrome' },
      { ...label('urlText', url, 38, 28, 11, 400, device.fontFamily, '#ABABAB'), receiptGroup: 'chrome' },
      { ...label('winMin', '—', 10, w - 90, 14, 400, device.fontFamily, ink), receiptGroup: 'chrome' },
      { ...label('winMax', '□', 8, w - 58, 14, 400, device.fontFamily, ink), receiptGroup: 'chrome' },
      { ...label('winClose', '×', 6, w - 30, 16, 400, device.fontFamily, ink), receiptGroup: 'chrome' },
    )
  }
  objs.push(
    {
      ...textObj('time', values.time || '14:26', 0, 0, 1, 400, 'time', device.fontFamily, ink),
      opacity: 0,
      selectable: false,
      evented: false,
      receiptGroup: 'chrome',
    },
    {
      ...textObj('battery', values.battery || '100', 0, 0, 1, 400, 'battery', device.fontFamily, ink),
      opacity: 0,
      selectable: false,
      evented: false,
      receiptGroup: 'chrome',
    },
  )
  return objs
}

/** Build in-screen chrome (status bar / browser chrome). */
export function buildDeviceChrome(
  deviceId: DeviceId,
  values: GenerateValues,
  ink = '#EAECEF',
  barBg = '#1C1C1E',
  appUrl?: string,
): FabricObj[] {
  const device = getDevice(deviceId)
  const objs: FabricObj[] = []

  if (device.platform === 'desktop') {
    objs.push(...desktopChrome(device, values, ink, barBg, appUrl))
  } else if (device.platform === 'ios') {
    objs.push(...iosStatus(device, values, ink, barBg))
  } else {
    objs.push(...androidStatus(device, values, ink, barBg))
  }

  if (device.homeIndicator) {
    const light = inkIsLight(ink)
    const barColor = light ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.32)'
    const barW = device.platform === 'ios' ? Math.round(device.width * 0.34) : Math.round(device.width * 0.28)
    const barH = device.platform === 'ios' ? 5 : 4
    const barTop = device.height - (device.platform === 'ios' ? 12 : 10)
    objs.push({
      ...rect(
        'homeBar',
        device.width / 2 - barW / 2,
        barTop,
        barW,
        barH,
        barColor,
        barH / 2,
      ),
      receiptGroup: 'chrome',
    })
  }

  objs.push({
    ...textObj(
      'phoneType',
      values.phoneType || device.name,
      0,
      0,
      1,
      400,
      'phoneType',
      device.fontFamily,
      ink,
    ),
    opacity: 0,
    selectable: false,
    evented: false,
    receiptGroup: 'chrome',
  })

  return objs
}
