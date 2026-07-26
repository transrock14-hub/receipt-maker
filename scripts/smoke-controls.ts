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

check('device list has apple+samsung+google+desktop', () => {
  const makers = new Set(DEVICES.map((d) => d.manufacturer))
  for (const m of ['Apple', 'Samsung', 'Google', 'Microsoft']) {
    if (!makers.has(m)) throw new Error(`missing maker ${m}`)
  }
})

console.log(`\nControls smoke: ${passed} passed, ${failed} failed`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('All control checks OK')
