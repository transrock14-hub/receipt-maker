import {
  Canvas,
  FabricImage,
  IText,
  filters,
  type FabricObject,
} from 'fabric'
import type {
  AnalysisResult,
  DetectedTextBox,
  SelectedObjectProps,
  TextRole,
} from '../types/receipt'
import { CUSTOM_PROPS } from '../types/receipt'
import { loadImageElement, paintOutTextRegions } from '../analysis/inpaint'

export type EditorCanvas = Canvas

const SERIALIZE_PROPS = [...CUSTOM_PROPS]

export function createEditorCanvas(el: HTMLCanvasElement, width = 400, height = 600) {
  const canvas = new Canvas(el, {
    width,
    height,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
    selection: true,
    controlsAboveOverlay: true,
    stopContextMenu: true,
    fireRightClick: true,
    uniScaleKey: 'shiftKey',
    centeredKey: 'altKey',
    enableRetinaScaling: true,
    imageSmoothingEnabled: true,
  })

  canvas.selectionColor = 'rgba(122, 90, 248, 0.12)'
  canvas.selectionBorderColor = '#7a5af8'
  canvas.selectionLineWidth = 1.5

  return canvas
}

/** Uniform scale only — never stretch. Preserve exact aspect ratio. */
function fitScale(iw: number, ih: number, maxW: number, maxH: number) {
  if (iw <= 0 || ih <= 0) return 1
  return Math.min(1, maxW / iw, maxH / ih)
}

export async function loadImageAsBackground(
  canvas: Canvas,
  dataUrl: string,
): Promise<{ width: number; height: number; scale: number }> {
  const el = await loadImageElement(dataUrl)
  const iw = el.naturalWidth || el.width
  const ih = el.naturalHeight || el.height
  const maxW = 440
  const maxH = 820
  const scale = fitScale(iw, ih, maxW, maxH)
  const w = Math.max(1, Math.round(iw * scale))
  const h = Math.max(1, Math.round(ih * scale))
  // Identical X/Y scale — never skew the bitmap
  const uniform = Math.min(w / iw, h / ih)

  const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })

  canvas.clear()
  canvas.backgroundColor = '#ffffff'
  canvas.setDimensions({
    width: Math.round(iw * uniform),
    height: Math.round(ih * uniform),
  })

  img.set({
    scaleX: uniform,
    scaleY: uniform,
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
    objectCaching: false,
  })
  img.set('isBackground', true)
  img.set('originalDataUrl', dataUrl)

  canvas.add(img)
  canvas.sendObjectToBack(img)
  canvas.requestRenderAll()
  return {
    width: Math.round(iw * uniform),
    height: Math.round(ih * uniform),
    scale: uniform,
  }
}

export function clearTextAndCovers(canvas: Canvas) {
  const objs = canvas.getObjects().filter((o) => {
    if (o.get('isBackground')) return false
    return Boolean(o.get('receiptId') || o.get('isCover'))
  })
  objs.forEach((o) => canvas.remove(o))
  canvas.requestRenderAll()
}

async function setBackgroundFromDataUrl(
  canvas: Canvas,
  dataUrl: string,
  displayW: number,
  displayH: number,
  meta?: { originalDataUrl?: string },
) {
  const el = await loadImageElement(dataUrl)
  const iw = el.naturalWidth || el.width
  const ih = el.naturalHeight || el.height
  const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })

  const prev = canvas.getObjects().filter((o) => o.get('isBackground'))
  prev.forEach((o) => canvas.remove(o))

  // Lock uniform scale from width; height follows native aspect
  const uniform = displayW / iw
  const drawnH = ih * uniform
  // Keep canvas size stable if already set
  if (Math.abs(drawnH - displayH) > 1) {
    canvas.setDimensions({ width: displayW, height: Math.round(drawnH) })
  }

  img.set({
    scaleX: uniform,
    scaleY: uniform,
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
    objectCaching: false,
  })
  img.set('isBackground', true)
  if (meta?.originalDataUrl) img.set('originalDataUrl', meta.originalDataUrl)

  canvas.add(img)
  canvas.sendObjectToBack(img)
}

/**
 * Fit Fabric text into an OCR box: match height, then gently match width.
 * Keeps aspect of glyphs (no vertical stretch).
 */
