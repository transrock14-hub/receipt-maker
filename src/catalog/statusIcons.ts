/**
 * Status-bar icons — match iOS SF Symbols / Android Material conventions.
 * Prefer Path for curves (Wi‑Fi arcs, lightning); Rect/Circle for bars & battery.
 */
import { circle, rect, strokedRect, type FabricObj } from './fabricHelpers'

export type BatteryStyle = 'ios' | 'oneui' | 'material'

const TOP_LEFT = { originX: 'left', originY: 'top' } as const

function pathObj(
  id: string,
  left: number,
  top: number,
  path: string,
  fill: string,
  extra?: FabricObj,
): FabricObj {
  return {
    type: 'Path',
    version: '7.0.0',
    left,
    top,
    path,
    fill,
    strokeWidth: 0,
    ...TOP_LEFT,
    selectable: false,
    evented: false,
    receiptId: id,
    receiptGroup: 'chrome',
    ...extra,
  }
}

export function batterySize(style: BatteryStyle): { width: number; height: number } {
  // Proportions close to SF Symbol battery.100 / Material battery
  const bodyW = style === 'ios' ? 27.5 : style === 'material' ? 24 : 25
  const bodyH = style === 'ios' ? 12.5 : 11.5
  const tipW = style === 'ios' ? 1.75 : 1.6
  const tipGap = 0.65
  return { width: bodyW + tipGap + tipW, height: bodyH }
}

export function signalSize(opts?: { barW?: number; gap?: number; maxH?: number }) {
  const barW = opts?.barW ?? 3.1
  const gap = opts?.gap ?? 1.7
  const maxH = opts?.maxH ?? 11
  return { width: 4 * barW + 3 * gap, height: maxH }
}

export function wifiSize(_style: BatteryStyle | 'ios' | 'android' = 'ios') {
  return { width: 16.5, height: 12 }
}

export function cellularLabelWidth(label: string, size = 11): number {
  const t = label.trim()
  if (!t) return 0
  return Math.max(11, t.length * size * 0.58 + 1)
}

/** Cellular signal — 4 ascending rounded capsules (SF chart.bar / Material). */
export function drawSignal(
  id: string,
  left: number,
  top: number,
  ink: string,
  opts?: { barW?: number; gap?: number; maxH?: number; bars?: number },
): { obj: FabricObj; width: number; height: number; objs: FabricObj[] } {
  const barW = opts?.barW ?? 3.1
  const gap = opts?.gap ?? 1.7
  const maxH = opts?.maxH ?? 11
  const active = Math.max(1, Math.min(4, opts?.bars ?? 4))
  // iOS-like steps: ~35% / 55% / 75% / 100%
  const heights = [0.36, 0.55, 0.76, 1].map((t) => Math.max(3.2, maxH * t))
  const width = heights.length * barW + (heights.length - 1) * gap
  const r = Math.min(barW / 2, 1.35)
  const objs = heights.map((h, i) =>
    rect(`${id}${i}`, left + i * (barW + gap), top + (maxH - h), barW, h, ink, r, {
      opacity: i < active ? 1 : 0.22,
      receiptGroup: 'chrome',
    }),
  )
  return { obj: objs[0], objs, width, height: maxH }
}

/**
 * Wi‑Fi — three concentric arc bands + center nub (SF wifi / Material).
 * Paths approximate the classic fan, not flat horizontal slabs.
 */
export function drawWifi(
  id: string,
  left: number,
  top: number,
  ink: string,
  _mask = '#181A20',
  strength = 3,
): { obj: FabricObj; width: number; height: number; objs: FabricObj[] } {
  const { width, height } = wifiSize('ios')
  const level = Math.max(0, Math.min(3, Math.round(strength)))
  // Arc bands as filled crescent-like paths (outer → inner)
  const arcs: { d: string; litAt: number }[] = [
    {
      litAt: 3,
      d: 'M 1.2 7.2 C 4.2 2.4 12.3 2.4 15.3 7.2 L 13.6 8.6 C 11.2 5.0 5.3 5.0 2.9 8.6 Z',
    },
    {
      litAt: 2,
      d: 'M 3.4 8.4 C 5.6 5.2 10.9 5.2 13.1 8.4 L 11.5 9.7 C 9.9 7.5 6.6 7.5 5.0 9.7 Z',
    },
    {
      litAt: 1,
      d: 'M 5.5 9.5 C 6.9 7.6 9.6 7.6 11.0 9.5 L 9.6 10.7 C 8.8 9.6 7.7 9.6 6.9 10.7 Z',
    },
  ]
  const objs: FabricObj[] = arcs.map((a, i) =>
    pathObj(`${id}a${i}`, left, top, a.d, ink, {
      opacity: level === 0 ? 0.16 : level >= a.litAt ? 1 : 0.2,
    }),
  )
  objs.push(
    circle(`${id}dot`, left + width / 2 - 1.55, top + height - 3.1, 1.55, ink, {
      receiptGroup: 'chrome',
      opacity: level === 0 ? 0.16 : 1,
    }),
  )
  return { obj: objs[0], objs, width, height }
}

