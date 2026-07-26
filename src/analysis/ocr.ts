import { createWorker, PSM, type Block, type Word } from 'tesseract.js'
import { v4 as uuid } from 'uuid'
import type { AnalysisResult, DetectedTextBox, TextRole } from '../types/receipt'
import { extractPalette } from './colors'
import { sampleInkColor, sampleRingBackground } from './inpaint'
import { inferFieldKey, fieldKeyToRole, labelForFieldKey } from './fields'
import { guessFont } from './fonts'

function bboxFromWords(words: Word[]) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const w of words) {
    x0 = Math.min(x0, w.bbox.x0)
    y0 = Math.min(y0, w.bbox.y0)
    x1 = Math.max(x1, w.bbox.x1)
    y1 = Math.max(y1, w.bbox.y1)
  }
  return { x0, y0, x1, y1 }
}

function lineConfidence(words: Word[]) {
  if (!words.length) return 0
  return words.reduce((s, w) => s + w.confidence, 0) / words.length
}

/**
 * Split a Tesseract line into clusters when there's a large horizontal gap
 * (e.g. "To" …… "bc1q… address"). Critical for form-style UI receipts.
 */
function splitWordsByGap(words: Word[]): Word[][] {
  const sorted = [...words]
    .filter((w) => (w.text ?? '').trim())
    .sort((a, b) => a.bbox.x0 - b.bbox.x0)
  if (sorted.length <= 1) return sorted.length ? [sorted] : []

  const widths = sorted.map((w) => Math.max(1, w.bbox.x1 - w.bbox.x0))
  const avgW = widths.reduce((s, v) => s + v, 0) / widths.length
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(Math.max(0, sorted[i].bbox.x0 - sorted[i - 1].bbox.x1))
  }
  const sortedGaps = [...gaps].sort((a, b) => a - b)
  const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)] || 0
  // Split on gaps that look like a label | value column break
  const threshold = Math.max(avgW * 1.6, medianGap * 2.4, 18)

  const clusters: Word[][] = [[sorted[0]]]
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].bbox.x0 - sorted[i - 1].bbox.x1
    if (gap >= threshold) clusters.push([sorted[i]])
    else clusters[clusters.length - 1].push(sorted[i])
  }
  return clusters
}

function prepareForOcr(source: HTMLCanvasElement): {
  ocrCanvas: HTMLCanvasElement
  scale: number
} {
  const minSide = Math.min(source.width, source.height)
  const scale = minSide > 0 && minSide < 1300 ? Math.min(2.2, 1400 / minSide) : 1

  const ocrCanvas = document.createElement('canvas')
  ocrCanvas.width = Math.round(source.width * scale)
  ocrCanvas.height = Math.round(source.height * scale)
  const ctx = ocrCanvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { ocrCanvas: source, scale: 1 }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ocrCanvas.width, ocrCanvas.height)
  ctx.drawImage(source, 0, 0, ocrCanvas.width, ocrCanvas.height)

  try {
    const img = ctx.getImageData(0, 0, ocrCanvas.width, ocrCanvas.height)
    const d = img.data
    const contrast = 1.18
    const intercept = 128 * (1 - contrast)
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.max(0, d[i] * contrast + intercept))
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] * contrast + intercept))
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] * contrast + intercept))
    }
    ctx.putImageData(img, 0, 0)
  } catch {
    // ignore
  }

  return { ocrCanvas, scale }
}

function clusterToBox(
  words: Word[],
  colorCtx: CanvasRenderingContext2D,
  invScale: number,
  imageHeight: number,
  imageWidth: number,
  minConfidence: number,
): DetectedTextBox | null {
  const text = words
    .map((w) => (w.text ?? '').trim())
    .filter(Boolean)
    .join(' ')
    .trim()
  if (!text) return null

  const confidence = lineConfidence(words)
  if (confidence < minConfidence) return null

  const bbox = bboxFromWords(words)
  const x0 = bbox.x0 * invScale
  const y0 = bbox.y0 * invScale
  const x1 = bbox.x1 * invScale
  const y1 = bbox.y1 * invScale
  const boxW = Math.max(4, x1 - x0)
  const boxH = Math.max(4, y1 - y0)

  if (isJunkText(text, y0, imageHeight, imageWidth, boxW)) return null

  const textColor = sampleInkColor(colorCtx, { x0, y0, x1, y1 })
  const bgColor = sampleRingBackground(colorCtx, { x0, y0, x1, y1 }, 8)
  const font = guessFont(words, boxH, text)
  const fieldKey = inferFieldKey(text, y0, imageHeight, 'other')
  const role = fieldKeyToRole(fieldKey)

  return {
    id: uuid(),
    text,
    x: x0,
    y: y0,
    width: boxW,
    height: boxH,
    confidence,
    color: textColor,
    bgColor,
    fontFamily: font.fontFamily,
    fontSize: font.fontSize,
    fontWeight: font.fontWeight,
    role,
    fieldKey,
  }
}

