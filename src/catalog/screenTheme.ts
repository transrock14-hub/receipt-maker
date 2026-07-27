/**
 * Screen light/dark theme for wallet & bank receipt previews.
 * Each institution has a native default; the toggle remaps palette colors.
 */
import type { ReceiptStyleKit } from '../study/styleKits'
import { styleKitForInstitution } from '../study/styleKits'

export type ScreenTheme = 'light' | 'dark'

export type ThemeColors = {
  background: string
  ink: string
  muted: string
  accent: string
  success: string
  line: string
  chromeInk: string
  palette: string[]
  fontFamily?: string
}

/** Native look for each institution (matches shipped style kits). */
export function defaultThemeForInstitution(institutionId: string): ScreenTheme {
  const kit = styleKitForInstitution(institutionId)
  if (kit?.layout?.darkChrome) return 'dark'
  // Cash App green is neither classic light nor dark — treat as light chrome ink target
  if (
    institutionId === 'gpay-success' ||
    institutionId === 'metamask-activity' ||
    institutionId === 'metamask-received' ||
    institutionId === 'binance-withdrawal' ||
    institutionId === 'binance-deposit' ||
    institutionId === 'revolut-payment' ||
    institutionId === 'stc-pay'
  ) {
    return 'dark'
  }
  return 'light'
}

const LIGHT_FALLBACK: ThemeColors = {
  background: '#FFFFFF',
  ink: '#1E2329',
  muted: '#707A8A',
  accent: '#F0B90B',
  success: '#0ECB81',
  line: '#EAECEF',
  chromeInk: '#1E2329',
  palette: ['#FFFFFF', '#1E2329', '#F0B90B', '#0ECB81', '#707A8A'],
}

const DARK_FALLBACK: ThemeColors = {
  background: '#181A20',
  ink: '#EAECEF',
  muted: '#848E9C',
  accent: '#F0B90B',
  success: '#0ECB81',
  line: '#2B3139',
  chromeInk: '#EAECEF',
  palette: ['#181A20', '#EAECEF', '#F0B90B', '#0ECB81', '#848E9C'],
}

