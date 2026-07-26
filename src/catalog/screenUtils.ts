import type { DeviceProfile, FieldKey, GenerateValues, TemplateField } from '../types/receipt'
import { fieldKeyToRole } from '../analysis/fields'
import { label, rect, textObj, type FabricObj } from './fabricHelpers'
import type { ScreenTheme, ThemeColors } from './screenTheme'

export function field(
  id: string,
  fieldKey: FieldKey,
  labelText: string,
  defaultValue: string,
): TemplateField {
  return {
    id,
    fieldKey,
    role: fieldKeyToRole(fieldKey),
    label: labelText,
    defaultValue,
  }
}

export interface ScreenBuildContext {
  device: DeviceProfile
  top: number
  width: number
  height: number
  values: GenerateValues
  /** Light / dark receipt appearance. */
  theme: ScreenTheme
  /** Resolved palette for the active theme. */
  colors: ThemeColors
}

export interface ScreenContent {
  objects: FabricObj[]
  fields: TemplateField[]
  background: string
  palette: string[]
}

export function tag(o: FabricObj, group: string): FabricObj {
  return { ...o, receiptGroup: group }
}

export function tagAll(objs: FabricObj[], group: string): FabricObj[] {
  return objs.map((o) => tag(o, group))
}

/** True for short phones (iPhone SE class) — tighten vertical rhythm. */
export function isCompactHeight(ctx: ScreenBuildContext): boolean {
  return ctx.height < 720
}

/** Back chevron only (no centered title) — PayPal-style headers. */
export function navBackOnly(
  ctx: ScreenBuildContext,
  colors: { ink: string; font?: string },
): FabricObj[] {
  const y = ctx.top + 12
  const font = colors.font || ctx.device.fontFamily
  const ios = ctx.device.platform === 'ios'
  const chevron = ios ? '‹' : '←'
  return [label('back', chevron, y - (ios ? 2 : 0), 12, ios ? 30 : 22, 300, font, colors.ink)]
}

/** Ellipsize long crypto addresses / IDs for narrow phone widths. */
export function ellipsizeMiddle(text: string, maxChars = 18): string {
  const t = text.trim()
  if (t.length <= maxChars) return t
  if (t.includes('…') || t.includes('...')) return t
  const keep = Math.max(4, Math.floor((maxChars - 1) / 2))
  return `${t.slice(0, keep)}…${t.slice(-keep)}`
}

/** Standard label/value row used by many wallet UIs. */
export function detailRow(
  ctx: ScreenBuildContext,
  y: number,
  labelId: string,
  labelText: string,
  valueId: string,
  valueText: string,
  fieldKey: FieldKey | null,
  colors: {
    muted: string
    ink: string
    accent?: string
    font?: string
    labelSize?: number
    valueSize?: number
    side?: number
    valuePadRight?: number
    ellipsize?: boolean
  },
  mono = false,
): FabricObj[] {
  const { device, width } = ctx
  const ui = colors.font || device.fontFamily
  const font = mono ? device.monoFamily : ui
  const fill = colors.accent || colors.ink
  const labelSize = colors.labelSize ?? 13
  const valueSize = colors.valueSize ?? 13
  const side = colors.side ?? 16
  const valuePadRight = colors.valuePadRight ?? 0
  const valueRight = width - side - valuePadRight
  // Cap characters so values don't collide with labels on 360-wide Androids
  const maxChars = Math.max(12, Math.floor((width - side * 2 - 88) / (valueSize * 0.55)))
  const display =
    colors.ellipsize !== false && (mono || /0x[a-fA-F0-9]{8,}/.test(valueText) || valueText.length > maxChars)
      ? ellipsizeMiddle(valueText, maxChars)
      : valueText
  return [
    label(labelId, labelText, y, side, labelSize, 400, ui, colors.muted),
    textObj(valueId, display, y, valueRight, valueSize, 400, fieldKey, font, fill, {
      originX: 'right',
    }),
  ]
}

/** Binance-style row: muted label left, value right. */
export function binanceDetailRow(
  ctx: ScreenBuildContext,
  y: number,
  labelId: string,
  labelText: string,
  valueId: string,
  valueText: string,
  fieldKey: FieldKey | null,
  colors: { muted: string; ink: string; accent?: string; font?: string },
  mono = false,
): FabricObj[] {
  return detailRow(
    ctx,
    y,
    labelId,
    labelText,
    valueId,
    valueText,
    fieldKey,
    { ...colors, labelSize: 14, valueSize: 14 },
    mono,
  )
}

