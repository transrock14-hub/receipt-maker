/** Tiny catalog card thumbnails from brand color + name (no Fabric required). */
export function catalogThumbnail(bg: string, brand: string, accent?: string): string {
  const w = 120
  const h = 168
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = bg || '#181A20'
  ctx.fillRect(0, 0, w, h)
  // Status bar strip
  ctx.fillStyle = accent || 'rgba(255,255,255,0.12)'
  ctx.fillRect(0, 0, w, 14)
  // Fake amount block
  ctx.fillStyle = accent || '#F0B90B'
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.arc(w / 2, 52, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = isLight(bg) ? '#1a1a1e' : '#EAECEF'
  ctx.font = '600 11px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(brand.slice(0, 14), w / 2, 90)
  ctx.globalAlpha = 0.55
  ctx.fillRect(18, 108, w - 36, 6)
  ctx.fillRect(18, 122, w - 52, 6)
  ctx.fillRect(18, 136, w - 44, 6)
  ctx.globalAlpha = 1
  return c.toDataURL('image/jpeg', 0.82)
}

function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return false
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}
