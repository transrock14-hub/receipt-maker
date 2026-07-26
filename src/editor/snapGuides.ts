import type { Canvas, FabricObject } from 'fabric'
import { Line } from 'fabric'

const GUIDE_COLOR = '#ff2d78'

export class SnapGuides {
  private canvas: Canvas
  private lines: Line[] = []
  private threshold = 4
  private enabled = true

  constructor(canvas: Canvas) {
    this.canvas = canvas
    this.bind()
  }

  setEnabled(v: boolean) {
    this.enabled = v
    if (!v) this.clear()
  }

  dispose() {
    this.canvas.off('object:moving')
    this.canvas.off('object:scaling')
    this.canvas.off('mouse:up')
    this.clear()
  }

  private bind() {
    this.canvas.on('object:moving', (e) => {
      if (!this.enabled || !e.target) return
      this.snap(e.target)
    })
    this.canvas.on('object:scaling', (e) => {
      if (!this.enabled || !e.target) return
      this.snap(e.target, true)
    })
    this.canvas.on('mouse:up', () => this.clear())
  }

  private clear() {
    this.lines.forEach((l) => this.canvas.remove(l))
    this.lines = []
    this.canvas.requestRenderAll()
  }

  private drawV(x: number) {
    const line = new Line([x, 0, x, this.canvas.getHeight()], {
      stroke: GUIDE_COLOR,
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0.9,
    })
    line.set('isGuide', true)
    this.canvas.add(line)
    this.lines.push(line)
  }

  private drawH(y: number) {
    const line = new Line([0, y, this.canvas.getWidth(), y], {
      stroke: GUIDE_COLOR,
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0.9,
    })
    line.set('isGuide', true)
    this.canvas.add(line)
    this.lines.push(line)
  }

  private snap(obj: FabricObject, scaling = false) {
    this.clear()
    if (obj.get('isBackground') || obj.get('isGuide') || obj.get('isCover')) return

    const bound = obj.getBoundingRect()
    const cw = this.canvas.getWidth()
    const ch = this.canvas.getHeight()
    const t = this.threshold

    const centers = {
      x: bound.left + bound.width / 2,
      y: bound.top + bound.height / 2,
    }

    // Canvas center + edges
    const vTargets = [0, cw / 2, cw]
    const hTargets = [0, ch / 2, ch]

    // Other object edges/centers
    for (const other of this.canvas.getObjects()) {
      if (other === obj || other.get('isGuide') || other.get('isCover') || other.get('isBackground')) {
        continue
      }
      if (!other.visible) continue
      const b = other.getBoundingRect()
      vTargets.push(b.left, b.left + b.width / 2, b.left + b.width)
      hTargets.push(b.top, b.top + b.height / 2, b.top + b.height)
    }

    let dx = 0
    let dy = 0
    let snappedV = false
    let snappedH = false

    // Vertical snap (left, center, right of moving object)
    const vPoints = [
      { pos: bound.left, anchor: 'left' as const },
      { pos: centers.x, anchor: 'center' as const },
      { pos: bound.left + bound.width, anchor: 'right' as const },
    ]
    for (const vp of vPoints) {
      for (const target of vTargets) {
        if (Math.abs(vp.pos - target) <= t) {
          if (vp.anchor === 'left') dx = target - bound.left
          else if (vp.anchor === 'center') dx = target - centers.x
          else dx = target - (bound.left + bound.width)
          this.drawV(target)
          snappedV = true
          break
        }
      }
      if (snappedV) break
    }

    const hPoints = [
      { pos: bound.top, anchor: 'top' as const },
      { pos: centers.y, anchor: 'center' as const },
      { pos: bound.top + bound.height, anchor: 'bottom' as const },
    ]
    for (const hp of hPoints) {
      for (const target of hTargets) {
        if (Math.abs(hp.pos - target) <= t) {
          if (hp.anchor === 'top') dy = target - bound.top
          else if (hp.anchor === 'center') dy = target - centers.y
          else dy = target - (bound.top + bound.height)
          this.drawH(target)
          snappedH = true
          break
        }
      }
      if (snappedH) break
    }

    if (!scaling && (dx || dy)) {
      obj.set({
        left: (obj.left || 0) + dx,
        top: (obj.top || 0) + dy,
      })
      obj.setCoords()
    }
  }
}