export function hairline(id: string, y: number, width: number, color: string, inset = 16): FabricObj {
  return rect(id, inset, y, width - inset * 2, 1, color)
}

/**
 * Build alternating detail rows + hairlines with consistent rhythm.
 * `rowH` is distance from one label baseline to the next (includes hairline gap).
 */
export function detailList(
  ctx: ScreenBuildContext,
  startY: number,
  rows: Array<{
    labelId: string
    label: string
    valueId: string
    value: string
    fieldKey: FieldKey | null
    mono?: boolean
    accent?: string
    valuePadRight?: number
  }>,
  colors: {
    muted: string
    ink: string
    font?: string
    line: string
    labelSize?: number
    valueSize?: number
    side?: number
  },
  rowH = 44,
): FabricObj[] {
  const side = colors.side ?? 16
  const out: FabricObj[] = []
  rows.forEach((r, i) => {
    const y = startY + i * rowH
    out.push(
      ...detailRow(
        ctx,
        y,
        r.labelId,
        r.label,
        r.valueId,
        r.value,
        r.fieldKey,
        {
          muted: colors.muted,
          ink: colors.ink,
          font: colors.font,
          accent: r.accent,
          labelSize: colors.labelSize,
          valueSize: colors.valueSize,
          side,
          valuePadRight: r.valuePadRight,
        },
        r.mono,
      ),
    )
    if (i < rows.length - 1) {
      out.push(hairline(`hl${r.labelId}`, y + rowH - 12, ctx.width, colors.line, side))
    }
  })
  return out
}

export function navBackTitle(
  ctx: ScreenBuildContext,
  title: string,
  colors: { ink: string; font?: string },
  titleField: FieldKey | null = 'title',
): FabricObj[] {
  const y = ctx.top + 12
  const font = colors.font || ctx.device.fontFamily
  const ios = ctx.device.platform === 'ios'
  const chevron = ios ? '‹' : '←'
  return [
    label('back', chevron, y - (ios ? 2 : 0), 12, ios ? 30 : 22, 300, font, colors.ink),
    textObj(
      'title',
      title,
      y + 4,
      ctx.width / 2,
      17,
      600,
      titleField,
      font,
      colors.ink,
      { originX: 'center' },
    ),
  ]
}

/** Solid brand top bar with centered (or left) title. */
export function brandHeader(
  ctx: ScreenBuildContext,
  title: string,
  bg: string,
  ink: string,
  opts?: { height?: number; brandLeft?: string; font?: string },
): FabricObj[] {
  const h = opts?.height ?? 48
  const font = opts?.font || ctx.device.fontFamily
  const objs: FabricObj[] = [rect('brandHdr', 0, ctx.top, ctx.width, h, bg)]
  if (opts?.brandLeft) {
    objs.push(
      textObj('brandLeft', opts.brandLeft, ctx.top + h / 2 - 8, 16, 14, 700, null, font, ink),
    )
    objs.push(
      textObj('title', title, ctx.top + h / 2 - 8, ctx.width / 2, 15, 600, 'title', font, ink, {
        originX: 'center',
      }),
    )
  } else {
    objs.push(
      textObj('title', title, ctx.top + h / 2 - 9, ctx.width / 2, 16, 600, 'title', font, ink, {
        originX: 'center',
      }),
    )
  }
  return objs
}

/** Green success check — disc + reliable check glyph. */
export function successCheck(
  prefix: string,
  cx: number,
  top: number,
  radius: number,
  fill: string,
  mark = '#FFFFFF',
): FabricObj[] {
  const left = cx - radius
  return [
    rect(`${prefix}Bg`, left, top, radius * 2, radius * 2, fill, radius),
    {
      type: 'IText',
      version: '7.0.0',
      left: cx,
      top: top + radius * 0.28,
      text: '✓',
      fontSize: radius * 1.15,
      fontFamily: 'Inter, -apple-system, "Segoe UI Symbol", sans-serif',
      fontWeight: 700,
      fill: mark,
      originX: 'center',
      originY: 'top',
      selectable: false,
      evented: false,
      receiptId: `${prefix}Mark`,
      receiptGroup: 'header',
    },
  ]
}