/** Clean SF-style lightning bolt path (viewBox ~0 0 10 14). */
function chargeBoltPath(scaleX: number, scaleY: number): string {
  // Classic bolt polygon
  const pts = [
    [6.2, 0],
    [2.1, 6.4],
    [4.85, 6.4],
    [1.2, 14],
    [9.0, 5.35],
    [5.9, 5.35],
  ]
  const cmds = pts.map(([x, y], i) => {
    const X = (x * scaleX).toFixed(2)
    const Y = (y * scaleY).toFixed(2)
    return `${i === 0 ? 'M' : 'L'} ${X} ${Y}`
  })
  return `${cmds.join(' ')} Z`
}

/**
 * Battery capsule — hollow body, tip, level fill, optional charging bolt.
 * Matches iOS green charge + white bolt; Android Material green + white bolt.
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
  const bodyW = style === 'ios' ? 27.5 : style === 'material' ? 24 : 25
  const bodyH = style === 'ios' ? 12.5 : 11.5
  const tipW = style === 'ios' ? 1.75 : 1.6
  const tipGap = 0.65
  const { height } = batterySize(style)
  const r = bodyH * (style === 'ios' ? 0.36 : 0.34)
  const stroke = style === 'ios' ? 1.4 : 1.25
  const critical = level <= 20
  const warn = level <= 30 && level > 20

  // Outline: slightly softer than solid ink (reads like real status chrome)
  const outline = ink

  let fillColor = ink
  if (charging) fillColor = style === 'ios' ? '#34C759' : '#1E8E3E'
  else if (critical) fillColor = style === 'ios' ? '#FF3B30' : '#D93025'
  else if (warn && style !== 'ios') fillColor = '#F9AB00'

  const tipH = bodyH * (style === 'ios' ? 0.42 : 0.4)
  const tipTop = top + (bodyH - tipH) / 2

  const inset = stroke + (style === 'ios' ? 1.2 : 1.1)
  const innerH = bodyH - inset * 2
  const innerR = Math.max(0.9, innerH / 2.35)
  const maxFill = bodyW - inset * 2
  // Real OS: fill tracks percentage; near-full snaps to full
  const fillRatio = level >= 97 ? 1 : Math.max(0.07, level / 100)
  let fillW = Math.max(innerH * 0.4, maxFill * fillRatio)
  if (charging) fillW = Math.max(fillW, maxFill * 0.85)

  const objs: FabricObj[] = [
    {
      ...strokedRect(`${id}Out`, left, top, bodyW, bodyH, outline, r, stroke),
      receiptGroup: 'chrome',
    },
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
      ...rect(`${id}Tip`, left + bodyW + tipGap, tipTop, tipW, tipH, outline, tipW / 2),
      receiptGroup: 'chrome',
    },
  ]

  if (charging) {
    // White bolt centered in the green body (SF battery.100.bolt)
    const boltH = bodyH - 2.4
    const scaleY = boltH / 14
    const scaleX = (bodyW * 0.28) / 10
    const boltW = 10 * scaleX
    const boltLeft = left + (bodyW - boltW) / 2
    const boltTop = top + (bodyH - boltH) / 2
    objs.push(
      pathObj(`${id}Bolt`, boltLeft, boltTop, chargeBoltPath(scaleX, scaleY), '#FFFFFF'),
    )
  }

  const width = bodyW + tipGap + tipW
  return { obj: objs[0], objs, width, height }
}

/** Battery % label metrics for layout. */
export function batteryPctWidth(pct: number | string, fontSize = 12): number {
  const s = String(pct).replace('%', '')
  return Math.max(10, s.length * fontSize * 0.62 + 2)
}
