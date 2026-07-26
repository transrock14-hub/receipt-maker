import type { FieldKey, TextRole } from '../types/receipt'
import { fieldKeyToRole } from '../analysis/fields'

export type FabricObj = Record<string, unknown>

/**
 * Fabric 6+ defaults origin to center. Our catalog treats left/top as the
 * top-left of the bounding box — always set origin explicitly.
 */
const TOP_LEFT = { originX: 'left', originY: 'top' } as const

export function textObj(
  id: string,
  text: string,
  top: number,
  left: number,
  fontSize: number,
  fontWeight: number,
  fieldKey: FieldKey | null,
  fontFamily: string,
  fill: string,
  opts?: { originX?: string; originY?: string; lineHeight?: number; selectable?: boolean },
): FabricObj {
  const role: TextRole = fieldKey ? fieldKeyToRole(fieldKey) : 'other'
  return {
    type: 'IText',
    version: '7.0.0',
    left,
    top,
    text,
    fontSize,
    fontFamily,
    fontWeight,
    fill,
    originX: opts?.originX || 'left',
    originY: opts?.originY || 'top',
    padding: 0,
    lineHeight: opts?.lineHeight ?? 1.15,
    receiptId: id,
    receiptRole: role,
    ...(fieldKey ? { receiptFieldKey: fieldKey } : {}),
    selectable: opts?.selectable !== false,
    editable: opts?.selectable !== false,
  }
}

export function label(
  id: string,
  text: string,
  top: number,
  left: number,
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
  fill: string,
  opts?: { originX?: string },
): FabricObj {
  return textObj(id, text, top, left, fontSize, fontWeight, null, fontFamily, fill, opts)
}

export function rect(
  id: string,
  left: number,
  top: number,
  width: number,
  height: number,
  fill: string,
  radius = 0,
  extra?: FabricObj,
): FabricObj {
  return {
    type: 'Rect',
    version: '7.0.0',
    left,
    top,
    width,
    height,
    fill,
    rx: radius,
    ry: radius,
    strokeWidth: 0,
    ...TOP_LEFT,
    selectable: false,
    evented: false,
    receiptId: id,
    ...extra,
  }
}

export function circle(
  id: string,
  left: number,
  top: number,
  radius: number,
  fill: string,
  extra?: FabricObj,
): FabricObj {
  return {
    type: 'Circle',
    version: '7.0.0',
    left,
    top,
    radius,
    fill,
    strokeWidth: 0,
    ...TOP_LEFT,
    selectable: false,
    evented: false,
    receiptId: id,
    ...extra,
  }
}

export function strokedRect(
  id: string,
  left: number,
  top: number,
  width: number,
  height: number,
  stroke: string,
  radius = 2,
  strokeWidth = 1.15,
): FabricObj {
  return {
    type: 'Rect',
    version: '7.0.0',
    left,
    top,
    width,
    height,
    fill: 'rgba(0,0,0,0)',
    stroke,
    strokeWidth,
    strokeUniform: true,
    rx: radius,
    ry: radius,
    ...TOP_LEFT,
    selectable: false,
    evented: false,
    receiptId: id,
    receiptGroup: 'chrome',
  }
}
