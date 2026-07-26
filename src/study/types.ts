import type { FieldKey, GenerateValues } from '../types/receipt'

/** A real screenshot uploaded for style study. */
export interface StudyReference {
  id: string
  name: string
  createdAt: string
  /** Full image data URL. */
  dataUrl: string
  /** Small preview for the Study grid. */
  thumbnail: string
  /** Dominant colors from the screenshot. */
  palette: string[]
  /** Likely app background. */
  background: string
  /** Likely status-bar / primary ink. */
  ink: string
  /** Field values inferred via OCR. */
  detectedValues: Partial<GenerateValues>
  /** Short human summary of what was learned. */
  summary: string
  /** Whether this ref is active for Generate. */
  active: boolean
}

export interface StudyInsights {
  palette: string[]
  background: string
  ink: string
  values: Partial<GenerateValues>
  count: number
}

/** Merge active study refs into one style kit for Generate. */
export function mergeStudyInsights(refs: StudyReference[]): StudyInsights | null {
  const active = refs.filter((r) => r.active)
  if (!active.length) return null

  const palette: string[] = []
  const seen = new Set<string>()
  for (const r of active) {
    for (const c of r.palette) {
      const key = c.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      palette.push(c)
      if (palette.length >= 8) break
    }
    if (palette.length >= 8) break
  }

  const values: Partial<GenerateValues> = {}
  const keys: FieldKey[] = [
    'time',
    'battery',
    'date',
    'status',
    'amountCrypto',
    'amountFiat',
    'network',
    'fee',
    'recipient',
    'accountOrIban',
    'title',
    'walletType',
  ]
  for (const key of keys) {
    for (const r of active) {
      const v = r.detectedValues[key]
      if (v != null && String(v).trim()) {
        values[key] = String(v).trim()
        break
      }
    }
  }

  return {
    palette: palette.length ? palette : active[0].palette,
    background: active[0].background,
    ink: active[0].ink,
    values,
    count: active.length,
  }
}
