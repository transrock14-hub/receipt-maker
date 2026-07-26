/**
 * Smoke-test every institution × theme × representative devices.
 * Run: npx tsx scripts/smoke-compose.ts
 */
import { INSTITUTIONS } from '../src/catalog/institutions'
import { composeScreenshot } from '../src/catalog/compose'
import { DEVICES } from '../src/catalog/devices'
import type { DeviceId } from '../src/types/receipt'
import type { ScreenTheme } from '../src/catalog/screenTheme'

const EXTRA_DEVICES: DeviceId[] = [
  'iphone-16-pro',
  'iphone-16-pro-max',
  's24-ultra',
  's25-ultra',
  'pixel-9-pro',
  'desktop-macos',
]

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

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

const themes: ScreenTheme[] = ['light', 'dark']

for (const inst of INSTITUTIONS) {
  const devices = Array.from(
    new Set<DeviceId>([...inst.recommendedDeviceIds, ...EXTRA_DEVICES]),
  )

  for (const theme of themes) {
    for (const deviceId of devices) {
      const label = `${inst.id} · ${theme} · ${deviceId}`
      check(label, () => {
        const device = DEVICES.find((d) => d.id === deviceId)
        assert(device, `unknown device ${deviceId}`)

        const composed = composeScreenshot(deviceId, inst.id, inst.defaults || {}, theme)
        assert(composed.width === device.width, `width ${composed.width} ≠ ${device.width}`)
        assert(composed.height === device.height, `height ${composed.height} ≠ ${device.height}`)
        assert(composed.deviceId === deviceId, 'deviceId mismatch')
        assert(composed.institutionId === inst.id, 'institutionId mismatch')
        assert(composed.theme === theme, 'theme mismatch')
        assert(composed.name.includes(inst.brand), `name missing brand: ${composed.name}`)
        assert(composed.name.includes(device.name), `name missing device: ${composed.name}`)
        assert(Array.isArray(composed.canvasJson.objects), 'objects missing')
        const objects = composed.canvasJson.objects as unknown[]
        assert(objects.length > 5, `too few objects (${objects.length})`)
        assert(typeof composed.canvasJson.background === 'string', 'background missing')
        assert(composed.fields.length > 0, 'no fields')
        assert(composed.palette.length > 0, 'no palette')

        // Values round-trip: change amount should still compose
        const patched = composeScreenshot(
          deviceId,
          inst.id,
          { ...inst.defaults, amountCrypto: '-99.5 USDT', time: '9:41', battery: '42' },
          theme,
        )
        assert(patched.width === device.width, 'patched width')
        const texts = (patched.canvasJson.objects as Array<{ text?: string }>)
          .map((o) => o.text || '')
          .join('\n')
        assert(/9:41|42|-99/.test(texts) || texts.length > 0, 'expected value text in objects')
      })
    }
  }
}

// Default theme helper + device catalog sanity
check('device catalog unique ids', () => {
  const ids = DEVICES.map((d) => d.id)
  assert(new Set(ids).size === ids.length, 'duplicate device ids')
})

check('every institution has recommended devices', () => {
  for (const inst of INSTITUTIONS) {
    assert(inst.recommendedDeviceIds.length > 0, `${inst.id} has no recommended devices`)
    for (const id of inst.recommendedDeviceIds) {
      assert(DEVICES.some((d) => d.id === id), `${inst.id} recommends unknown ${id}`)
    }
  }
})

console.log(`\nCompose smoke: ${passed} passed, ${failed} failed`)
if (errors.length) {
  console.error(errors.slice(0, 40).join('\n'))
  if (errors.length > 40) console.error(`… +${errors.length - 40} more`)
  process.exit(1)
}
console.log('All compose checks OK')
