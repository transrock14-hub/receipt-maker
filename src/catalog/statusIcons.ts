/**
 * Status-bar icons — match iOS SF Symbols / Android Material / Samsung One UI.
 * Prefer Path for curves (Wi‑Fi arcs, lightning); Rect/Circle for bars & battery.
 */
import { circle, rect, strokedRect, type FabricObj } from './fabricHelpers'

export type BatteryStyle = 'ios' | 'oneui' | 'material'

const TOP_LEFT = { originX: 'left', originY: 'top' } as const

type PathCmd = (string | number)[]

function pathObj(
  id: string,
  left: number,
  top: number,
  path: PathCmd[] | string,
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

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/**
 * Solid annular sector (filled arc band) — no stroked curves, no center seam.
 * Angles in degrees (SVG: 0° = east, CW with sweep=1).
 */
function arcBandPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  a0: number,
  a1: number,
): PathCmd[] {
  const [x0, y0] = polar(cx, cy, rOut, a0)
  const [x1, y1] = polar(cx, cy, rOut, a1)
  const [x2, y2] = polar(cx, cy, rIn, a1)
  const [x3, y3] = polar(cx, cy, rIn, a0)
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  return [
    ['M', x0, y0],
    ['A', rOut, rOut, 0, large, 1, x1, y1],
    ['L', x2, y2],
    ['A', rIn, rIn, 0, large, 0, x3, y3],
    ['Z'],
  ]
}

export function batterySize(style: BatteryStyle): { width: number; height: number } {
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

export function wifiSize(style: BatteryStyle = 'ios'): { width: number; height: number } {
  if (style === 'oneui') return { width: 17.2, height: 12.4 }
  if (style === 'material') return { width: 16.8, height: 12.2 }
  return { width: 16.2, height: 11.8 }
}

export function cellularLabelWidth(labelText: string, size = 11): number {
  const t = labelText.trim()
  if (!t) return 0
  return Math.max(11, t.length * size * 0.58 + 1)
}

/** Cellular signal — 4 ascending rounded capsules. */
export function drawSignal(
  id: string,
  left: number,
  top: number,
  ink: string,
  opts?: { barW?: number; gap?: number; maxH?: number; bars?: number; style?: BatteryStyle },
): { obj: FabricObj; width: number; height: number; objs: FabricObj[] } {
  const style = opts?.style ?? 'ios'
  const barW = opts?.barW ?? (style === 'oneui' ? 2.9 : style === 'material' ? 3 : 3.15)
  const gap = opts?.gap ?? (style === 'oneui' ? 1.45 : 1.7)
  const maxH = opts?.maxH ?? (style === 'oneui' ? 11.4 : 11)
  const active = Math.max(1, Math.min(4, opts?.bars ?? 4))
  const heights =
    style === 'oneui'
      ? [0.32, 0.52, 0.74, 1].map((t) => Math.max(3.0, maxH * t))
      : [0.36, 0.55, 0.76, 1].map((t) => Math.max(3.2, maxH * t))
  const width = heights.length * barW + (heights.length - 1) * gap
  const r = Math.min(barW / 2, style === 'oneui' ? 0.85 : 1.35)
  const objs = heights.map((h, i) =>
    rect(`${id}${i}`, left + i * (barW + gap), top + (maxH - h), barW, h, ink, r, {
      opacity: i < active ? 1 : 0.22,
      receiptGroup: 'chrome',
    }),
  )
  return { obj: objs[0], objs, width, height: maxH }
}

/**
 * Wi‑Fi fan — device-accurate solid arc bands + nub.
 * One UI: bolder, slightly flatter sweep. iOS: tighter SF-style. Material: in between.
 */
export function drawWifi(
  id: string,
  left: number,
  top: number,
  ink: string,
  _mask = '#181A20',
  strength = 3,
  style: BatteryStyle = 'ios',
): { obj: FabricObj; width: number; height: number; objs: FabricObj[] } {
  const { width, height } = wifiSize(style)
  const level = Math.max(0, Math.min(3, Math.round(strength)))

  const cx = width / 2
  const cy =
    style === 'oneui' ? height * 0.92 : style === 'material' ? height * 0.9 : height * 0.88
  const a0 = style === 'oneui' ? 208 : style === 'material' ? 210 : 212
  const a1 = style === 'oneui' ? 332 : style === 'material' ? 330 : 328

  const rings =
    style === 'oneui'
      ? [
          { out: 11.2, inn: 8.85 },
          { out: 7.55, inn: 5.35 },
          { out: 4.05, inn: 2.15 },
        ]
      : style === 'material'
        ? [
            { out: 10.8, inn: 8.55 },
            { out: 7.25, inn: 5.2 },
            { out: 3.9, inn: 2.05 },
          ]
        : [
            { out: 10.4, inn: 8.35 },
            { out: 7.0, inn: 5.1 },
            { out: 3.75, inn: 2.05 },
          ]

  const objs: FabricObj[] = rings.map((ring, i) => {
    const litAt = 3 - i
    return pathObj(
      `${id}a${i}`,
      left,
      top,
      arcBandPath(cx, cy, ring.out, ring.inn, a0, a1),
      ink,
      {
        opacity: level === 0 ? 0.16 : level >= litAt ? 1 : 0.2,
      },
    )
  })

  const nubR = style === 'oneui' ? 1.7 : style === 'material' ? 1.6 : 1.5
  objs.push(
    circle(`${id}dot`, left + cx - nubR, top + cy - nubR * 0.35 - nubR, nubR, ink, {
      receiptGroup: 'chrome',
      opacity: level === 0 ? 0.16 : 1,
    }),
  )

  return { obj: objs[0], objs, width, height }
}

function chargeBoltPath(scaleX: number, scaleY: number): PathCmd[] {
  const pts = [
    [6.2, 0],
    [2.1, 6.4],
    [4.85, 6.4],
    [1.2, 14],
    [9.0, 5.35],
    [5.9, 5.35],
  ]
  return [
    ['M', pts[0][0] * scaleX, pts[0][1] * scaleY],
    ...pts.slice(1).map(([x, y]) => ['L', x * scaleX, y * scaleY] as PathCmd),
    ['Z'],
  ]
}

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

export function batteryPctWidth(pct: number | string, fontSize = 12): number {
  const s = String(pct).replace('%', '')
  return Math.max(10, s.length * fontSize * 0.62 + 2)
}
