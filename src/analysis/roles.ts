import type { TextRole } from '../types/receipt'

const DATE_RE =
  /\b(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})/i

const TOTAL_RE = /\b(total|subtotal|sub\s*total|amount\s*due|balance|grand\s*total|tax|vat|tip|change)\b/i
const MONEY_RE = /[$€£¥]\s?\d|^\d+[.,]\d{2}$/

export function inferRole(text: string, y: number, imageHeight: number): TextRole {
  const t = text.trim()
  const relY = imageHeight > 0 ? y / imageHeight : 0

  if (DATE_RE.test(t) || /\b\d{1,2}:\d{2}\b/.test(t)) return 'date'
  if (TOTAL_RE.test(t) || (MONEY_RE.test(t) && relY > 0.55)) return 'total'
  if (relY < 0.18 && t.length >= 3 && !MONEY_RE.test(t)) return 'store'
  if (MONEY_RE.test(t) || /\s+\d+[.,]\d{2}\s*$/.test(t)) return 'item'

  return 'other'
}
