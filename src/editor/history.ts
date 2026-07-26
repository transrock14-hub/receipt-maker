import type { Canvas } from 'fabric'
import { CUSTOM_PROPS } from '../types/receipt'

const PROPS = [...CUSTOM_PROPS]
const MAX = 40

export class EditorHistory {
  private undoStack: string[] = []
  private redoStack: string[] = []
  private locked = false
  private canvas: Canvas | null = null

  attach(canvas: Canvas) {
    this.canvas = canvas
    this.undoStack = []
    this.redoStack = []
    this.save()
  }

  save() {
    if (!this.canvas || this.locked) return
    const raw = this.canvas.toObject(PROPS as string[]) as {
      objects?: Array<Record<string, unknown>>
    }
    if (Array.isArray(raw.objects)) {
      raw.objects = raw.objects.filter((o) => !o.isGuide)
    }
    const json = JSON.stringify(raw)
    const last = this.undoStack[this.undoStack.length - 1]
    if (json === last) return
    this.undoStack.push(json)
    if (this.undoStack.length > MAX) this.undoStack.shift()
    this.redoStack = []
  }

  get canUndo() {
    return this.undoStack.length > 1
  }

  get canRedo() {
    return this.redoStack.length > 0
  }

  async undo() {
    if (!this.canvas || this.undoStack.length <= 1) return
    const current = this.undoStack.pop()!
    this.redoStack.push(current)
    const prev = this.undoStack[this.undoStack.length - 1]
    await this.restore(prev)
  }

  async redo() {
    if (!this.canvas || !this.redoStack.length) return
    const next = this.redoStack.pop()!
    this.undoStack.push(next)
    await this.restore(next)
  }

  private async restore(json: string) {
    if (!this.canvas) return
    this.locked = true
    const data = JSON.parse(json) as Record<string, unknown>
    const w = this.canvas.getWidth()
    const h = this.canvas.getHeight()
    await this.canvas.loadFromJSON(data)
    this.canvas.setDimensions({ width: w, height: h })
    this.canvas.requestRenderAll()
    this.locked = false
  }
}
