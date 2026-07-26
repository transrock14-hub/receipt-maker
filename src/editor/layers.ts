import type { Canvas, FabricObject } from 'fabric'
import { IText } from 'fabric'

export interface LayerInfo {
  id: string
  label: string
  type: string
  visible: boolean
  locked: boolean
  object: FabricObject
  group: string
}

const GROUP_ORDER = ['chrome', 'header', 'details', 'cta', 'other']
const GROUP_LABEL: Record<string, string> = {
  chrome: 'Status bar',
  header: 'Header',
  details: 'Details',
  cta: 'CTA',
  other: 'Other',
}

export function listLayers(canvas: Canvas): LayerInfo[] {
  const objs = canvas
    .getObjects()
    .filter((o) => !o.get('isCover') && !o.get('isBackground') && !o.get('isGuide'))
  return [...objs].reverse().map((obj, i) => {
    const text = obj instanceof IText ? obj.text : ''
    const type = String(obj.type || 'object')
    const isText = type.toLowerCase().includes('text')
    const role = obj.get('receiptRole') as string | undefined
    const group = String(obj.get('receiptGroup') || 'other')
    return {
      id: String(obj.get('receiptId') || `layer-${i}`),
      label: isText
        ? `${role && role !== 'other' ? `[${role}] ` : ''}${(text || 'Text').slice(0, 28)}`
        : type,
      type: isText ? 'text' : type,
      visible: obj.visible !== false,
      locked: Boolean(obj.lockMovementX && obj.lockMovementY),
      object: obj,
      group,
    }
  })
}

export function groupLayers(layers: LayerInfo[]): { id: string; label: string; layers: LayerInfo[] }[] {
  const map = new Map<string, LayerInfo[]>()
  for (const layer of layers) {
    const g = layer.group || 'other'
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(layer)
  }
  const ordered = GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
    id: g,
    label: GROUP_LABEL[g] || g,
    layers: map.get(g)!,
  }))
  for (const [g, list] of map) {
    if (!GROUP_ORDER.includes(g)) {
      ordered.push({ id: g, label: GROUP_LABEL[g] || g, layers: list })
    }
  }
  return ordered
}

export async function duplicateActive(canvas: Canvas) {
  const active = canvas.getActiveObject()
  if (!active || active.get('isBackground') || active.get('isCover')) return null

  const cloned = await active.clone([
    'receiptId',
    'receiptRole',
    'receiptGroup',
    'receiptFieldKey',
    'ocrConfidence',
    'isCover',
    'isBackground',
  ])
  cloned.set({
    left: (cloned.left || 0) + 16,
    top: (cloned.top || 0) + 16,
  })
  if (cloned.get('receiptId')) {
    cloned.set('receiptId', `${cloned.get('receiptId')}-copy-${Date.now()}`)
  }
  canvas.add(cloned)
  canvas.setActiveObject(cloned)
  canvas.requestRenderAll()
  return cloned
}

export function bringForward(canvas: Canvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.bringObjectForward(obj)
  canvas.requestRenderAll()
}

export function sendBackward(canvas: Canvas) {
  const obj = canvas.getActiveObject()
  if (!obj) return
  canvas.sendObjectBackwards(obj)
  const bg = canvas.getObjects().find((o) => o.get('isBackground'))
  if (bg) canvas.sendObjectToBack(bg)
  canvas.requestRenderAll()
}

export function toggleLayerVisibility(obj: FabricObject) {
  obj.set('visible', !obj.visible)
  obj.canvas?.requestRenderAll()
}

export function toggleLayerLock(obj: FabricObject) {
  const locked = !(obj.lockMovementX && obj.lockMovementY)
  obj.set({
    lockMovementX: locked,
    lockMovementY: locked,
    lockRotation: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    selectable: !locked,
  })
  obj.canvas?.requestRenderAll()
}

export function setCanvasZoom(canvas: Canvas, zoom: number, center?: { x: number; y: number }) {
  const z = Math.min(3, Math.max(0.2, zoom))
  const point = center ?? {
    x: canvas.getWidth() / 2,
    y: canvas.getHeight() / 2,
  }
  canvas.zoomToPoint(point as never, z)
  canvas.requestRenderAll()
  return z
}

export function resetZoom(canvas: Canvas) {
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  canvas.requestRenderAll()
  return 1
}

export function fitZoomToContainer(
  canvas: Canvas,
  containerW: number,
  containerH: number,
  padding = 48,
) {
  const cw = canvas.getWidth()
  const ch = canvas.getHeight()
  if (!cw || !ch || !containerW || !containerH) return resetZoom(canvas)
  const zoom = Math.min((containerW - padding) / cw, (containerH - padding) / ch, 1)
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  const z = Math.max(0.2, zoom)
  canvas.setZoom(z)
  const vpt = canvas.viewportTransform
  if (vpt) {
    vpt[4] = (containerW - cw * z) / 2
    vpt[5] = (containerH - ch * z) / 2
    canvas.setViewportTransform(vpt)
  }
  canvas.requestRenderAll()
  return z
}
