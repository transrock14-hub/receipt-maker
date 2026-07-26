/**
 * Control / catalog consistency checks beyond compose geometry.
 * Run: npx tsx scripts/smoke-controls.ts
 */
import { INSTITUTIONS, defaultDeviceFor, getInstitution } from '../src/catalog/institutions'
import { DEVICES, getDevice } from '../src/catalog/devices'
import {
  defaultThemeForInstitution,
  resolveThemeColors,
} from '../src/catalog/screenTheme'
import { FIELD_DEFS } from '../src/types/receipt'
import { composeScreenshot } from '../src/catalog/compose'
import {
  applyCoinQuote,
  formatCryptoAmount,
  parseCryptoAmount,
  resolveNetwork,
} from '../src/catalog/coins'
import { wifiSize } from '../src/catalog/statusIcons'

let passed = 0
let failed = 0
const errors: string[] = []

function check(name: string, fn: () => void) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`)
  }
}

check('FIELD_DEFS groups cover device/account/transaction', () => {
  const groups = new Set(FIELD_DEFS.map((f) => f.group))
  if (!groups.has('device') || !groups.has('account') || !groups.has('transaction')) {
    throw new Error(`missing groups: ${[...groups]}`)
  }
})

for (const inst of INSTITUTIONS) {
  check(`defaultDeviceFor ${inst.id}`, () => {
    const id = defaultDeviceFor(inst.id)
    getDevice(id)
  })

  check(`themes resolve ${inst.id}`, () => {
    const def = defaultThemeForInstitution(inst.id)
    for (const theme of ['light', 'dark'] as const) {
      const colors = resolveThemeColors(inst.id, theme)
      if (!colors.background || !colors.ink || !colors.chromeInk) {
        throw new Error(`incomplete colors for ${theme}`)
      }
      if (!colors.palette.length) throw new Error('empty palette')
    }
    // default theme should match kit-ish behavior
    const c = resolveThemeColors(inst.id, def)
    if (!c.background) throw new Error('default theme empty')
  })

  check(`getInstitution ${inst.id}`, () => {
    const g = getInstitution(inst.id)
    if (g.id !== inst.id) throw new Error('mismatch')
  })
}

check('switching device updates composed name', () => {
  const a = composeScreenshot('s24-ultra', 'binance-withdrawal', {}, 'dark')
  const b = composeScreenshot('iphone-16-pro', 'binance-withdrawal', {}, 'dark')
  if (a.name === b.name) throw new Error('names should differ by device')
  if (!a.name.includes('S24') || !b.name.includes('iPhone')) {
    throw new Error(`unexpected names: ${a.name} / ${b.name}`)
  }
})

check('switching institution updates brand in name', () => {
  const a = composeScreenshot('iphone-16-pro', 'binance-withdrawal', {}, 'dark')
  const b = composeScreenshot('iphone-16-pro', 'coinbase-sent', {}, 'dark')
  if (a.institutionId === b.institutionId) throw new Error('institution stuck')
  if (!a.name.includes('Binance') || !b.name.includes('Coinbase')) {
    throw new Error(`unexpected: ${a.name} / ${b.name}`)
  }
})

check('light/dark change background for binance', () => {
  const light = composeScreenshot('s24-ultra', 'binance-withdrawal', {}, 'light')
  const dark = composeScreenshot('s24-ultra', 'binance-withdrawal', {}, 'dark')
  if (light.canvasJson.background === dark.canvasJson.background) {
    throw new Error('theme did not change background')
  }
})

check('incoming deposit screens use positive amounts', () => {
  for (const id of ['binance-deposit', 'coinbase-received', 'trust-receive', 'metamask-received']) {
    const c = composeScreenshot('s24-ultra', id, {}, 'dark')
    const amt = (c.canvasJson as { objects: Array<Record<string, unknown>> }).objects.find(
      (o) => o.receiptId === 'amountCrypto',
    )
    const text = String(amt?.text || '')
    if (text.startsWith('-')) throw new Error(`${id} amount should be incoming, got ${text}`)
    if (!text.includes('+') && !/^\d/.test(text.trim())) {
      throw new Error(`${id} expected +amount, got ${text}`)
    }
    if (!c.name.toLowerCase().match(/deposit|received|receive/)) {
      throw new Error(`${id} name should look incoming: ${c.name}`)
    }
  }
})

check('resolveNetwork keeps Base / Smart Chain labels', () => {
  if (resolveNetwork('USDT', 'Base').id !== 'base') throw new Error('Base → base')
  if (resolveNetwork('USDT', 'Smart Chain').id !== 'bep20') throw new Error('Smart Chain → bep20')
  if (resolveNetwork('USDT', 'BNB Smart Chain').id !== 'bep20') throw new Error('BNB Smart Chain → bep20')
  const quoted = applyCoinQuote({
    symbol: 'USDT',
    networkLabel: 'Base',
    qty: 45,
    sign: 'none',
    usdPerCoin: 1,
    updateFee: false,
    approxFiat: false,
  })
  if (quoted.network !== 'Base') throw new Error(`kept Base label, got ${quoted.network}`)
  if (quoted.amountCrypto !== '45 USDT') throw new Error(`unsigned sent amount, got ${quoted.amountCrypto}`)
  if (parseCryptoAmount('45 USDT').sign !== 'none') throw new Error('unsigned parse')
  if (formatCryptoAmount(45, 'USDT', 'plus') !== '+45 USDT') throw new Error('plus format')
})

check('trust screens expose CTA field', () => {
  for (const id of ['trust-send', 'trust-receive']) {
    const c = composeScreenshot('iphone-15', id, {}, 'light')
    if (!c.fields.some((f) => f.fieldKey === 'other')) {
      throw new Error(`${id} missing other/CTA field`)
    }
  }
})

check('device list has apple+samsung+google+desktop', () => {
  const makers = new Set(DEVICES.map((d) => d.manufacturer))
  for (const m of ['Apple', 'Samsung', 'Google', 'Microsoft']) {
    if (!makers.has(m)) throw new Error(`missing maker ${m}`)
  }
})

check('charging adds green battery fill + bolt objects', () => {
  const off = composeScreenshot('s24-ultra', 'binance-withdrawal', { charging: '' }, 'dark')
  const on = composeScreenshot('s24-ultra', 'binance-withdrawal', { charging: '1' }, 'dark')
  const objs = (c: typeof on) => (c.canvasJson as { objects: Array<Record<string, unknown>> }).objects
  const fillOff = objs(off).find((o) => o.receiptId === 'battFill')
  const fillOn = objs(on).find((o) => o.receiptId === 'battFill')
  if (fillOn?.fill === fillOff?.fill) throw new Error('charging fill should turn green')
  if (!String(fillOn?.fill).match(/#1E8E3E|#34C759|#4CAF50/i)) {
    throw new Error(`expected green fill, got ${fillOn?.fill}`)
  }
  const bolt = objs(on).find((o) => String(o.receiptId || '') === 'battBolt')
  if (!bolt || String(bolt.type).toLowerCase() !== 'path') {
    throw new Error('expected Path lightning bolt on battery')
  }
  const battText = objs(on).find((o) => o.receiptId === 'battery')
  if (!/^\d+$/.test(String(battText?.text || ''))) {
    throw new Error(`battery % should be digits only, got ${battText?.text}`)
  }
  // iOS shows percentage next to battery
  const ios = composeScreenshot('iphone-16-pro', 'coinbase-received', { battery: '100', charging: '1' }, 'light')
  const iosPct = objs(ios).find((o) => o.receiptId === 'battery')
  if (String(iosPct?.text) !== '100' || Number(iosPct?.opacity ?? 1) < 0.5) {
    throw new Error('iOS should show visible battery percentage')
  }
  const wifi = objs(ios).find((o) => String(o.receiptId || '').startsWith('wfa'))
  if (!wifi || String(wifi.type).toLowerCase() !== 'path') {
    throw new Error('Wi‑Fi should use Path arcs')
  }
  // Solid fill bands (not stroked) — avoid the old center-seam bug
  if (String(wifi.fill || '').includes('rgba(0,0,0,0)') || Number(wifi.strokeWidth || 0) > 0) {
    throw new Error('Wi‑Fi arcs should be solid filled bands, not stroked curves')
  }
  if (wifiSize('oneui').width <= wifiSize('ios').width) {
    throw new Error('One UI Wi‑Fi should be slightly wider than iOS')
  }
  const sam = composeScreenshot('s24-ultra', 'binance-withdrawal', {}, 'dark')
  const samWifi = objs(sam).find((o) => String(o.receiptId || '') === 'wfa0')
  if (!Array.isArray(samWifi?.path)) {
    throw new Error('Wi‑Fi path should be Fabric command array')
  }
})

console.log(`\nControls smoke: ${passed} passed, ${failed} failed`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('All control checks OK')