/** Drop status-bar noise and tiny OCR artifacts. */
function isJunkText(
  text: string,
  y: number,
  imageHeight: number,
  imageWidth: number,
  boxW: number,
): boolean {
  const t = text.trim()
  if (!t) return true
  // Phone status bar region — skip (battery, signal noise)
  if (y / imageHeight < 0.05) return true
  // Pure glyph noise
  if (/^[^a-zA-Z0-9$€£.~%\-]+$/.test(t) && t.length < 4) return true
  // Extremely wide low-value wraps
  if (boxW > imageWidth * 0.95 && t.length < 3) return true
  return false
}

function collectWords(blocks: Block[] | null): Word[] {
  if (!blocks) return []
  const words: Word[] = []
  for (const block of blocks) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const word of line.words ?? []) {
          if ((word.text ?? '').trim()) words.push(word)
        }
      }
    }
  }
  return words
}

/** Group words into visual rows by vertical center proximity. */
function clusterWordsIntoRows(words: Word[]): Word[][] {
  const sorted = [...words].sort(
    (a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0,
  )
  const rows: Word[][] = []
  for (const w of sorted) {
    const cy = (w.bbox.y0 + w.bbox.y1) / 2
    const h = Math.max(1, w.bbox.y1 - w.bbox.y0)
    let placed = false
    for (const row of rows) {
      const rcy =
        row.reduce((s, x) => s + (x.bbox.y0 + x.bbox.y1) / 2, 0) / row.length
      const rh =
        row.reduce((s, x) => s + (x.bbox.y1 - x.bbox.y0), 0) / row.length
      if (Math.abs(cy - rcy) <= Math.max(h, rh) * 0.55) {
        row.push(w)
        placed = true
        break
      }
    }
    if (!placed) rows.push([w])
  }
  return rows
}

function wordsToSmartBoxes(
  words: Word[],
  colorCtx: CanvasRenderingContext2D,
  invScale: number,
  imageHeight: number,
  imageWidth: number,
  minConfidence: number,
): DetectedTextBox[] {
  const boxes: DetectedTextBox[] = []
  for (const row of clusterWordsIntoRows(words)) {
    for (const cluster of splitWordsByGap(row)) {
      const box = clusterToBox(
        cluster,
        colorCtx,
        invScale,
        imageHeight,
        imageWidth,
        minConfidence,
      )
      if (box) boxes.push(box)
    }
  }
  return boxes
}

function scoreBoxes(boxes: DetectedTextBox[]): number {
  if (!boxes.length) return 0
  const avg = boxes.reduce((s, b) => s + b.confidence, 0) / boxes.length
  // Sweet spot for a phone receipt UI
  const n = boxes.length
  const countFactor = n >= 10 && n <= 22 ? 1.25 : n >= 7 && n <= 28 ? 1 : 0.75
  return n * avg * countFactor
}


export async function analyzeReceiptImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | string,
  onProgress?: (status: string, progress: number) => void,
): Promise<AnalysisResult> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status && typeof m.progress === 'number') {
        onProgress?.(m.status, m.progress)
      }
    },
  })

  try {
    let width = 0
    let height = 0
    const sourceCanvas = document.createElement('canvas')
    const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Could not create canvas context')

    if (typeof imageSource === 'string') {
      const img = await loadImage(imageSource)
      width = img.naturalWidth || img.width
      height = img.naturalHeight || img.height
      sourceCanvas.width = width
      sourceCanvas.height = height
      ctx.drawImage(img, 0, 0)
    } else if (imageSource instanceof HTMLCanvasElement) {
      width = imageSource.width
      height = imageSource.height
      sourceCanvas.width = width
      sourceCanvas.height = height
      ctx.drawImage(imageSource, 0, 0)
    } else {
      width = imageSource.naturalWidth || imageSource.width
      height = imageSource.naturalHeight || imageSource.height
      sourceCanvas.width = width
      sourceCanvas.height = height
      ctx.drawImage(imageSource, 0, 0)
    }

    const { ocrCanvas, scale } = prepareForOcr(sourceCanvas)
    const invScale = 1 / scale
    const palette = extractPalette(ctx, width, height)

    // Phone UI screenshots → sparse text first; thermal receipts → AUTO
    const tallUi = height / Math.max(1, width) > 1.4
    const modes = tallUi
      ? [PSM.SPARSE_TEXT, PSM.AUTO, PSM.SINGLE_BLOCK]
      : [PSM.AUTO, PSM.SPARSE_TEXT]

    let boxes: DetectedTextBox[] = []
    let bestScore = 0

    for (let i = 0; i < modes.length; i++) {
      const mode = modes[i]
      onProgress?.(i === 0 ? 'recognizing' : 'refining layout', 0.2 + i * 0.25)
      await worker.setParameters({
        tessedit_pageseg_mode: mode,
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
      })
      const result = await worker.recognize(ocrCanvas, {}, { blocks: true })
      const next = wordsToSmartBoxes(
        collectWords(result.data.blocks),
        ctx,
        invScale,
        height,
        width,
        i === 0 ? 18 : 12,
      )
      const score = scoreBoxes(next)
      if (score > bestScore) {
        bestScore = score
        boxes = next
      }
    }

    boxes = dedupeBoxes(boxes)
    boxes = suppressOverlaps(boxes)

    return { boxes, palette, width, height }
  } finally {
    await worker.terminate()
  }
}

