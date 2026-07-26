/**
 * Device-framed screenshot export — inspired by Mobile FIRST / Mobile simulator
 * (https://chrome.google.com/webstore/detail/simulateur-mobile/ckejmhbmlajgoklhgbapkiccekfoccmk):
 * capture screen-only OR wrap content in a realistic device body on a transparent PNG.
 */
import type { Canvas } from 'fabric'
import type { DeviceId, DeviceProfile } from '../types/receipt'
import { getDevice } from './devices'

export type ScreenshotMode = 'screen' | 'framed'

/** Optional 1px film grain so exports feel less “perfect vector”. */
function applyFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number, amount = 0.035) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue
    const n = (Math.random() - 0.5) * 255 * amount
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawPhoneBezel(
  ctx: CanvasRenderingContext2D,
  device: DeviceProfile,
  scale: number,
  screenImg: HTMLImageElement | HTMLCanvasElement,
) {
  const b = device.bezel
  const frame = b.frame * scale
  const topChin = b.topChin * scale
  const bottomChin = b.bottomChin * scale
  const screenW = device.width * scale
  const screenH = device.height * scale
  const bodyW = screenW + frame * 2
  const bodyH = screenH + frame * 2 + topChin + bottomChin
  const bodyR = b.bodyRadius * scale
  const screenR = b.screenRadius * scale
  const screenX = frame
  const screenY = frame + topChin

  // Soft presentation shadow (Mobile FIRST mockup style)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 36 * scale
  ctx.shadowOffsetY = 14 * scale
  roundRect(ctx, 0, 0, bodyW, bodyH, bodyR)
  ctx.fillStyle = b.bodyColor
  ctx.fill()
  ctx.restore()

  // Body fill
  roundRect(ctx, 0, 0, bodyW, bodyH, bodyR)
  ctx.fillStyle = b.bodyColor
  ctx.fill()

  // Thin metallic rim (cleaner than thick stroke)
  roundRect(ctx, 0.75 * scale, 0.75 * scale, bodyW - 1.5 * scale, bodyH - 1.5 * scale, bodyR - 0.75 * scale)
  ctx.strokeStyle = b.rimColor
  ctx.lineWidth = 1 * scale
  ctx.stroke()

  // Side buttons — volume (left) + power (right), subtle like hardware mockups
  if (device.platform !== 'desktop' && device.id !== 'iphone-se') {
    const btnFill = b.rimColor
    // Volume rocker
    roundRect(ctx, -1.5 * scale, bodyH * 0.22, 1.5 * scale, 28 * scale, 0.75 * scale)
    ctx.fillStyle = btnFill
    ctx.fill()
    roundRect(ctx, -1.5 * scale, bodyH * 0.22 + 32 * scale, 1.5 * scale, 18 * scale, 0.75 * scale)
    ctx.fill()
    // Power
    roundRect(ctx, bodyW, bodyH * 0.28, 1.5 * scale, 36 * scale, 0.75 * scale)
    ctx.fill()
  }

  // iPhone SE home button
  if (device.id === 'iphone-se' && bottomChin > 0) {
    const btnR = 18 * scale
    const cx = bodyW / 2
    const cy = screenY + screenH + bottomChin / 2
    ctx.beginPath()
    ctx.arc(cx, cy, btnR, 0, Math.PI * 2)
    ctx.strokeStyle = b.rimColor
    ctx.lineWidth = 2 * scale
    ctx.stroke()
  }

  // Screen clip + content
  ctx.save()
  roundRect(ctx, screenX, screenY, screenW, screenH, screenR)
  ctx.clip()
  ctx.drawImage(screenImg, screenX, screenY, screenW, screenH)
  ctx.restore()

  // Hairline inner screen edge
  roundRect(ctx, screenX, screenY, screenW, screenH, screenR)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1 * scale
  ctx.stroke()
}

function drawDesktopBezel(
  ctx: CanvasRenderingContext2D,
  device: DeviceProfile,
  scale: number,
  screenImg: HTMLImageElement | HTMLCanvasElement,
) {
  const b = device.bezel
  const frame = b.frame * scale
  const screenW = device.width * scale
  const screenH = device.height * scale
  const bodyW = screenW + frame * 2
  const bodyH = screenH + frame * 2
  const bodyR = b.bodyRadius * scale

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 24 * scale
  ctx.shadowOffsetY = 10 * scale
  roundRect(ctx, 0, 0, bodyW, bodyH, bodyR)
  ctx.fillStyle = b.bodyColor
  ctx.fill()
  ctx.restore()

  roundRect(ctx, 0, 0, bodyW, bodyH, bodyR)
  ctx.fillStyle = b.bodyColor
  ctx.fill()

  ctx.drawImage(screenImg, frame, frame, screenW, screenH)
}

