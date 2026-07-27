/**
 * Headless render of a composed screenshot to PNG for visual comparison.
 * Run: npx tsx scripts/render-screen.ts <institutionId> <deviceId> <outPath>
 */
import { writeFileSync } from 'node:fs'
import { StaticCanvas } from 'fabric/node'
import { composeScreenshot } from '../src/catalog/compose'
import { INSTITUTIONS } from '../src/catalog/institutions'

const [instId = 'revolut-payment', deviceId = 'iphone-16-pro', out = 'render.png'] =
  process.argv.slice(2)

const inst = INSTITUTIONS.find((i) => i.id === instId)
if (!inst) throw new Error(`unknown institution ${instId}`)

const composed = composeScreenshot(deviceId as never, inst.id, inst.defaults || {}, 'dark')

const canvas = new StaticCanvas(undefined, {
  width: composed.width,
  height: composed.height,
  enableRetinaScaling: false,
})

await canvas.loadFromJSON(composed.canvasJson)
canvas.renderAll()

const buf = Buffer.from(
  canvas.toDataURL({ format: 'png', multiplier: 1 }).split(',')[1],
  'base64',
)
writeFileSync(out, buf)
console.log(`wrote ${out} (${composed.width}x${composed.height}, ${buf.length} bytes)`)