export function fitTextToBox(text: IText, targetW: number, targetH: number) {
  text.set({
    padding: 0,
    lineHeight: 1,
    charSpacing: 0,
    scaleX: 1,
    scaleY: 1,
  })

  let fontSize = Math.max(6, targetH * 0.88)
  text.set({ fontSize })
  text.initDimensions()

  let measuredH = text.calcTextHeight()
  if (measuredH > 0.1) {
    fontSize = Math.max(6, Math.min(64, fontSize * (targetH / measuredH)))
    text.set({ fontSize })
    text.initDimensions()
  }

  const measuredW = text.calcTextWidth()
  if (measuredW > 0.1 && targetW > 0) {
    const sx = targetW / measuredW
    // Only tiny horizontal nudge — large scaleX looks distorted
    if (sx > 0.88 && sx < 1.12) {
      text.set({ scaleX: sx })
    }
  }

  text.initDimensions()
  const finalH = text.getScaledHeight()
  return (targetH - finalH) / 2
}

export async function applyOcrLayers(
  canvas: Canvas,
  analysis: AnalysisResult,
  imageScale: number,
  hideOriginal: boolean,
  originalDataUrl?: string | null,
) {
  clearTextAndCovers(canvas)

  const displayW = canvas.getWidth()
  const displayH = canvas.getHeight()
  const sourceUrl =
    originalDataUrl ||
    (canvas.getObjects().find((o) => o.get('isBackground'))?.get('originalDataUrl') as
      | string
      | undefined)

  if (hideOriginal && sourceUrl && analysis.boxes.length) {
    const sourceImg = await loadImageElement(sourceUrl)
    // Paint every OCR box + a union pass so ghost ink is gone
    const paintBoxes = analysis.boxes.map((b) => ({
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      bgColor: b.bgColor || '#ffffff',
    }))
    const cleaned = paintOutTextRegions(sourceImg, paintBoxes)
    const cleanedUrl = cleaned.toDataURL('image/png')
    await setBackgroundFromDataUrl(canvas, cleanedUrl, displayW, displayH, {
      originalDataUrl: sourceUrl,
    })
  } else if (!hideOriginal && sourceUrl) {
    await setBackgroundFromDataUrl(canvas, sourceUrl, displayW, displayH, {
      originalDataUrl: sourceUrl,
    })
  }

  // Use the live canvas scale so text lands on the bitmap exactly
  const bg = canvas.getObjects().find((o) => o.get('isBackground')) as FabricImage | undefined
  const liveScale = bg?.scaleX || imageScale

  for (const box of analysis.boxes) {
    addTextLayer(canvas, box, liveScale)
  }
  canvas.requestRenderAll()
}

export function addTextLayer(canvas: Canvas, box: DetectedTextBox, scale: number) {
  const left = box.x * scale
  const top = box.y * scale
  const width = Math.max(4, box.width * scale)
  const height = Math.max(4, box.height * scale)

  const fontFamily = box.fontFamily || '"DM Sans", sans-serif'

  const text = new IText(box.text, {
    left,
    top,
    fontSize: Math.max(6, height * 0.88),
    fontFamily,
    fontWeight: box.fontWeight,
    fill: box.color,
    editable: true,
    originX: 'left',
    originY: 'top',
    padding: 0,
    lineHeight: 1,
    cornerColor: '#7a5af8',
    cornerStyle: 'circle',
    borderColor: '#7a5af8',
    transparentCorners: false,
    cornerSize: 8,
    objectCaching: false,
  })

  const yNudge = fitTextToBox(text, width, height)
  text.set({
    left: Math.round(left * 2) / 2,
    top: Math.round((top + yNudge) * 2) / 2,
  })

  text.set('receiptId', box.id)
  text.set('receiptRole', box.role)
  text.set('receiptFieldKey', box.fieldKey || 'other')
  text.set('ocrConfidence', box.confidence)

  canvas.add(text)
  return text
}

export function getSelectedProps(obj: FabricObject | undefined | null): SelectedObjectProps | null {
  if (!obj) return null

  const base: SelectedObjectProps = {
    id: String(obj.get('receiptId') || 'obj'),
    type: obj.type || 'object',
  }

  if (
    obj instanceof IText ||
    obj.type === 'i-text' ||
    obj.type === 'IText' ||
    obj.type === 'textbox' ||
    obj.type === 'text'
  ) {
    const t = obj as IText
    return {
      ...base,
      type: 'text',
      text: t.text,
      fontFamily: t.fontFamily,
      fontSize: t.fontSize,
      fill: typeof t.fill === 'string' ? t.fill : '#000',
      fontWeight: t.fontWeight,
      role: obj.get('receiptRole') as TextRole | undefined,
      fieldKey: obj.get('receiptFieldKey') as import('../types/receipt').FieldKey | undefined,
      confidence: obj.get('ocrConfidence') as number | undefined,
    }
  }

  return base
}