async function canvasToImage(canvas: Canvas, multiplier: number): Promise<HTMLImageElement> {
  const dataUrl = canvas.toDataURL({
    format: 'png',
    multiplier,
    enableRetinaScaling: false,
  })
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

function canvasToBlob(el: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    el.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not create PNG'))
    }, 'image/png')
  })
}

/**
 * Render screen-only or framed device mockup to an offscreen canvas.
 */
export async function renderDeviceScreenshot(
  canvas: Canvas,
  deviceId: DeviceId,
  mode: ScreenshotMode = 'screen',
  opts?: { grain?: boolean },
): Promise<HTMLCanvasElement> {
  const device = getDevice(deviceId)
  const multiplier = Math.min(3, Math.max(1.5, device.dpr))
  const grain = opts?.grain

  if (mode === 'screen') {
    const el = canvas.toCanvasElement(multiplier)
    if (grain) {
      const g = el.getContext('2d')
      if (g) applyFilmGrain(g, el.width, el.height)
    }
    return el
  }

  const screenImg = await canvasToImage(canvas, multiplier)
  const scale = multiplier
  const b = device.bezel
  const frame = b.frame * scale
  const topChin = b.topChin * scale
  const bottomChin = b.bottomChin * scale
  const screenW = device.width * scale
  const screenH = device.height * scale
  const sidePad = device.platform === 'desktop' ? 0 : Math.ceil(4 * scale)
  const bodyW = screenW + frame * 2
  const bodyH = screenH + frame * 2 + topChin + bottomChin
  const outW = Math.ceil(bodyW + sidePad * 2)
  const outH = Math.ceil(bodyH)

  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas unsupported')

  ctx.clearRect(0, 0, outW, outH)
  ctx.translate(sidePad, 0)

  if (device.platform === 'desktop') {
    drawDesktopBezel(ctx, device, scale, screenImg)
  } else {
    drawPhoneBezel(ctx, device, scale, screenImg)
  }

  if (grain) applyFilmGrain(ctx, outW, outH, 0.028)
  return out
}

/**
 * Export like Mobile FIRST:
 * - `screen`: content only at device DPR
 * - `framed`: device body mockup on transparent PNG
 */
export async function exportDeviceScreenshot(
  canvas: Canvas,
  deviceId: DeviceId,
  mode: ScreenshotMode = 'screen',
  filename?: string,
  opts?: { grain?: boolean },
): Promise<void> {
  const device = getDevice(deviceId)
  const stamp = Date.now()
  const baseName = filename || `${device.id}-screenshot-${stamp}.png`
  const out = await renderDeviceScreenshot(canvas, deviceId, mode, opts)
  const name =
    mode === 'framed' && !baseName.includes('-framed')
      ? baseName.replace(/\.png$/i, '-framed.png')
      : baseName
  downloadDataUrl(out.toDataURL('image/png'), name)
}

/** Copy rendered screenshot PNG to the system clipboard. */
export async function copyDeviceScreenshot(
  canvas: Canvas,
  deviceId: DeviceId,
  mode: ScreenshotMode = 'screen',
  opts?: { grain?: boolean },
): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard image copy is not supported in this browser')
  }
  const out = await renderDeviceScreenshot(canvas, deviceId, mode, opts)
  const blob = await canvasToBlob(out)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

/** Framed preview data URL for the Generated panel (lower res). */
export async function previewFramedScreenshot(
  canvas: Canvas,
  deviceId: DeviceId,
  previewScale = 1.25,
): Promise<string | null> {
  const device = getDevice(deviceId)
  const screenImg = await canvasToImage(canvas, previewScale)
  const scale = previewScale
  const b = device.bezel
  const frame = b.frame * scale
  const topChin = b.topChin * scale
  const bottomChin = b.bottomChin * scale
  const screenW = device.width * scale
  const screenH = device.height * scale
  const sidePad = device.platform === 'desktop' ? 0 : Math.ceil(4 * scale)
  const bodyW = screenW + frame * 2
  const bodyH = screenH + frame * 2 + topChin + bottomChin
  const outW = Math.ceil(bodyW + sidePad * 2)
  const outH = Math.ceil(bodyH)
  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const ctx = out.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, outW, outH)
  ctx.translate(sidePad, 0)
  if (device.platform === 'desktop') {
    drawDesktopBezel(ctx, device, scale, screenImg)
  } else {
    drawPhoneBezel(ctx, device, scale, screenImg)
  }
  return out.toDataURL('image/png')
}
