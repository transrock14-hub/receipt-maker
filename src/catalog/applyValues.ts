import type { GenerateValues, TemplateField } from '../types/receipt'
import { EMPTY_GENERATE_VALUES } from '../types/receipt'

/**
 * Normalize CTA / explorer copy so truncated “explore” never ships.
 */
export function applyGenerateValuesToCanvasJson(
  canvasJson: Record<string, unknown>,
  fields: TemplateField[],
  values: GenerateValues,
): Record<string, unknown> {
  const json = structuredClone(canvasJson)
  const objects = (json.objects as Array<Record<string, unknown>>) || []
  const byId = new Map(fields.map((f) => [f.id, f]))

  for (const obj of objects) {
    const id = obj.receiptId as string | undefined
    if (!id) continue
    const field = byId.get(id)
    const key = (obj.receiptFieldKey as keyof GenerateValues | undefined) || field?.fieldKey
    if (!key) continue
    const val = values[key]
    if (val != null && String(val).length) {
      // Battery field stores "87" or "87%" — status icons show digits only
      if (key === 'battery') {
        obj.text = String(val).replace('%', '').trim()
      } else if (key === 'other') {
        let text = String(val)
        // Fix common truncation / typo from older demos
        if (/blockchain explore$/i.test(text) && !/explorer$/i.test(text)) {
          text = text.replace(/explore$/i, 'explorer')
        }
        obj.text = text
      } else if (key === 'accountOrIban' || key === 'recipient') {
        let text = String(val).replace(/\s*>\s*$/, '').trim()
        if (text.length > 22 && !text.includes('…') && !text.includes('...')) {
          const keep = 8
          text = `${text.slice(0, keep)}…${text.slice(-keep)}`
        }
        obj.text = text
      } else {
        obj.text = String(val)
      }
    }
  }

  return { ...json, objects }
}

export function mergeGenerateValues(
  base: Partial<GenerateValues> | undefined,
  patch: Partial<GenerateValues>,
): GenerateValues {
  return { ...EMPTY_GENERATE_VALUES, ...base, ...patch }
}