/** Per-institution light/dark palettes (real-app inspired). */
const THEME_OVERRIDES: Record<string, Partial<Record<ScreenTheme, Partial<ThemeColors>>>> = {
  'binance-withdrawal': {
    light: {
      background: '#FFFFFF',
      ink: '#1E2329',
      muted: '#707A8A',
      accent: '#C99400',
      success: '#0ECB81',
      line: '#EAECEF',
      chromeInk: '#1E2329',
      palette: ['#FFFFFF', '#1E2329', '#C99400', '#0ECB81', '#26A17B', '#707A8A'],
    },
    dark: {
      background: '#181A20',
      ink: '#EAECEF',
      muted: '#848E9C',
      accent: '#F0B90B',
      success: '#0ECB81',
      line: '#2B3139',
      chromeInk: '#EAECEF',
      palette: ['#181A20', '#EAECEF', '#F0B90B', '#0ECB81', '#26A17B', '#848E9C'],
    },
  },
  'binance-deposit': {
    light: {
      background: '#FFFFFF',
      ink: '#1E2329',
      muted: '#707A8A',
      accent: '#C99400',
      success: '#0ECB81',
      line: '#EAECEF',
      chromeInk: '#1E2329',
      palette: ['#FFFFFF', '#1E2329', '#C99400', '#0ECB81', '#26A17B', '#707A8A'],
    },
    dark: {
      background: '#181A20',
      ink: '#EAECEF',
      muted: '#848E9C',
      accent: '#F0B90B',
      success: '#0ECB81',
      line: '#2B3139',
      chromeInk: '#EAECEF',
      palette: ['#181A20', '#EAECEF', '#F0B90B', '#0ECB81', '#26A17B', '#848E9C'],
    },
  },
  'coinbase-sent': {
    light: {
      background: '#FFFFFF',
      ink: '#0A0B0D',
      muted: '#5B616E',
      accent: '#0052FF',
      success: '#0052FF',
      line: '#ECEFF3',
      chromeInk: '#0A0B0D',
    },
    dark: {
      background: '#0A0B0D',
      ink: '#FFFFFF',
      muted: '#8B919E',
      accent: '#578BF2',
      success: '#578BF2',
      line: '#2A2E35',
      chromeInk: '#FFFFFF',
      palette: ['#0A0B0D', '#FFFFFF', '#578BF2', '#8B919E'],
    },
  },
  'coinbase-received': {
    light: {
      background: '#FFFFFF',
      ink: '#0A0B0D',
      muted: '#5B616E',
      accent: '#0052FF',
      success: '#0A7A3E',
      line: '#ECEFF3',
      chromeInk: '#0A0B0D',
    },
    dark: {
      background: '#0A0B0D',
      ink: '#FFFFFF',
      muted: '#8B919E',
      accent: '#578BF2',
      success: '#3DDC97',
      line: '#2A2E35',
      chromeInk: '#FFFFFF',
      palette: ['#0A0B0D', '#FFFFFF', '#578BF2', '#3DDC97', '#8B919E'],
    },
  },
  'trust-send': {
    light: {
      background: '#FFFFFF',
      ink: '#17171A',
      muted: '#757B86',
      accent: '#0481E2',
      success: '#2BB673',
      line: '#EEF0F3',
      chromeInk: '#17171A',
    },
    dark: {
      background: '#1B1B1F',
      ink: '#F5F5F7',
      muted: '#9A9AA3',
      accent: '#3B9EFF',
      success: '#2BB673',
      line: '#2E2E34',
      chromeInk: '#F5F5F7',
      palette: ['#1B1B1F', '#F5F5F7', '#3B9EFF', '#2BB673'],
    },
  },
  'trust-receive': {
    light: {
      background: '#FFFFFF',
      ink: '#17171A',
      muted: '#757B86',
      accent: '#0481E2',
      success: '#2BB673',
      line: '#EEF0F3',
      chromeInk: '#17171A',
    },
    dark: {
      background: '#1B1B1F',
      ink: '#F5F5F7',
      muted: '#9A9AA3',
      accent: '#3B9EFF',
      success: '#2BB673',
      line: '#2E2E34',
      chromeInk: '#F5F5F7',
      palette: ['#1B1B1F', '#F5F5F7', '#3B9EFF', '#2BB673'],
    },
  },
  'metamask-activity': {
    light: {
      background: '#F2F4F6',
      ink: '#24272A',
      muted: '#6A737D',
      accent: '#F6851B',
      success: '#28A745',
      line: '#D6D9DC',
      chromeInk: '#24272A',
      palette: ['#F2F4F6', '#24272A', '#F6851B', '#28A745'],
    },
    dark: {
      background: '#24272A',
      ink: '#FCFCFC',
      muted: '#BBC0C5',
      accent: '#F6851B',
      success: '#28A745',
      line: '#3B4046',
      chromeInk: '#FCFCFC',
    },
  },
  'metamask-received': {
    light: {
      background: '#F2F4F6',
      ink: '#24272A',
      muted: '#6A737D',
      accent: '#F6851B',
      success: '#28A745',
      line: '#D6D9DC',
      chromeInk: '#24272A',
      palette: ['#F2F4F6', '#24272A', '#F6851B', '#28A745'],
    },
    dark: {
      background: '#24272A',
      ink: '#FCFCFC',
      muted: '#BBC0C5',
      accent: '#F6851B',
      success: '#28A745',
      line: '#3B4046',
      chromeInk: '#FCFCFC',
    },
  },
  'paypal-sent': {
    light: {
      background: '#FFFFFF',
      ink: '#001C64',
      muted: '#6C7378',
      accent: '#0070BA',
      success: '#0D7A3E',
      line: '#E6E8EB',
      chromeInk: '#001C64',
    },
    dark: {
      background: '#001435',
      ink: '#F5F7FA',
      muted: '#A8B0BC',
      accent: '#0070BA',
      success: '#3DDC84',
      line: '#1A2A4A',
      chromeInk: '#F5F7FA',
    },
  },
  'cashapp-payment': {
    light: {
      background: '#00D632',
      ink: '#FFFFFF',
      muted: 'rgba(255,255,255,0.82)',
      accent: '#000000',
      success: '#FFFFFF',
      line: 'transparent',
      chromeInk: '#FFFFFF',
    },
    dark: {
      background: '#00A828',
      ink: '#FFFFFF',
      muted: 'rgba(255,255,255,0.82)',
      accent: '#000000',
      success: '#FFFFFF',
      line: 'transparent',
      chromeInk: '#FFFFFF',
    },
  },
  'chase-transfer': {
    light: {
      background: '#FFFFFF',
      ink: '#0C2340',
      muted: '#6B7280',
      accent: '#117ACA',
      success: '#0D7A3E',
      line: '#E5E7EB',
      chromeInk: '#0C2340',
    },
    dark: {
      background: '#0C2340',
      ink: '#F5F7FA',
      muted: '#A8B4C4',
      accent: '#4BA3E3',
      success: '#3DDC84',
      line: '#1A3A5C',
      chromeInk: '#F5F7FA',
    },
  },
  'wise-sent': {
    light: {
      background: '#FFFFFF',
      ink: '#0E0F11',
      muted: '#5D636F',
      accent: '#9FE870',
      success: '#163300',
      line: '#E7E9EE',
      chromeInk: '#0E0F11',
    },
    dark: {
      background: '#163300',
      ink: '#F5F7FA',
      muted: '#A8B4A0',
      accent: '#9FE870',
      success: '#9FE870',
      line: '#2A4A18',
      chromeInk: '#F5F7FA',
    },
  },
  'venmo-payment': {
    light: {
      background: '#FFFFFF',
      ink: '#2F3033',
      muted: '#8B8C8F',
      accent: '#008CFF',
      success: '#008CFF',
      line: '#E8E8EA',
      chromeInk: '#2F3033',
      palette: ['#FFFFFF', '#2F3033', '#008CFF', '#8B8C8F'],
    },
    dark: {
      background: '#1C1D1F',
      ink: '#F5F5F6',
      muted: '#A0A1A4',
      accent: '#3DA4FF',
      success: '#3DA4FF',
      line: '#2E2F32',
      chromeInk: '#F5F5F6',
      palette: ['#1C1D1F', '#F5F5F6', '#3DA4FF', '#A0A1A4'],
    },
  },
  'gpay-success': {
    light: {
      background: '#FFFFFF',
      ink: '#202124',
      muted: '#5F6368',
      accent: '#1A73E8',
      success: '#1E8E3E',
      line: '#E8EAED',
      chromeInk: '#202124',
    },
    dark: {
      background: '#202124',
      ink: '#E8EAED',
      muted: '#9AA0A6',
      accent: '#8AB4F8',
      success: '#81C995',
      line: '#3C4043',
      chromeInk: '#E8EAED',
      palette: ['#202124', '#E8EAED', '#8AB4F8', '#81C995'],
    },
  },
  'boa-transfer': {
    light: {
      background: '#FFFFFF',
      ink: '#012169',
      muted: '#6B7280',
      accent: '#E31837',
      success: '#0D7A3E',
      line: '#E5E7EB',
      chromeInk: '#012169',
    },
    dark: {
      background: '#01153F',
      ink: '#F5F7FA',
      muted: '#A8B4C4',
      accent: '#FF5A6E',
      success: '#3DDC84',
      line: '#1A2F5C',
      chromeInk: '#F5F7FA',
    },
  },
  'revolut-payment': {
    light: {
      background: '#FFFFFF',
      ink: '#191C1F',
      muted: '#8E8E93',
      accent: '#0666EB',
      success: '#24C38E',
      line: '#EEF0F3',
      chromeInk: '#191C1F',
    },
    dark: {
      background: '#000000',
      ink: '#FFFFFF',
      muted: '#8E8E93',
      accent: '#0666EB',
      success: '#24C38E',
      line: '#1C1C1E',
      chromeInk: '#FFFFFF',
      palette: ['#000000', '#0A7A7E', '#FFFFFF', '#0666EB', '#24C38E', '#7DD3E8'],
      fontFamily: '-apple-system, "SF Pro Text", "Helvetica Neue", Inter, sans-serif',
    },
  },
  'mpesa-confirm': {
    light: {
      background: '#FFFFFF',
      ink: '#1A1A1A',
      muted: '#6B7280',
      accent: '#4CAF50',
      success: '#4CAF50',
      line: '#E5E7EB',
      chromeInk: '#1A1A1A',
    },
    dark: {
      background: '#0F1A12',
      ink: '#F2F7F3',
      muted: '#9BB0A0',
      accent: '#66BB6A',
      success: '#66BB6A',
      line: '#243328',
      chromeInk: '#F2F7F3',
    },
  },
  'mtn-momo': {
    light: {
      background: '#FFCC00',
      ink: '#000000',
      muted: 'rgba(0,0,0,0.65)',
      accent: '#000000',
      success: '#006600',
      line: 'rgba(0,0,0,0.12)',
      chromeInk: '#000000',
    },
    dark: {
      background: '#1A1400',
      ink: '#FFCC00',
      muted: '#C4B570',
      accent: '#FFCC00',
      success: '#66BB6A',
      line: '#3A3000',
      chromeInk: '#FFCC00',
    },
  },
  'stc-pay': {
    light: {
      background: '#FFFFFF',
      ink: '#4F008C',
      muted: '#6B7280',
      accent: '#4F008C',
      success: '#00A651',
      line: '#EDE7F6',
      chromeInk: '#4F008C',
    },
    dark: {
      background: '#2A004D',
      ink: '#FFFFFF',
      muted: '#C4A8E0',
      accent: '#C77DFF',
      success: '#3DDC84',
      line: '#3D1A66',
      chromeInk: '#FFFFFF',
    },
  },
  'thermal-store': {
    light: {
      background: '#F7F4EC',
      ink: '#1C1B18',
      muted: '#6B6680',
      accent: '#1C1B18',
      success: '#1C1B18',
      line: '#D9D4C8',
      chromeInk: '#1C1B18',
      fontFamily: '"IBM Plex Mono", monospace',
    },
    dark: {
      background: '#1C1B18',
      ink: '#F7F4EC',
      muted: '#A8A395',
      accent: '#F7F4EC',
      success: '#F7F4EC',
      line: '#3A3830',
      chromeInk: '#F7F4EC',
      fontFamily: '"IBM Plex Mono", monospace',
    },
  },
}

