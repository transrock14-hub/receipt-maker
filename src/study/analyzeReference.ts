/**
 * Study a real wallet/bank screenshot: palette + OCR field hints.
 * Used so Generate can copy colors and status-bar details from real refs.
 */
import { v4 as uuid } from 'uuid'
import { analyzeReceiptImage } from '../analysis/ocr'
import { extractPalette } from '../analysis/colors'
import type { FieldKey, GenerateValues } from '../types/receipt'
import type { StudyReference } from './types'

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

function makeThumbnail(img: HTMLImageElement, maxW = 160): string {
  const scale = Math.min(1, maxW / Math.max(1, img.width))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  ctx.drawImage(img, 0, 0, w, h)
  return c.toDataURL('image/jpeg', 0.72)
}

function luminanceHex(hex: string): number {
  const h = hex.replace('#', '')
  if (h.length < 6) return 0.5
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function pickBackground(palette: string[]): string {
  if (!palette.length) return '#181A20'
  // Prefer darkest frequent color as app bg
  return [...palette].sort((a, b) => luminanceHex(a) - luminanceHex(b))[0]
}

function pickInk(palette: string[], background: string): string {
  const bgLum = luminanceHex(background)
  const sorted = [...palette].sort((a, b) => luminanceHex(b) - luminanceHex(a))
  if (bgLum < 0.45) {
    // Dark UI → light ink
    return sorted.find((c) => luminanceHex(c) > 0.55) || '#EAECEF'
  }
  return sorted.find((c) => luminanceHex(c) < 0.35) || '#0A0B0D'
}

export async function studyScreenshot(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<StudyReference> {
  onProgress?.('Loading…')
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const img = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0)

  onProgress?.('Reading colors…')
  const palette = extractPalette(ctx, canvas.width, canvas.height, 7)
  const background = pickBackground(palette)
  const ink = pickInk(palette, background)

  onProgress?.('Studying layout (OCR)…')
  let detectedValues: Partial<GenerateValues> = {}
  try {
    const analysis = await analyzeReceiptImage(canvas, () => {})
    const map = new Map<FieldKey, string>()
    for (const box of analysis.boxes) {
      const key = box.fieldKey
      const text = (box.text || '').trim()
      if (!key || !text) continue
      if (!map.has(key) || text.length > String(map.get(key)).length) {
        map.set(key, text)
      }
    }
    detectedValues = Object.fromEntries(map) as Partial<GenerateValues>
  } catch {
    // Palette-only study still useful if OCR fails
  }

  const bits: string[] = []
  if (detectedValues.time) bits.push(`time ${detectedValues.time}`)
  if (detectedValues.battery) bits.push(`battery ${detectedValues.battery}`)
  if (detectedValues.status) bits.push(String(detectedValues.status))
  if (detectedValues.amountCrypto || detectedValues.amountFiat) {
    bits.push(String(detectedValues.amountCrypto || detectedValues.amountFiat))
  }
  const summary = bits.length
    ? `Learned: ${bits.slice(0, 4).join(' · ')}`
    : `Palette ${palette.slice(0, 3).join(', ')}`

  return {
    id: uuid(),
    name: file.name.replace(/\.[^.]+$/, '') || 'Screenshot',
    createdAt: new Date().toISOString(),
    dataUrl,
    thumbnail: makeThumbnail(img),
    palette,
    background,
    ink,
    detectedValues,
    summary,
    active: true,
  }
}

/** Tint composed Fabric JSON fills toward studied palette (subtle, non-destructive). */
export function applyStudyPaletteToCanvasJson(
  canvasJson: Record<string, unknown>,
  insights: { palette: string[]; background: string; ink: string },
): Record<string, unknown> {
  const json = structuredClone(canvasJson)
  if (insights.background) {
    json.background = insights.background
  }
  const objects = (json.objects as Array<Record<string, unknown>>) || []
  // Remap near-black fills to studied background; near-white text stays ink
  for (const obj of objects) {
    const fill = typeof obj.fill === 'string' ? obj.fill : null
    if (!fill || !fill.startsWith('#')) continue
    const lum = luminanceHex(fill)
    // Status chrome / primary text → studied ink when very light or very dark mismatch
    if (obj.type === 'IText' || obj.type === 'i-text') {
      if (lum > 0.7 || lum < 0.25) {
        // Keep green/yellow accents (status, CTAs)
        const r = parseInt(fill.slice(1, 3), 16)
        const g = parseInt(fill.slice(3, 5), 16)
        const b = parseInt(fill.slice(5, 7), 16)
        const isAccent = (g > r + 30 && g > b + 20) || (r > g + 40 && r > b + 20)
        if (!isAccent) obj.fill = insights.ink
      }
    }
  }
  void insights.palette
  return { ...json, objects }
}
