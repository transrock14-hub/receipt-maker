function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  )
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Sample text vs background color inside an OCR bounding box. */
export function extractBoxColors(
  ctx: CanvasRenderingContext2D,
  bbox: { x0: number; y0: number; x1: number; y1: number },
): { textColor: string; bgColor: string } {
  const x = Math.max(0, Math.floor(bbox.x0))
  const y = Math.max(0, Math.floor(bbox.y0))
  const w = Math.max(1, Math.floor(bbox.x1 - bbox.x0))
  const h = Math.max(1, Math.floor(bbox.y1 - bbox.y0))

  let data: ImageData
  try {
    data = ctx.getImageData(x, y, w, h)
  } catch {
    return { textColor: '#1a1a1a', bgColor: '#f5f5f0' }
  }

  const pixels: { r: number; g: number; b: number; lum: number }[] = []
  const step = Math.max(1, Math.floor((w * h) / 400))

  for (let i = 0; i < data.data.length; i += 4 * step) {
    const r = data.data[i]
    const g = data.data[i + 1]
    const b = data.data[i + 2]
    const a = data.data[i + 3]
    if (a < 128) continue
    pixels.push({ r, g, b, lum: luminance(r, g, b) })
  }

  if (!pixels.length) {
    return { textColor: '#1a1a1a', bgColor: '#f5f5f0' }
  }

  pixels.sort((a, b) => a.lum - b.lum)
  const dark = pixels.slice(0, Math.max(1, Math.floor(pixels.length * 0.25)))
  const light = pixels.slice(Math.floor(pixels.length * 0.75))

  const avg = (list: typeof pixels) => {
    const n = list.length || 1
    return {
      r: list.reduce((s, p) => s + p.r, 0) / n,
      g: list.reduce((s, p) => s + p.g, 0) / n,
      b: list.reduce((s, p) => s + p.b, 0) / n,
    }
  }

  const d = avg(dark)
  const l = avg(light.length ? light : pixels.slice(-Math.max(1, Math.floor(pixels.length * 0.25))))

  // Prefer darker as text for receipts
  return {
    textColor: rgbToHex(d.r, d.g, d.b),
    bgColor: rgbToHex(l.r, l.g, l.b),
  }
}

/** Quantize image into a small dominant palette. */
export function extractPalette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maxColors = 6,
): string[] {
  const sampleW = Math.min(width, 120)
  const sampleH = Math.min(height, 160)
  const tmp = document.createElement('canvas')
  tmp.width = sampleW
  tmp.height = sampleH
  const tctx = tmp.getContext('2d')
  if (!tctx) return ['#1a1a1a', '#f5f5f0']

  tctx.drawImage(ctx.canvas, 0, 0, sampleW, sampleH)
  let data: ImageData
  try {
    data = tctx.getImageData(0, 0, sampleW, sampleH)
  } catch {
    return ['#1a1a1a', '#f5f5f0']
  }

  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>()

  for (let i = 0; i < data.data.length; i += 4) {
    const a = data.data[i + 3]
    if (a < 200) continue
    const r = Math.round(data.data[i] / 24) * 24
    const g = Math.round(data.data[i + 1] / 24) * 24
    const b = Math.round(data.data[i + 2] / 24) * 24
    const key = `${r},${g},${b}`
    const existing = buckets.get(key)
    if (existing) {
      existing.count++
      existing.r += data.data[i]
      existing.g += data.data[i + 1]
      existing.b += data.data[i + 2]
    } else {
      buckets.set(key, {
        count: 1,
        r: data.data[i],
        g: data.data[i + 1],
        b: data.data[i + 2],
      })
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count)
  const colors: string[] = []

  for (const bucket of sorted) {
    const hex = rgbToHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count)
    if (!colors.includes(hex)) colors.push(hex)
    if (colors.length >= maxColors) break
  }

  return colors.length ? colors : ['#1a1a1a', '#f5f5f0']
}