function fromKit(kit: ReceiptStyleKit): ThemeColors {
  return {
    background: kit.background,
    ink: kit.ink,
    muted: kit.muted,
    accent: kit.accent,
    success: kit.success,
    line: kit.line,
    chromeInk: kit.chromeInk,
    palette: kit.palette,
    fontFamily: kit.fontFamily,
  }
}

/** Resolve colors for an institution + light/dark theme. */
export function resolveThemeColors(
  institutionId: string,
  theme: ScreenTheme,
): ThemeColors {
  const kit = styleKitForInstitution(institutionId)
  const base = kit
    ? fromKit(kit)
    : theme === 'dark'
      ? { ...DARK_FALLBACK }
      : { ...LIGHT_FALLBACK }
  const override = THEME_OVERRIDES[institutionId]?.[theme]
  if (override) {
    return {
      ...base,
      ...override,
      palette: override.palette || [
        override.background || base.background,
        override.ink || base.ink,
        override.accent || base.accent,
        override.success || base.success,
        override.muted || base.muted,
      ],
    }
  }

  // Generic flip when no explicit override and theme ≠ kit default
  const kitDark = Boolean(kit?.layout?.darkChrome)
  const wantDark = theme === 'dark'
  if (kit && kitDark === wantDark) return base
  if (!kit) return theme === 'dark' ? { ...DARK_FALLBACK } : { ...LIGHT_FALLBACK }

  // Soft invert for kits without a dedicated opposite theme
  if (wantDark && !kitDark) {
    return {
      background: '#12141A',
      ink: '#F2F3F5',
      muted: '#9AA0A8',
      accent: kit.accent,
      success: kit.success,
      line: '#2A2E36',
      chromeInk: '#F2F3F5',
      palette: ['#12141A', '#F2F3F5', kit.accent, kit.success, '#9AA0A8'],
      fontFamily: kit.fontFamily,
    }
  }
  if (!wantDark && kitDark) {
    return {
      background: '#FFFFFF',
      ink: '#1E2329',
      muted: '#707A8A',
      accent: kit.accent,
      success: kit.success,
      line: '#EAECEF',
      chromeInk: '#1E2329',
      palette: ['#FFFFFF', '#1E2329', kit.accent, kit.success, '#707A8A'],
      fontFamily: kit.fontFamily,
    }
  }
  return base
}
