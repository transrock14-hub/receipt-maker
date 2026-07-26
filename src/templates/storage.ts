/** @deprecated use db.ts / catalog — kept for leftover imports */
export {
  listTemplates as loadTemplates,
  upsertTemplate,
  deleteTemplate,
  applyGenerateValuesToCanvasJson,
} from './db'
export { BINANCE_DEFAULTS as BINANCE_USDT_45_VALUES } from '../catalog/screens/binance'
export { composeScreenshot, buildCatalogTemplates } from '../catalog/compose'

import { v4 as uuid } from 'uuid'
import type { ReceiptTemplate, TemplateField } from '../types/receipt'

export function templateFromCanvas(opts: {
  name: string
  width: number
  height: number
  canvasJson: Record<string, unknown>
  backgroundDataUrl?: string
  thumbnail?: string
  palette: string[]
  fields: TemplateField[]
  category?: ReceiptTemplate['category']
}): ReceiptTemplate {
  return {
    id: uuid(),
    name: opts.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    width: opts.width,
    height: opts.height,
    backgroundDataUrl: opts.backgroundDataUrl,
    thumbnail: opts.thumbnail,
    canvasJson: opts.canvasJson,
    fields: opts.fields,
    palette: opts.palette,
    category: opts.category || 'custom',
  }
}
