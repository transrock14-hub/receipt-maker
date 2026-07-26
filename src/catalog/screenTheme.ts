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
  if (institutionId === 'google-pay' || institutionId === 'metamask-activity') return 'dark'
  if (institutionId === 'binance-withdrawal') return 'dark'
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
