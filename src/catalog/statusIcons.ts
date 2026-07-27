/**
 * Status-bar icons — match real iOS SF Symbols / Samsung One UI / Material.
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

/** Shared icon-box anchors so Fabric pathOffset stays identical across rings. */
function boxAnchors(boxW: number, boxH: number): PathCmd[] {
  return [
    ['M', 0, 0],
    ['L', 0, 0],
    ['M', boxW, 0],
    ['L', boxW, 0],
    ['M', boxW, boxH],
    ['L', boxW, boxH],
    ['M', 0, boxH],
    ['L', 0, boxH],
  ]
}

/**
 * Solid annular sector (filled arc band) — SF / One UI Wi‑Fi look.
 * Corner anchors keep concentric rings aligned under Fabric pathOffset.
 */
function arcBandPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  a0: number,
  a1: number,
  boxW: number,
  boxH: number,
): PathCmd[] {
  const [x0, y0] = polar(cx, cy, rOut, a0)
  const [x1, y1] = polar(cx, cy, rOut, a1)
  const [x2, y2] = polar(cx, cy, rIn, a1)
  const [x3, y3] = polar(cx, cy, rIn, a0)
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  return [
    ...boxAnchors(boxW, boxH),
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
  const tipW = style === 'ios' ? 1.7 : 1.6
  const tipGap = 0.55
  return { width: bodyW + tipGap + tipW, height: bodyH }
}

export function signalSize(opts?: { barW?: number; gap?: number; maxH?: number }) {
  const barW = opts?.barW ?? 3.1
  const gap = opts?.gap ?? 1.7
  const maxH = opts?.maxH ?? 11
  return { width: 4 * barW + 3 * gap, height: maxH }
}

export function wifiSize(style: BatteryStyle = 'ios'): { width: number; height: number } {
  if (style === 'oneui') return { width: 16.6, height: 12.2 }
  if (style === 'material') return { width: 16.2, height: 12 }
  return { width: 15.6, height: 11.4 }
}

export function cellularLabelWidth(labelText: string, size = 11): number {
  const t = labelText.trim()
  if (!t) return 0
  return Math.max(11, t.length * size * 0.58 + 1)
}

/** Cellular signal — 4 ascending rounded capsules (SF / One UI / Material). */
export function drawSignal(
  id: string,
  left: number,
  top: number,
  ink: string,
  opts?: { barW?: number; gap?: number; maxH?: number; bars?: number; style?: BatteryStyle },
): { obj: FabricObj; width: number; height: number; objs: FabricObj[] } {
  const style = opts?.style ?? 'ios'
  const barW =
    opts?.barW ?? (style === 'oneui' ? 2.85 : style === 'material' ? 2.95 : 3.05)
  const gap = opts?.gap ?? (style === 'oneui' ? 1.4 : style === 'material' ? 1.55 : 1.55)
  const maxH = opts?.maxH ?? (style === 'oneui' ? 11.2 : style === 'material' ? 11 : 10.8)
  const active = Math.max(1, Math.min(4, opts?.bars ?? 4))
  // Real iOS SF Symbol cellularbars: short → tall with soft steps
  const heights =
    style === 'ios'
      ? [0.34, 0.52, 0.74, 1].map((t) => Math.max(3.4, maxH * t))
      : style === 'oneui'
        ? [0.3, 0.5, 0.72, 1].map((t) => Math.max(3.0, maxH * t))
        : [0.34, 0.54, 0.74, 1].map((t) => Math.max(3.2, maxH * t))
  const width = heights.length * barW + (heights.length - 1) * gap
  const r = Math.min(barW / 2, style === 'ios' ? 1.15 : style === 'oneui' ? 0.8 : 1.2)
  const dim = style === 'ios' ? 0.28 : 0.22
  const objs = heights.map((h, i) =>
    rect(`${id}${i}`, left + i * (barW + gap), top + (maxH - h), barW, h, ink, r, {
      opacity: i < active ? 1 : dim,
      receiptGroup: 'chrome',
    }),
  )
  return { obj: objs[0], objs, width, height: maxH }
}

/**
 * Wi‑Fi fan — solid filled arc bands + nub (device-tuned).
 * Matches SF Symbol / One UI / Material; bbox anchors keep rings concentric.
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
  const cy = style === 'oneui' ? height * 0.98 : style === 'material' ? height * 0.96 : height * 0.94
  // SF wifi ~ ±54° from vertical; One UI a touch wider
  const a0 = style === 'oneui' ? 214 : style === 'material' ? 216 : 218
  const a1 = style === 'oneui' ? 326 : style === 'material' ? 324 : 322

  const rings =
    style === 'oneui'
      ? [
          { out: 10.6, inn: 8.55 },
          { out: 7.15, inn: 5.2 },
          { out: 3.85, inn: 2.15 },
        ]
      : style === 'material'
        ? [
            { out: 10.3, inn: 8.35 },
            { out: 6.95, inn: 5.1 },
            { out: 3.7, inn: 2.1 },
          ]
        : [
            // SF Symbol wifi — solid wedges, tight gaps
            { out: 10.0, inn: 8.15 },
            { out: 6.7, inn: 5.0 },
            { out: 3.55, inn: 2.05 },
          ]

  const dim = style === 'ios' ? 0.28 : 0.2
  const objs: FabricObj[] = rings.map((ring, i) => {
    const litAt = 3 - i
    return pathObj(
      `${id}a${i}`,
      left,
      top,
      arcBandPath(cx, cy, ring.out, ring.inn, a0, a1, width, height),
      ink,
      {
        width,
        height,
        pathOffset: { x: width / 2, y: height / 2 },
        opacity: level === 0 ? 0.16 : level >= litAt ? 1 : dim,
      },
    )
  })

  const nubR = style === 'oneui' ? 1.55 : style === 'material' ? 1.45 : 1.4
  const nubCy = cy - 0.15
  objs.push(
    circle(`${id}dot`, left + cx - nubR, top + nubCy - nubR, nubR, ink, {
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
  const tipW = style === 'ios' ? 1.7 : 1.6
  const tipGap = 0.55
  const { height } = batterySize(style)
  const r = bodyH * (style === 'ios' ? 0.38 : style === 'oneui' ? 0.24 : 0.34)
  const stroke = style === 'ios' ? 1.4 : 1.25
  const critical = level <= 20
  const warn = level <= 30 && level > 20

  const outline = ink

  let fillColor = ink
  if (charging) fillColor = style === 'ios' ? '#34C759' : '#1E8E3E'
  else if (critical) fillColor = style === 'ios' ? '#FF3B30' : '#D93025'
  else if (warn && style !== 'ios') fillColor = '#F9AB00'

  const tipH = bodyH * 0.4
  const tipTop = top + (bodyH - tipH) / 2

  const inset = stroke + (style === 'ios' ? 1.2 : 1.1)
  const innerH = bodyH - inset * 2
  const innerR = style === 'oneui' ? Math.max(0.8, innerH / 4) : Math.max(0.9, innerH / 2.2)
  const maxFill = bodyW - inset * 2
  const fillRatio = level >= 97 ? 1 : Math.max(0.08, level / 100)
  let fillW = Math.max(innerH * 0.45, maxFill * fillRatio)
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

export function alarmSize(): { width: number; height: number } {
  return { width: 12.6, height: 12.6 }
}

/** One UI alarm-clock status icon — outlined dial, ~10:10 hands, bell stubs. */
export function drawAlarm(
  id: string,
  left: number,
  top: number,
  ink: string,
): { objs: FabricObj[]; width: number; height: number } {
  const { width, height } = alarmSize()
  const r = 4.4
  const cx = left + width / 2
  const cy = top + height / 2 + 0.9
  const stroke = 1.25
  const bellD = (r + 0.9) * 0.707
  const objs: FabricObj[] = [
    {
      ...circle(`${id}Dial`, cx - r, cy - r, r, 'rgba(0,0,0,0)'),
      stroke: ink,
      strokeWidth: stroke,
      receiptGroup: 'chrome',
    },
    // hands (minute up, hour right)
    { ...rect(`${id}Min`, cx - 0.55, cy - 3, 1.1, 3.2, ink, 0.55), receiptGroup: 'chrome' },
    { ...rect(`${id}Hr`, cx - 0.55, cy - 0.55, 2.9, 1.1, ink, 0.55), receiptGroup: 'chrome' },
    // diagonal bell stubs at the top corners, tangent to the dial
    {
      ...rect(`${id}BellL`, cx - bellD, cy - bellD, 3, 1.2, ink, 0.6, {
        originX: 'center',
        originY: 'center',
      }),
      angle: -45,
      receiptGroup: 'chrome',
    },
    {
      ...rect(`${id}BellR`, cx + bellD, cy - bellD, 3, 1.2, ink, 0.6, {
        originX: 'center',
        originY: 'center',
      }),
      angle: 45,
      receiptGroup: 'chrome',
    },
  ]
  return { objs, width, height }
}

export function batteryPctWidth(pct: number | string, fontSize = 12): number {
  const s = String(pct).replace('%', '')
  return Math.max(10, s.length * fontSize * 0.62 + 2)
}
