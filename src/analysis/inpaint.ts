/** Sample background color from a ring around a text box (avoids mixing in ink). */
export function sampleRingBackground(
  ctx: CanvasRenderingContext2D,
  bbox: { x0: number; y0: number; x1: number; y1: number },
  ring = 6,
): string {
  const canvasW = ctx.canvas.width
  const canvasH = ctx.canvas.height
  const x0 = Math.max(0, Math.floor(bbox.x0) - ring)
  const y0 = Math.max(0, Math.floor(bbox.y0) - ring)
  const x1 = Math.min(canvasW, Math.ceil(bbox.x1) + ring)
  const y1 = Math.min(canvasH, Math.ceil(bbox.y1) + ring)
  const innerX0 = Math.max(0, Math.floor(bbox.x0))
  const innerY0 = Math.max(0, Math.floor(bbox.y0))
  const innerX1 = Math.min(canvasW, Math.ceil(bbox.x1))
  const innerY1 = Math.min(canvasH, Math.ceil(bbox.y1))

  let data: ImageData
  try {
    data = ctx.getImageData(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0))
  } catch {
    return '#ffffff'
  }

  const w = x1 - x0
  const samples: { r: number; g: number; b: number; lum: number }[] = []
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const inInner = px >= innerX0 && px < innerX1 && py >= innerY0 && py < innerY1
      if (inInner) continue
      const i = ((py - y0) * w + (px - x0)) * 4
      const a = data.data[i + 3]
      if (a < 200) continue
      const r = data.data[i]
      const g = data.data[i + 1]
      const b = data.data[i + 2]
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      if (lum < 160) continue
      samples.push({ r, g, b, lum })
    }
  }

  if (!samples.length) {
    try {
      const inner = ctx.getImageData(
        innerX0,
        innerY0,
        Math.max(1, innerX1 - innerX0),
        Math.max(1, innerY1 - innerY0),
      )
      let best = { lum: -1, r: 255, g: 255, b: 255 }
      for (let i = 0; i < inner.data.length; i += 4) {
        const lum =
          0.2126 * inner.data[i] + 0.7152 * inner.data[i + 1] + 0.0722 * inner.data[i + 2]
        if (lum > best.lum) {
          best = { lum, r: inner.data[i], g: inner.data[i + 1], b: inner.data[i + 2] }
        }
      }
      return rgbToHex(best.r, best.g, best.b)
    } catch {
      return '#ffffff'
    }
  }

  // Use median luminance sample for stable UI whites/greys
  samples.sort((a, b) => a.lum - b.lum)
  const mid = samples[Math.floor(samples.length * 0.7)]
  return rgbToHex(mid.r, mid.g, mid.b)
}

/** Dark ink color from inside the glyph box (not mid-grey mix). */
export function sampleInkColor(
  ctx: CanvasRenderingContext2D,
  bbox: { x0: number; y0: number; x1: number; y1: number },
): string {
  const x = Math.max(0, Math.floor(bbox.x0))
  const y = Math.max(0, Math.floor(bbox.y0))
  const w = Math.max(1, Math.floor(bbox.x1 - bbox.x0))
  const h = Math.max(1, Math.floor(bbox.y1 - bbox.y0))

  let data: ImageData
  try {
    data = ctx.getImageData(x, y, w, h)
  } catch {
    return '#1a1a1a'
  }

  const pixels: { r: number; g: number; b: number; lum: number }[] = []
  const step = Math.max(1, Math.floor((w * h) / 500))
  for (let i = 0; i < data.data.length; i += 4 * step) {
    if (data.data[i + 3] < 180) continue
    const r = data.data[i]
    const g = data.data[i + 1]
    const b = data.data[i + 2]
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    pixels.push({ r, g, b, lum })
  }
  if (!pixels.length) return '#1a1a1a'
  pixels.sort((a, b) => a.lum - b.lum)
  // Darkest ~12% = ink (avoids averaging with white bg → muddy grey)
  const dark = pixels.slice(0, Math.max(1, Math.floor(pixels.length * 0.12)))
  const n = dark.length
  const r = dark.reduce((s, p) => s + p.r, 0) / n
  const g = dark.reduce((s, p) => s + p.g, 0) / n
  const b = dark.reduce((s, p) => s + p.b, 0) / n
  return rgbToHex(r, g, b)
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  )
}

export interface PaintBox {
  x: number
  y: number
  width: number
  height: number
  bgColor?: string
}

function expandBoxes(boxes: PaintBox[], imageW: number, imageH: number): PaintBox[] {
  return boxes.map((box) => {
    const padX = Math.max(4, Math.round(box.height * 0.35))
    const padY = Math.max(3, Math.round(box.height * 0.45))
    const x = Math.max(0, box.x - padX)
    const y = Math.max(0, box.y - padY)
    const x1 = Math.min(imageW, box.x + box.width + padX)
    const y1 = Math.min(imageH, box.y + box.height + padY)
    return {
      ...box,
      x,
      y,
      width: Math.max(1, x1 - x),
      height: Math.max(1, y1 - y),
    }
  })
}

/**
 * Paint out text regions aggressively so no ghost glyphs remain.
 * Coordinates are in the same space as `source` pixels.
 */
export function paintOutTextRegions(
  source: HTMLCanvasElement | HTMLImageElement,
  boxes: PaintBox[],
): HTMLCanvasElement {
  const width = 'naturalWidth' in source ? source.naturalWidth || source.width : source.width
  const height = 'naturalHeight' in source ? source.naturalHeight || source.height : source.height

  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const ctx = out.getContext('2d', { willReadFrequently: true })
  if (!ctx) return out

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(source, 0, 0, width, height)

  // Sample colors BEFORE painting (from original)
  const prepared = boxes.map((box) => {
    const bg =
      box.bgColor ||
      sampleRingBackground(ctx, {
        x0: box.x,
        y0: box.y,
        x1: box.x + box.width,
        y1: box.y + box.height,
      }, 8)
    return { ...box, bgColor: bg }
  })

  const expanded = expandBoxes(prepared, width, height)

  // Pass 1: solid fills
  for (const box of expanded) {
    ctx.fillStyle = box.bgColor || '#ffffff'
    roundRect(ctx, box.x, box.y, box.width, box.height, Math.min(4, box.height / 3))
    ctx.fill()
  }

  // Pass 2: slightly larger white/light wash for residual anti-aliased edges
  for (const box of expanded) {
    const pad = 2
    ctx.fillStyle = box.bgColor || '#ffffff'
    ctx.globalAlpha = 0.85
    ctx.fillRect(box.x - pad, box.y - pad, box.width + pad * 2, box.height + pad * 2)
    ctx.globalAlpha = 1
  }

  return out
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}
