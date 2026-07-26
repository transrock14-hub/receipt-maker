import type { FieldKey, TextRole } from '../types/receipt'

/** Infer structured field keys from OCR text + position (for template binding). */
export function inferFieldKey(
  text: string,
  y: number,
  imageHeight: number,
  role: TextRole,
): FieldKey {
  const t = text.trim()
  const relY = imageHeight > 0 ? y / imageHeight : 0

  if (/^\d{1,2}:\d{2}(\s?[AP]M)?$/i.test(t) && relY < 0.12) return 'time'
  if (/^\d{1,3}%$/.test(t) || /^battery/i.test(t)) return 'battery'
  if (/iphone|android|pixel|samsung|huawei/i.test(t)) return 'phoneType'
  if (/^(5g|4g|lte|wifi|wi-fi|\d+g\+?)$/i.test(t)) return 'network'
  if (/bitcoin|ethereum|solana|visa|mastercard|m-?pesa|paypal/i.test(t) && !/\$/.test(t)) {
    return /bitcoin|ethereum|solana/i.test(t) ? 'network' : 'walletType'
  }
  if (/^(crypto|bank|mobile)\s*(wallet|app)?$/i.test(t)) return 'walletType'
  if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}$/i.test(t.replace(/\s/g, ''))) return 'accountOrIban'
  if (/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/.test(t.replace(/\s/g, ''))) return 'accountOrIban'
  if (/iban|account\s*(no|number|#)?/i.test(t)) return 'accountOrIban'
  if (/^sent\b|^received\b|^payment\b|^transfer\b/i.test(t)) return 'title'
  if (/\bBTC\b|\bETH\b|\bUSDT\b/i.test(t) && /[-+]?\d/.test(t)) return 'amountCrypto'
  if (/^[-+]?\$[\d,]+\.?\d*$/.test(t.replace(/\s/g, ''))) {
    return relY < 0.35 ? 'amountFiat' : /fee/i.test(t) ? 'fee' : 'amountFiat'
  }
  if (/network\s*fee|fee/i.test(t) || (/^\$[\d.]+$/.test(t) && relY > 0.45)) return 'fee'
  if (/^\$[\d,]+\.\d{2}$/.test(t) && relY > 0.35 && relY < 0.55) return 'price'
  if (role === 'date' || /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(t)) {
    return 'date'
  }
  if (/pending|completed|failed|confirmed|success/i.test(t)) return 'status'
  if (/^to\b/i.test(t) || role === 'store') return t.length > 12 ? 'recipient' : 'title'
  if (role === 'total') return 'amountFiat'

  return 'other'
}

export function fieldKeyToRole(key: FieldKey): TextRole {
  switch (key) {
    case 'date':
      return 'date'
    case 'time':
      return 'time'
    case 'phoneType':
      return 'phone'
    case 'battery':
      return 'battery'
    case 'network':
      return 'network'
    case 'walletType':
      return 'wallet'
    case 'accountOrIban':
    case 'recipient':
      return 'account'
    case 'amountCrypto':
    case 'amountFiat':
    case 'fee':
    case 'price':
      return 'total'
    case 'status':
      return 'status'
    case 'title':
      return 'store'
    case 'coin':
      return 'item'
    default:
      return 'other'
  }
}

export function labelForFieldKey(key: FieldKey): string {
  const map: Record<FieldKey, string> = {
    phoneType: 'Phone type',
    time: 'Time',
    battery: 'Battery',
    walletType: 'Wallet / bank type',
    date: 'Date',
    network: 'Chain / network',
    accountOrIban: 'Account / IBAN',
    amountCrypto: 'Crypto amount',
    amountFiat: 'Fiat amount',
    recipient: 'Recipient',
    status: 'Status',
    fee: 'Fee',
    title: 'Title',
    price: 'Price',
    coin: 'Coin',
    other: 'Other',
  }
  return map[key]
}