export function updateSelectedText(
  obj: FabricObject,
  patch: Partial<{
    text: string
    fontFamily: string
    fontSize: number
    fill: string
    fontWeight: string | number
    role: TextRole
    fieldKey: import('../types/receipt').FieldKey
  }>,
) {
  if (patch.text != null && 'set' in obj) {
    ;(obj as IText).set('text', patch.text)
  }
  if (patch.fontFamily != null) obj.set('fontFamily', patch.fontFamily)
  if (patch.fontSize != null) {
    obj.set('fontSize', patch.fontSize)
    obj.set('scaleX', 1)
    obj.set('scaleY', 1)
  }
  if (patch.fill != null) obj.set('fill', patch.fill)
  if (patch.fontWeight != null) obj.set('fontWeight', patch.fontWeight)
  if (patch.role != null) obj.set('receiptRole', patch.role)
  if (patch.fieldKey != null) obj.set('receiptFieldKey', patch.fieldKey)
  obj.setCoords()
  obj.canvas?.requestRenderAll()
}

export function exportCanvasPng(canvas: Canvas, filename = 'receipt.png') {
  const dataUrl = canvas.toDataURL({
    format: 'png',
    multiplier: 2,
    enableRetinaScaling: true,
  })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export function canvasToJson(canvas: Canvas) {
  return canvas.toObject(SERIALIZE_PROPS as string[]) as Record<string, unknown>
}

export async function loadCanvasJson(
  canvas: Canvas,
  json: Record<string, unknown>,
  width: number,
  height: number,
) {
  canvas.clear()
  canvas.setDimensions({ width, height })
  await canvas.loadFromJSON(json)
  canvas.requestRenderAll()
}

export function rotateBackground(canvas: Canvas, degrees: number) {
  const bg = canvas.getObjects().find((o) => o.get('isBackground')) as FabricImage | undefined
  if (!bg) {
    canvas.getObjects().forEach((o) => {
      o.rotate((o.angle || 0) + degrees)
      o.setCoords()
    })
    canvas.requestRenderAll()
    return
  }
  bg.rotate((bg.angle || 0) + degrees)
  bg.setCoords()
  canvas.requestRenderAll()
}

export function applyImageAdjustments(
  canvas: Canvas,
  brightness: number,
  contrast: number,
) {
  const bg = canvas.getObjects().find((o) => o.get('isBackground')) as FabricImage | undefined
  if (!bg) return

  bg.filters = []
  if (brightness !== 0) {
    bg.filters.push(new filters.Brightness({ brightness }))
  }
  if (contrast !== 0) {
    bg.filters.push(new filters.Contrast({ contrast }))
  }
  bg.applyFilters()
  canvas.requestRenderAll()
}

export function cropCanvasToSelection(canvas: Canvas) {
  const active = canvas.getActiveObject()
  if (!active) return false

  const bound = active.getBoundingRect()
  const dataUrl = canvas.toDataURL({
    format: 'png',
    left: bound.left,
    top: bound.top,
    width: bound.width,
    height: bound.height,
    multiplier: 1,
  })

  return dataUrl
}

export function addBlankText(canvas: Canvas) {
  const text = new IText('Double-click to edit', {
    left: canvas.getWidth() / 2 - 80,
    top: canvas.getHeight() / 2 - 10,
    fontSize: 18,
    fontFamily: '"DM Sans", sans-serif',
    fill: '#1c1b18',
    padding: 0,
    lineHeight: 1,
    cornerColor: '#7a5af8',
    cornerStyle: 'circle',
    borderColor: '#7a5af8',
    transparentCorners: false,
    cornerSize: 8,
  })
  text.set('receiptId', `manual-${Date.now()}`)
  text.set('receiptRole', 'other')
  canvas.add(text)
  canvas.setActiveObject(text)
  text.enterEditing()
  text.selectAll()
  canvas.requestRenderAll()
  return text
}

export function deleteActive(canvas: Canvas) {
  const active = canvas.getActiveObjects()
  if (!active.length) return
  active.forEach((o) => canvas.remove(o))
  canvas.discardActiveObject()
  canvas.requestRenderAll()
}

export function toggleCoversVisibility(canvas: Canvas, _visible: boolean) {
  // Covers are baked into the background now; toggling re-runs applyOcrLayers from App.
  void canvas
  void _visible
}
