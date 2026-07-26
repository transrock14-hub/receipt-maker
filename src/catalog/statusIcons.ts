/**
 * Status-bar icons — Rect/Circle only (no Path/Polyline).
 * Fabric 6+ defaults origin to center; helpers force left/top.
 */
import { circle, rect, strokedRect, type FabricObj } from './fabricHelpers'

export type BatteryStyle = 'ios' | 'oneui' | 'material'

export function batterySize(style: BatteryStyle): { width: number; height: number } {
  const bodyW = style === 'ios' ? 26.5 : style === 'material' ? 22.5 : 23.5
  const bodyH = style === 'ios' ? 12 : 11
  const tipW = style === 'ios' ? 1.6 : 1.5
  const tipGap = 0.55
  const chargeExtra = 0 // bolt drawn inside / beside — width reserved by caller when needed
  return { width: bodyW + tipGap + tipW + chargeExtra, height: bodyH }
}

export function signalSize(opts?: { barW?: number; gap?: number; maxH?: number }) {
  const barW = opts?.barW ?? 3
  const gap = opts?.gap ?? 1.75
  const maxH = opts?.maxH ?? 10.5
  return { width: 4 * barW + 3 * gap, height: maxH }
}

export function wifiSize() {
  return { width: 15.5, height: 11.2 }
}

export function cellularLabelWidth(label: string, size = 10): number {
  const t = label.trim()
  if (!t) return 0
  // Approximate monospace-ish width for status glyphs
  return Math.max(10, t.length * size * 0.62 + 2)
}

/** Cellular — 4 ascending bars. Strength 1–4 (default 4). */
export function drawSignal(
  id: string,
  left: number,
  top: number,
  ink: string,
  opts?: { barW?: number; gap?: number; maxH?: number; bars?: number },
): { obj: FabricObj; width: number; height: number; objs: FabricObj[] } {
  const barW = opts?.barW ?? 3
  const gap = opts?.gap ?? 1.75
  const maxH = opts?.maxH ?? 10.5
  const active = Math.max(1, Math.min(4, opts?.bars ?? 4))
  const heights = [0.3, 0.52, 0.74, 1].map((t) => Math.max(2.6, maxH * t))
  const width = heights.length * barW + (heights.length - 1) * gap
  const objs = heights.map((h, i) =>
    rect(
      `${id}${i}`,
      left + i * (barW + gap),
      top + (maxH - h),
      barW,
      h,
      ink,
      barW * 0.35,
      {
        opacity: i < active ? 1 : 0.22,
        receiptGroup: 'chrome',
      },
    ),
  )
  return { obj: objs[0], objs, width, height: maxH }
}

/**
 * Wi‑Fi — three tapered tiers + nub. `strength` 0–3 (0 hides fan, keeps empty look).
 */
export function drawWifi(
  id: string,
  left: number,
  top: number,
  ink: string,
  _mask = '#181A20',
  strength = 3,
): { obj: FabricObj; width: number; height: number; objs: FabricObj[] } {
  const { width, height } = wifiSize()
  const level = Math.max(0, Math.min(3, Math.round(strength)))
  const tiers: { x: number; y: number; w: number; h: number }[] = [
    { x: 0.15, y: 0.1, w: 15.2, h: 2.2 },
    { x: 2.15, y: 3.05, w: 11.2, h: 2.1 },
    { x: 4.2, y: 5.9, w: 7.1, h: 2.0 },
  ]
  // Strength maps to how many outer arcs are solid (3 = full)
  const objs: FabricObj[] = tiers.map((t, i) => {
    const tierIndexFromOutside = i // 0 outer … 2 inner
    const lit = level >= 3 - tierIndexFromOutside
    return rect(`${id}t${i}`, left + t.x, top + t.y, t.w, t.h, ink, t.h / 2, {
      receiptGroup: 'chrome',
      opacity: level === 0 ? 0.18 : lit ? 1 : 0.2,
    })
  })
  objs.push(
    circle(`${id}dot`, left + width / 2 - 1.5, top + height - 2.85, 1.5, ink, {
      receiptGroup: 'chrome',
      opacity: level === 0 ? 0.18 : 1,
    }),
  )
  return { obj: objs[0], objs, width, height }
}

/** Lightning bolt for charging — Path-free stacked wedges. */
function drawChargeBolt(
  id: string,
  cx: number,
  top: number,
  ink: string,
  h = 9,
): FabricObj[] {
  const w = 4.2
  const left = cx - w / 2
  return [
    rect(`${id}a`, left + 1.6, top, 2.2, h * 0.42, ink, 0.4, { receiptGroup: 'chrome' }),
    rect(`${id}b`, left, top + h * 0.32, w, 2.1, ink, 0.4, { receiptGroup: 'chrome' }),
    rect(`${id}c`, left + 0.4, top + h * 0.48, 2.2, h * 0.52, ink, 0.4, { receiptGroup: 'chrome' }),
  ]
}

/**
 * Battery capsule — hollow body, tip, level fill, optional charging bolt.
 */
export function drawBattery(
  id: string,
  left: number,
  top: number,
  pct: number,
  ink: string,
  style: BatteryStyle = 'oneui',
  opts?: { charging?: boolean },
): { obj: FabricObj; width: number; height: number; objs: FabricObj[] } {
  const level = Math.max(0, Math.min(100, pct))
  const charging = Boolean(opts?.charging)
  const bodyW = style === 'ios' ? 26.5 : style === 'material' ? 22.5 : 23.5
  const bodyH = style === 'ios' ? 12 : 11
  const tipW = style === 'ios' ? 1.6 : 1.5
  const tipGap = 0.55
  const { height } = batterySize(style)
  const r = bodyH * (style === 'ios' ? 0.34 : 0.32)
  const stroke = style === 'ios' ? 1.35 : 1.2
  const critical = level <= 20
  const warn = level <= 30 && level > 20

  let fillColor = ink
  if (charging) fillColor = style === 'ios' ? '#34C759' : '#4CAF50'
  else if (critical) fillColor = style === 'ios' ? '#FF3B30' : '#F44336'
  else if (warn && style !== 'ios') fillColor = '#FF9800'

  const tipH = bodyH * 0.4
  const tipTop = top + (bodyH - tipH) / 2

  const inset = stroke + (style === 'ios' ? 1.15 : 1.05)
  const innerH = bodyH - inset * 2
  const innerR = Math.max(0.85, innerH / 2.4)
  const maxFill = bodyW - inset * 2
  const fillRatio = level >= 98 ? 1 : Math.max(0.08, level / 100)
  const fillW = Math.max(innerH * 0.45, maxFill * fillRatio)

  const objs: FabricObj[] = [
    { ...strokedRect(`${id}Out`, left, top, bodyW, bodyH, ink, r, stroke), receiptGroup: 'chrome' },
    {
      ...rect(
        `${id}Fill`,
        left + inset,
        top + inset,
        Math.min(fillW, maxFill),
        innerH,
        fillColor,
        innerR,
      ),
      receiptGroup: 'chrome',
    },
    {
      ...rect(`${id}Tip`, left + bodyW + tipGap, tipTop, tipW, tipH, ink, tipW / 2),
      receiptGroup: 'chrome',
    },
  ]

  if (charging) {
    // Bolt centered on battery body (inverse-looking on green fill)
    const boltInk = level > 35 || style === 'ios' ? '#FFFFFF' : ink
    objs.push(...drawChargeBolt(`${id}Bolt`, left + bodyW / 2, top + 1.4, boltInk, bodyH - 2.6))
  }

  const width = bodyW + tipGap + tipW
  return { obj: objs[0], objs, width, height }
}
