import type { Word } from 'tesseract.js'
import { RECEIPT_FONTS } from '../types/receipt'

export function guessFont(
  _words: Word[],
  boxHeight: number,
  text: string,
): { fontFamily: string; fontSize: number; fontWeight: string | number } {
  const fontSize = Math.max(8, Math.min(48, Math.round(boxHeight * 0.9)))
  const compact = text.replace(/\s/g, '')

  // Addresses / long mono strings
  const looksMono =
    /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}$/i.test(compact) ||
    (/TOTAL|SUBTOTAL|TAX|QTY|CHANGE|CASH/i.test(text) && /\d/.test(text))

  const bold =
    /^(Sent|BTC|Pending|TOTAL)/i.test(text.trim()) ||
    /^[\$€£\-]?[\d,]+\.?\d*\s*(BTC)?$/i.test(text.trim())

  return {
    fontFamily: looksMono ? RECEIPT_FONTS[0].value : RECEIPT_FONTS[2].value,
    fontSize,
    fontWeight: bold ? 700 : 400,
  }
}