function dedupeBoxes(boxes: DetectedTextBox[]): DetectedTextBox[] {
  const out: DetectedTextBox[] = []
  for (const box of boxes) {
    const overlap = out.find(
      (b) =>
        Math.abs(b.x - box.x) < 3 &&
        Math.abs(b.y - box.y) < 3 &&
        (b.text === box.text ||
          b.text.includes(box.text) ||
          box.text.includes(b.text)),
    )
    if (!overlap) out.push(box)
    else if (box.confidence > overlap.confidence) {
      const idx = out.indexOf(overlap)
      out[idx] = box
    }
  }
  return out
}

/** Prefer smaller, higher-confidence boxes when two heavily overlap. */
function suppressOverlaps(boxes: DetectedTextBox[]): DetectedTextBox[] {
  const sorted = [...boxes].sort((a, b) => b.confidence - a.confidence)
  const kept: DetectedTextBox[] = []

  for (const box of sorted) {
    const area = box.width * box.height
    const hits = kept.some((k) => {
      const ix0 = Math.max(box.x, k.x)
      const iy0 = Math.max(box.y, k.y)
      const ix1 = Math.min(box.x + box.width, k.x + k.width)
      const iy1 = Math.min(box.y + box.height, k.y + k.height)
      const iw = Math.max(0, ix1 - ix0)
      const ih = Math.max(0, iy1 - iy0)
      const inter = iw * ih
      const smaller = Math.min(area, k.width * k.height)
      return smaller > 0 && inter / smaller > 0.65
    })
    if (!hits) kept.push(box)
  }

  return kept.sort((a, b) => a.y - b.y || a.x - b.x)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

export function guessRoleLabel(role: TextRole): string {
  switch (role) {
    case 'store':
      return 'Store name'
    case 'item':
      return 'Line item'
    case 'total':
      return 'Total'
    case 'date':
      return 'Date'
    case 'time':
      return 'Time'
    case 'phone':
      return 'Phone'
    case 'battery':
      return 'Battery'
    case 'network':
      return 'Network'
    case 'wallet':
      return 'Wallet'
    case 'account':
      return 'Account'
    case 'status':
      return 'Status'
    default:
      return 'Text'
  }
}

export { labelForFieldKey }
