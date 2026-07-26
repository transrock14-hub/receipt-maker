import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Canvas, FabricObject } from 'fabric'
import { IText } from 'fabric'
import { EditorCanvas } from './components/EditorCanvas'
import { Toolbar } from './components/Toolbar'
import { Sidebar } from './components/Sidebar'
import { PropertyPanel } from './components/PropertyPanel'
import { FloatingBar } from './components/FloatingBar'
import { ScreenshotStage } from './components/ScreenshotStage'
import { analyzeReceiptImage } from './analysis/ocr'
import {
  addBlankText,
  applyImageAdjustments,
  applyOcrLayers,
  canvasToJson,
  cropCanvasToSelection,
  deleteActive,
  getSelectedProps,
  loadCanvasJson,
  loadImageAsBackground,
  rotateBackground,
  updateSelectedText,
} from './editor/canvasOps'
import { EditorHistory } from './editor/history'
import { SnapGuides } from './editor/snapGuides'
import {
  bringForward,
  duplicateActive,
  listLayers,
  sendBackward,
  toggleLayerLock,
  toggleLayerVisibility,
  type LayerInfo,
} from './editor/layers'
import {
  createProjectDraft,
  deleteProject,
  deleteStudy,
  deleteTemplate,
  ensureBinanceUsdtDemo,
  listProjects,
  listStudies,
  listTemplates,
  saveProject,
  setStudyActive,
  upsertStudy,
  upsertTemplate,
} from './templates/db'
import { templateFromCanvas } from './templates/storage'
import { useToast } from './ui/Toast'
import { ShortcutsModal } from './ui/ShortcutsModal'
import { composeScreenshot } from './catalog/compose'
import {
  exportDeviceScreenshot,
  copyDeviceScreenshot,
  previewFramedScreenshot,
  type ScreenshotMode,
} from './catalog/deviceFrame'
import { getDevice } from './catalog/devices'
import { getInstitution, defaultDeviceFor } from './catalog/institutions'
import { BINANCE_DEFAULTS } from './catalog/screens/binance'
import { applyStudyPaletteToCanvasJson, studyScreenshot } from './study/analyzeReference'
import { mergeStudyInsights } from './study/types'
import type { StudyReference } from './study/types'
import type { ReceiptStyleKit } from './study/styleKits'
import { styleKitForInstitution } from './study/styleKits'
import { labelForFieldKey } from './analysis/fields'
import {
  defaultThemeForInstitution,
  type ScreenTheme,
} from './catalog/screenTheme'
import type {
  DeviceId,
  FieldKey,
  GenerateValues,
  ReceiptTemplate,
  SavedProject,
  SelectedObjectProps,
  TemplateField,
  TextRole,
} from './types/receipt'
import { EMPTY_GENERATE_VALUES } from './types/receipt'
import { useAuth } from './auth/AuthContext'
import { api } from './auth/api'
import './App.css'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

type AppProps = {
  onOpenBilling?: () => void
  onOpenAdmin?: () => void
}

function App({ onOpenBilling, onOpenAdmin }: AppProps) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const canDownload = Boolean(user?.access.can_download)
  const canvasRef = useRef<Canvas | null>(null)
  const historyRef = useRef(new EditorHistory())
  const snapRef = useRef<SnapGuides | null>(null)
  const imageDataUrlRef = useRef<string | null>(null)
  const imageScaleRef = useRef(1)
  const hideOriginalRef = useRef(true)
  const lastAnalysisRef = useRef<Awaited<ReturnType<typeof analyzeReceiptImage>> | null>(null)
  const shouldAutoSaveRef = useRef(false)

  const [hasImage, setHasImage] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState('')
  const [status, setStatus] = useState('Drop a receipt to start — Magic Edit runs automatically.')
  const [palette, setPalette] = useState<string[]>([])
  const [selected, setSelected] = useState<SelectedObjectProps | null>(null)
  const [floatAnchor, setFloatAnchor] = useState<{ x: number; y: number } | null>(null)
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([])
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [activeTemplate, setActiveTemplate] = useState<ReceiptTemplate | null>(null)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [generateValues, setGenerateValues] = useState<GenerateValues>({ ...EMPTY_GENERATE_VALUES })
  const [deviceId, setDeviceId] = useState<DeviceId>('s24-ultra')
  const [institutionId, setInstitutionId] = useState('binance-withdrawal')
  const [screenTheme, setScreenTheme] = useState<ScreenTheme>('dark')
  const [screenshotMode, setScreenshotMode] = useState<ScreenshotMode>('screen')
  const [exportGrain, setExportGrain] = useState(false)
  const [hideOriginal, setHideOriginal] = useState(true)
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [selectionTick, setSelectionTick] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [studies, setStudies] = useState<StudyReference[]>([])
  const [studying, setStudying] = useState(false)
  const [studyProgress, setStudyProgress] = useState('')
  const [composeLive, setComposeLive] = useState(true)
  const [composing, setComposing] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [bootReady, setBootReady] = useState(false)
  const [showFrame, setShowFrame] = useState(false)
  const [framedPreviewUrl, setFramedPreviewUrl] = useState<string | null>(null)
  const [propsOpen, setPropsOpen] = useState(false)
  const skipNextAutosaveRef = useRef(false)
  const composeGenRef = useRef(0)
  const composeChainRef = useRef(Promise.resolve())
  const composeLatestRef = useRef({
    deviceId,
    institutionId,
    screenTheme,
    generateValues,
    studies,
    templates,
    showFrame,
  })
  composeLatestRef.current = {
    deviceId,
    institutionId,
    screenTheme,
    generateValues,
    studies,
    templates,
    showFrame,
  }

  hideOriginalRef.current = hideOriginal

  const generateFieldKeys = useMemo(() => {
    try {
      const composed = composeScreenshot(deviceId, institutionId, {}, screenTheme)
      const keys = composed.fields.map((f) => f.fieldKey)
      // Always include status-bar fields
      for (const k of ['time', 'battery'] as FieldKey[]) {
        if (!keys.includes(k)) keys.push(k)
      }
      return keys
    } catch {
      return undefined
    }
  }, [deviceId, institutionId, screenTheme])

  const pendingDemoRef = useRef<SavedProject | null>(null)

  // Load library + seed Binance · S24 Ultra · 45 USDT demo receipt
  useEffect(() => {
    void (async () => {
      const demo = await ensureBinanceUsdtDemo()
      const [tpls, projs, refs] = await Promise.all([
        listTemplates(),
        listProjects(),
        listStudies(),
      ])
      setTemplates(tpls)
      setProjects(projs)
      setStudies(refs)
      const binance =
        tpls.find((t) => t.id === 'catalog-binance-withdrawal-s24-ultra') || tpls[0] || null
      setActiveTemplate(binance)
      setGenerateValues({ ...EMPTY_GENERATE_VALUES, ...BINANCE_DEFAULTS, amountCrypto: '-45 USDT' })
      setDeviceId('s24-ultra')
      setInstitutionId('binance-withdrawal')
      pendingDemoRef.current = demo
      const canvas = canvasRef.current
      if (canvas) {
        pendingDemoRef.current = null
        await loadCanvasJson(canvas, demo.canvasJson, demo.width, demo.height)
        imageDataUrlRef.current = demo.originalDataUrl || null
        setHasImage(true)
        setPalette(demo.palette)
        setZoom(0.85)
        setCurrentProjectId(demo.id)
        historyRef.current.save()
        setStatus('Catalog ready — Binance · S24 Ultra · live Generate preview')
        setSelectionTick((t) => t + 1)
        setBootReady(true)
        window.setTimeout(() => {
          const c = canvasRef.current
          if (!c || c.getObjects().length === 0) return
          const active = c.getActiveObject()
          const guides = c.getObjects().filter((o) => o.get('isGuide'))
          guides.forEach((g) => g.set('visible', false))
          c.discardActiveObject()
          c.requestRenderAll()
          guides.forEach((g) => g.set('visible', true))
          if (active) c.setActiveObject(active)
          c.requestRenderAll()
        }, 50)
      } else {
        setBootReady(true)
      }
    })()
  }, [])

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.canUndo)
    setCanRedo(historyRef.current.canRedo)
  }, [])

  const refreshSelection = useCallback(() => {
    setSelectionTick((t) => t + 1)
  }, [])

  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      setLayers([])
      return
    }
    setLayers(listLayers(canvas))
  }, [])

  const refreshGenerated = useCallback(() => {
    canvasRef.current?.requestRenderAll()
  }, [])

  const applyComposeToCanvas = useCallback(
    async (opts?: { silent?: boolean; soft?: boolean }) => {
      const gen = ++composeGenRef.current

      const run = async () => {
        // Superseded while waiting in the queue
        if (gen !== composeGenRef.current) return null

        const canvas = canvasRef.current
        if (!canvas) return null

        // Always compose from the latest selection when our turn runs
        const {
          deviceId: composeDevice,
          institutionId: composeInstitution,
          generateValues: values,
          screenTheme: theme,
          studies: studyList,
          templates: tpls,
          showFrame: framed,
        } = composeLatestRef.current

        const soft = Boolean(opts?.soft)
        const insights = mergeStudyInsights(studyList)
        let composed = composeScreenshot(composeDevice, composeInstitution, values, theme)
        if (insights) {
          composed = {
            ...composed,
            canvasJson: applyStudyPaletteToCanvasJson(composed.canvasJson, insights),
            palette: insights.palette.length ? insights.palette : composed.palette,
          }
        }
        const tplId = `catalog-${composeInstitution}-${composeDevice}`
        const tpl =
          tpls.find((t) => t.id === tplId) ||
          ({
            id: tplId,
            name: composed.name,
            createdAt: new Date().toISOString(),
            width: composed.width,
            height: composed.height,
            canvasJson: composed.canvasJson,
            fields: composed.fields,
            palette: composed.palette,
            isStarter: true,
            category: getInstitution(composeInstitution).category,
            deviceId: composeDevice,
            institutionId: composeInstitution,
          } satisfies ReceiptTemplate)

        if (gen !== composeGenRef.current) return null

        setActiveTemplate(tpl)
        skipNextAutosaveRef.current = true
        await loadCanvasJson(canvas, composed.canvasJson, composed.width, composed.height)

        // Another compose won — do not touch status/frame; queue will apply latest next
        if (gen !== composeGenRef.current) return null

        // Selection changed during load — re-queue with latest instead of publishing mismatch
        const latest = composeLatestRef.current
        if (
          latest.deviceId !== composeDevice ||
          latest.institutionId !== composeInstitution ||
          latest.screenTheme !== theme
        ) {
          void applyComposeToCanvas(opts)
          return null
        }

        imageDataUrlRef.current = null
        setHasImage(true)
        setPalette(composed.palette)
        // Keep zoom stable while typing fields — only snap on device/layout changes
        if (!soft) {
          setZoom(composeDevice.startsWith('desktop') ? 0.45 : 0.85)
        }
        lastAnalysisRef.current = null
        if (!soft) {
          historyRef.current.save()
          syncHistoryFlags()
        }
        refreshLayers()
        refreshSelection()
        if (framed) {
          const url = await previewFramedScreenshot(canvas, composeDevice, 1.1)
          if (gen !== composeGenRef.current) return null
          if (composeLatestRef.current.deviceId !== composeDevice) return null
          setFramedPreviewUrl(url)
        } else {
          setFramedPreviewUrl(null)
        }
        if (!opts?.silent) {
          const studyNote = insights ? ` · study ×${insights.count}` : ''
          setStatus(`Live · ${composed.name}${studyNote}`)
        }
        return composed
      }

      const next = composeChainRef.current.then(run, run)
      composeChainRef.current = next.then(
        () => undefined,
        () => undefined,
      )
      return next
    },
    [syncHistoryFlags, refreshLayers, refreshSelection],
  )

  const pushHistory = useCallback(() => {
    historyRef.current.save()
    syncHistoryFlags()
    refreshLayers()
    // Debounced-feel: refresh preview after history push
    window.setTimeout(() => refreshGenerated(), 40)
  }, [refreshGenerated, refreshLayers, syncHistoryFlags])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const active = canvas.getActiveObject() as FabricObject | undefined
    setSelected(getSelectedProps(active))
    refreshLayers()

    if (active && !active.get('isBackground')) {
      const bound = active.getBoundingRect()
      setFloatAnchor({
        x: (bound.left + bound.width / 2) * zoom,
        y: bound.top * zoom - 12,
      })
    } else {
      setFloatAnchor(null)
    }
  }, [selectionTick, refreshLayers, zoom])

  const handleReady = useCallback((canvas: Canvas) => {
    canvasRef.current = canvas
    historyRef.current.attach(canvas)
    snapRef.current?.dispose()
    snapRef.current = new SnapGuides(canvas)

    const onModify = (e?: { target?: FabricObject }) => {
      if (e?.target?.get?.('isGuide')) return
      historyRef.current.save()
      syncHistoryFlags()
      refreshLayers()
      window.setTimeout(() => refreshGenerated(), 50)
    }
    canvas.on('object:modified', onModify)
    canvas.on('object:added', onModify)
    canvas.on('object:removed', onModify)
    syncHistoryFlags()
    refreshLayers()

    const demo = pendingDemoRef.current
    if (demo) {
      pendingDemoRef.current = null
      void (async () => {
        await loadCanvasJson(canvas, demo.canvasJson, demo.width, demo.height)
        imageDataUrlRef.current = demo.originalDataUrl || null
        setHasImage(true)
        setPalette(demo.palette)
        setZoom(0.72)
        setCurrentProjectId(demo.id)
        setGenerateValues({ ...EMPTY_GENERATE_VALUES, ...demo.fieldValues })
        lastAnalysisRef.current = null
        historyRef.current.save()
        syncHistoryFlags()
        refreshLayers()
        window.setTimeout(() => refreshGenerated(), 40)
        setStatus('Binance · Withdrawal Details · 45 USDT')
        setSelectionTick((t) => t + 1)
      })()
    }
  }, [refreshGenerated, refreshLayers, syncHistoryFlags])

  const runAnalyze = useCallback(async (dataUrl: string) => {
    const canvas = canvasRef.current
    if (!canvas || !dataUrl) return

    setAnalyzing(true)
    setProgress('Starting OCR…')
    setStatus('Magic Edit is extracting text, colors, and fonts…')

    try {
      const analysis = await analyzeReceiptImage(dataUrl, (statusMsg, p) => {
        setProgress(`${statusMsg} ${Math.round(p * 100)}%`)
      })
      lastAnalysisRef.current = analysis
      setPalette(analysis.palette)

      const scale = canvas.getWidth() / analysis.width
      imageScaleRef.current = scale

      await applyOcrLayers(canvas, analysis, scale, hideOriginalRef.current, dataUrl)
      // Bind OCR boxes to structured field keys on canvas objects (already set in addTextLayer)
      pushHistory()
      refreshGenerated()
      setStatus(
        analysis.boxes.length
          ? `Ready — ${analysis.boxes.length} layers. Save as template, then Generate with your data.`
          : 'No text found. Try a clearer photo or add text manually.',
      )
      refreshSelection()
      shouldAutoSaveRef.current = true
    } catch (err) {
      console.error(err)
      setStatus('Magic Edit failed. Try a clearer photo, or click Magic Edit again.')
      toast.error('Magic Edit failed — try a clearer photo.')
    } finally {
      setAnalyzing(false)
      setProgress('')
    }
  }, [pushHistory, refreshGenerated, refreshSelection])

  const loadImage = useCallback(async (dataUrl: string, autoAnalyze = true) => {
    const canvas = canvasRef.current
    if (!canvas) return
    setComposeLive(false)
    imageDataUrlRef.current = dataUrl
    lastAnalysisRef.current = null
    setBrightness(0)
    setContrast(0)
    setPalette([])
    setZoom(0.72)
    const dims = await loadImageAsBackground(canvas, dataUrl)
    imageScaleRef.current = dims.scale
    setHasImage(true)
    pushHistory()
    refreshGenerated()
    refreshSelection()

    if (autoAnalyze) {
      setStatus('Image loaded — running Magic Edit…')
      await runAnalyze(dataUrl)
    } else {
      setStatus('Image loaded. Click Magic Edit to extract text.')
    }
  }, [pushHistory, refreshGenerated, refreshSelection, runAnalyze])

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setStatus('Please choose an image file.')
        return
      }
      const dataUrl = await readFileAsDataUrl(file)
      await loadImage(dataUrl, true)
    },
    [loadImage],
  )

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) await handleUpload(file)
          return
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleUpload])

  useEffect(() => {
    const hasImageFiles = (dt: DataTransfer | null) =>
      Boolean(dt && [...dt.types].includes('Files'))

    const onDragOver = (e: DragEvent) => {
      if (!hasImageFiles(e.dataTransfer)) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }

    const onDrop = (e: DragEvent) => {
      if (!hasImageFiles(e.dataTransfer)) return
      e.preventDefault()
      const files = e.dataTransfer?.files
      if (!files?.length) return
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          void handleUpload(file)
          return
        }
      }
    }

    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [handleUpload])

  const handleAnalyze = useCallback(async () => {
    const dataUrl = imageDataUrlRef.current
    if (!dataUrl) return
    await runAnalyze(dataUrl)
  }, [runAnalyze])

  const handleHideOriginalChange = useCallback(
    async (v: boolean) => {
      setHideOriginal(v)
      const canvas = canvasRef.current
      const analysis = lastAnalysisRef.current
      if (!canvas || !analysis) return
      await applyOcrLayers(
        canvas,
        analysis,
        imageScaleRef.current,
        v,
        imageDataUrlRef.current,
      )
      pushHistory()
      refreshSelection()
    },
    [pushHistory, refreshSelection],
  )

  const handlePropChange = useCallback(
    (patch: Partial<{
      text: string
      fontFamily: string
      fontSize: number
      fill: string
      fontWeight: string | number
      textAlign: string
      opacity: number
      role: TextRole
      fieldKey: FieldKey
    }>) => {
      const canvas = canvasRef.current
      const active = canvas?.getActiveObject()
      if (!canvas || !active) return
      updateSelectedText(active, patch)
      setSelected(getSelectedProps(active))
      pushHistory()
    },
    [pushHistory],
  )

  const prepareCapture = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    canvas.getObjects().forEach((obj) => {
      if (obj instanceof IText && obj.isEditing) obj.exitEditing()
    })
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    return canvas
  }, [])

  const handleExport = useCallback(async () => {
    if (!canDownload) {
      setStatus('Downloads locked — open Billing to pay with USDT or wait for trial access.')
      onOpenBilling?.()
      void api.trackActivity('open_billing', 'Tried download while locked')
      return
    }
    const canvas = prepareCapture()
    if (!canvas) return
    const device = getDevice(deviceId)
    await exportDeviceScreenshot(
      canvas,
      deviceId,
      screenshotMode,
      `${device.id}-${institutionId}-${Date.now()}.png`,
      { grain: exportGrain },
    )
    void api.trackActivity('download_screenshot', `Downloaded ${device.name} · ${institutionId}`, {
      deviceId,
      institutionId,
      mode: screenshotMode,
    })
    setStatus(
      screenshotMode === 'framed'
        ? `Downloaded framed ${device.name} PNG${exportGrain ? ' · grain' : ''}.`
        : `Downloaded ${device.name} phone screenshot${exportGrain ? ' · grain' : ''}.`,
    )
    toast.success('Download started')
  }, [
    deviceId,
    institutionId,
    screenshotMode,
    exportGrain,
    canDownload,
    onOpenBilling,
    prepareCapture,
    toast,
  ])

  const handleCopyScreenshot = useCallback(async () => {
    if (!canDownload) {
      setStatus('Copy locked — open Billing to unlock screenshots.')
      onOpenBilling?.()
      void api.trackActivity('open_billing', 'Tried copy while locked')
      return
    }
    const canvas = prepareCapture()
    if (!canvas) return
    try {
      await copyDeviceScreenshot(canvas, deviceId, 'screen', { grain: exportGrain })
      const device = getDevice(deviceId)
      void api.trackActivity('copy_screenshot', `Copied ${device.name} · ${institutionId}`, {
        deviceId,
        institutionId,
      })
      setStatus(`Copied ${device.name} phone screenshot to clipboard.`)
      toast.success('Screenshot copied')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Copy failed')
      toast.error(err instanceof Error ? err.message : 'Copy failed')
    }
  }, [deviceId, institutionId, exportGrain, canDownload, onOpenBilling, prepareCapture])

  const collectFieldsFromCanvas = useCallback((canvas: Canvas): TemplateField[] => {
    const fields: TemplateField[] = []
    const seen = new Set<string>()
    canvas.getObjects().forEach((obj) => {
      if (obj.get('isCover') || obj.get('isBackground') || obj.get('isGuide')) return
      const receiptId = obj.get('receiptId') as string | undefined
      if (!receiptId) return
      const typeName = String(obj.type || '').toLowerCase()
      const textVal = (obj as IText).text
      const isText = typeName.includes('text') || typeof textVal === 'string'
      if (!isText) return
      if (seen.has(receiptId)) return
      seen.add(receiptId)
      const fieldKey = ((obj.get('receiptFieldKey') as FieldKey) || 'other') as FieldKey
      const role = ((obj.get('receiptRole') as TextRole) || 'other') as TextRole
      fields.push({
        id: receiptId,
        role,
        fieldKey,
        label: labelForFieldKey(fieldKey),
        defaultValue: String(textVal ?? ''),
      })
    })
    return fields
  }, [])

  const persistCurrentProject = useCallback(
    async (name?: string) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const thumb = canvas.toDataURL({ format: 'png', multiplier: 0.35 })
      const json = canvasToJson(canvas)
      const existing = currentProjectId
        ? projects.find((p) => p.id === currentProjectId)
        : null
      const project =
        existing ||
        createProjectDraft({
          name: name || `Receipt ${new Date().toLocaleString()}`,
          width: canvas.getWidth(),
          height: canvas.getHeight(),
          canvasJson: json,
          originalDataUrl: imageDataUrlRef.current || undefined,
          thumbnail: thumb,
          palette,
          fieldValues: generateValues,
          templateId: activeTemplate?.id,
        })

      const next: SavedProject = {
        ...project,
        name: name || project.name,
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        canvasJson: json,
        originalDataUrl: imageDataUrlRef.current || project.originalDataUrl,
        thumbnail: thumb,
        palette,
        fieldValues: generateValues,
        templateId: activeTemplate?.id || project.templateId,
        deviceId,
        institutionId,
        updatedAt: new Date().toISOString(),
      }

      await saveProject(next)
      setCurrentProjectId(next.id)
      setProjects(await listProjects())
      return next
    },
    [
      activeTemplate?.id,
      currentProjectId,
      deviceId,
      generateValues,
      institutionId,
      palette,
      projects,
    ],
  )

  const handleSaveProject = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const defaultName =
      projects.find((p) => p.id === currentProjectId)?.name ||
      `Receipt ${new Date().toLocaleDateString()}`
    const name = window.prompt('Project name', defaultName)
    if (!name) return
    await persistCurrentProject(name)
    setStatus(`Saved “${name}” to Projects. Kept until you delete it.`)
    toast.success(`Saved “${name}”`)
  }, [currentProjectId, persistCurrentProject, projects])

  const handleSaveTemplate = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const name = window.prompt(
      'Template name (reuse with Generate)',
      `Template ${new Date().toLocaleDateString()}`,
    )
    if (!name) return

    const json = canvasToJson(canvas)
    const fields = collectFieldsFromCanvas(canvas)
    const thumb = canvas.toDataURL({ format: 'png', multiplier: 0.35 })

    const tpl = templateFromCanvas({
      name,
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      canvasJson: json,
      backgroundDataUrl: imageDataUrlRef.current || undefined,
      thumbnail: thumb,
      palette,
      fields,
      category: 'custom',
    })

    setTemplates(await upsertTemplate(tpl))
    setActiveTemplate(tpl)
    setStatus(`Template “${name}” saved. Open Generate to create new receipts from it.`)
  }, [collectFieldsFromCanvas, palette])

  const handleSelectTemplate = useCallback(
    async (t: ReceiptTemplate) => {
      const canvas = canvasRef.current
      if (!canvas) return
      setComposeLive(Boolean(t.institutionId))
      setActiveTemplate(t)
      if (t.deviceId) setDeviceId(t.deviceId)
      if (t.institutionId) setInstitutionId(t.institutionId)
      await loadCanvasJson(canvas, t.canvasJson, t.width, t.height)
      imageDataUrlRef.current = t.backgroundDataUrl || null
      setHasImage(true)
      setPalette(t.palette)
      setZoom(t.deviceId?.startsWith('desktop') ? 0.45 : 0.85)
      setCurrentProjectId(null)
      lastAnalysisRef.current = null

      const nextVals = { ...EMPTY_GENERATE_VALUES }
      for (const f of t.fields) {
        if (f.fieldKey in nextVals) {
          ;(nextVals as Record<string, string>)[f.fieldKey] = f.defaultValue
        }
      }
      if (t.deviceId) nextVals.phoneType = getDevice(t.deviceId).name
      setGenerateValues(nextVals)

      pushHistory()
      refreshGenerated()
      setStatus(`Template “${t.name}” ready — edit fields for live preview.`)
      refreshSelection()
    },
    [pushHistory, refreshGenerated, refreshSelection],
  )

  const handleDeleteTemplate = useCallback(async (id: string) => {
    setTemplates(await deleteTemplate(id))
    setActiveTemplate((cur) => (cur?.id === id ? null : cur))
  }, [])

  const handleOpenProject = useCallback(
    async (p: SavedProject) => {
      const canvas = canvasRef.current
      if (!canvas) return
      setComposeLive(false)
      await loadCanvasJson(canvas, p.canvasJson, p.width, p.height)
      imageDataUrlRef.current = p.originalDataUrl || null
      setHasImage(true)
      setPalette(p.palette)
      setZoom(0.72)
      setCurrentProjectId(p.id)
      setGenerateValues({ ...EMPTY_GENERATE_VALUES, ...p.fieldValues })
      if (p.deviceId) setDeviceId(p.deviceId)
      if (p.institutionId) setInstitutionId(p.institutionId)
      if (p.templateId) {
        const t = templates.find((x) => x.id === p.templateId)
        if (t) setActiveTemplate(t)
      }
      lastAnalysisRef.current = null
      pushHistory()
      refreshGenerated()
      setStatus(`Opened project “${p.name}”.`)
      refreshSelection()
    },
    [pushHistory, refreshGenerated, refreshSelection, templates],
  )

  const handleDeleteProject = useCallback(async (id: string) => {
    await deleteProject(id)
    setProjects(await listProjects())
    if (currentProjectId === id) setCurrentProjectId(null)
    setStatus('Project deleted.')
  }, [currentProjectId])

  const handleGenerate = useCallback(async () => {
    const composed = await applyComposeToCanvas()
    if (!composed) {
      setStatus('Canvas not ready.')
      return
    }
    const name = `${composed.name} · ${generateValues.date || generateValues.time || 'new'}`
    const saved = await persistCurrentProject(name)
    void api.trackActivity('generate_receipt', `Generated ${institutionId} · ${deviceId}`, {
      institutionId,
      deviceId,
    })
    setStatus(saved ? `Saved “${saved.name}” to Projects.` : `Generated screenshot.`)
  }, [applyComposeToCanvas, generateValues, persistCurrentProject, institutionId, deviceId])

  const structureKeyRef = useRef('')

  // Live Generate preview — debounced recompose on form / device / institution change
  useEffect(() => {
    if (!bootReady || !composeLive) return
    const structureKey = `${deviceId}|${institutionId}|${screenTheme}|${showFrame ? 1 : 0}`
    const structural = structureKeyRef.current !== structureKey
    if (structural) {
      structureKeyRef.current = structureKey
      // Only drop framed bitmap on layout changes — keep it while typing fields
      setFramedPreviewUrl(null)
      const inst = getInstitution(institutionId)
      const device = getDevice(deviceId)
      setStatus(`Updating · ${inst.brand} · ${inst.name} · ${device.name}`)
    }
    setComposing(true)
    const delay = structural ? 60 : 140
    const t = window.setTimeout(() => {
      void applyComposeToCanvas({
        silent: !structural,
        soft: !structural,
      }).finally(() => setComposing(false))
    }, delay)
    return () => window.clearTimeout(t)
  }, [
    bootReady,
    composeLive,
    deviceId,
    institutionId,
    screenTheme,
    generateValues,
    studies,
    showFrame,
    applyComposeToCanvas,
  ])

  useEffect(() => {
    if (!showFrame) setFramedPreviewUrl(null)
  }, [showFrame])

  const handleBatchExport = useCallback(async () => {
    if (!canDownload) {
      setStatus('Downloads locked — open Billing to unlock batch export.')
      onOpenBilling?.()
      return
    }
    const canvas = prepareCapture()
    if (!canvas) return
    const inst = getInstitution(institutionId)
    const devices = inst.recommendedDeviceIds
    for (const id of devices) {
      const composed = composeScreenshot(id, institutionId, generateValues, screenTheme)
      await loadCanvasJson(canvas, composed.canvasJson, composed.width, composed.height)
      await exportDeviceScreenshot(
        canvas,
        id,
        'screen',
        `${id}-${institutionId}-${Date.now()}.png`,
      )
    }
    // Restore current device compose
    await applyComposeToCanvas({ silent: true })
    void api.trackActivity(
      'batch_export',
      `Batch exported ${devices.length} devices · ${institutionId}`,
      { institutionId, devices },
    )
    setStatus(`Batch exported ${devices.length} phone screenshot(s).`)
    toast.success(`Exported ${devices.length} screenshots`)
  }, [
    institutionId,
    generateValues,
    applyComposeToCanvas,
    canDownload,
    onOpenBilling,
    prepareCapture,
    screenTheme,
  ])

  const handleStudyAddFiles = useCallback(async (files: File[]) => {
    if (!files.length) return
    setStudying(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setStudyProgress(`Studying ${i + 1}/${files.length}: ${file.name}`)
        const ref = await studyScreenshot(file, setStudyProgress)
        await upsertStudy(ref)
      }
      setStudies(await listStudies())
      setStatus(
        `Studied ${files.length} screenshot${files.length === 1 ? '' : 's'}. Open Generate to apply.`,
      )
    } catch (err) {
      console.error(err)
      setStatus('Study failed — try another image.')
    } finally {
      setStudying(false)
      setStudyProgress('')
    }
  }, [])

  const handleStudyToggle = useCallback(async (id: string, active: boolean) => {
    setStudies(await setStudyActive(id, active))
  }, [])

  const handleStudyRemove = useCallback(async (id: string) => {
    setStudies(await deleteStudy(id))
  }, [])

  const handleStudyApply = useCallback(() => {
    const insights = mergeStudyInsights(studies)
    if (!insights) {
      setStatus('Activate at least one studied screenshot first.')
      return
    }
    setComposeLive(true)
    setGenerateValues((prev) => ({
      ...prev,
      ...insights.values,
    }))
    if (insights.palette.length) setPalette(insights.palette)
    setStatus(
      `Applied study insights (${insights.count} ref${insights.count === 1 ? '' : 's'}) — live preview updating.`,
    )
  }, [studies])

  const handleStudyApplyKit = useCallback((kit: ReceiptStyleKit) => {
    setComposeLive(true)
    if (kit.institutionId) setInstitutionId(kit.institutionId)
    setGenerateValues((prev) => ({
      ...prev,
      ...kit.defaults,
    }))
    setPalette(kit.palette)
    setStatus(`Applied ${kit.brand} research kit — live preview updating.`)
  }, [])

  const handleDeviceChange = useCallback(
    (id: DeviceId) => {
      setComposeLive(true)
      setDeviceId(id)
      setGenerateValues((v) => ({ ...v, phoneType: getDevice(id).name }))
    },
    [],
  )

  const handleInstitutionChange = useCallback((id: string) => {
    setComposeLive(true)
    setInstitutionId(id)
    setScreenTheme(defaultThemeForInstitution(id))
    const inst = getInstitution(id)
    const kit = styleKitForInstitution(id)
    const nextDevice = inst.recommendedDeviceIds.includes(deviceId)
      ? deviceId
      : defaultDeviceFor(id)
    setDeviceId(nextDevice)
    // Full reset to this institution’s defaults — no bleed from previous wallet/bank
    setGenerateValues({
      ...EMPTY_GENERATE_VALUES,
      ...inst.defaults,
      ...kit?.defaults,
      phoneType: getDevice(nextDevice).name,
    })
    const match = templates.find(
      (t) => t.institutionId === id && t.deviceId === nextDevice,
    )
    if (match) setActiveTemplate(match)
  }, [deviceId, templates])

  const handleScreenThemeChange = useCallback((theme: ScreenTheme) => {
    setComposeLive(true)
    setScreenTheme(theme)
  }, [])

  // Auto-save open project after edits (debounced)
  useEffect(() => {
    if (!currentProjectId || !hasImage) return
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false
      return
    }
    const t = window.setTimeout(() => {
      void persistCurrentProject()
    }, 1500)
    return () => window.clearTimeout(t)
  }, [currentProjectId, hasImage, persistCurrentProject, selectionTick])

  // After Magic Edit / upload, auto-save a project once
  useEffect(() => {
    if (analyzing || !hasImage || !shouldAutoSaveRef.current) return
    shouldAutoSaveRef.current = false
    const t = window.setTimeout(() => {
      void persistCurrentProject(`Receipt ${new Date().toLocaleString()}`)
    }, 600)
    return () => window.clearTimeout(t)
  }, [analyzing, hasImage, persistCurrentProject])

  const handleBrightness = useCallback((v: number) => {
    setBrightness(v)
    const canvas = canvasRef.current
    if (canvas) applyImageAdjustments(canvas, v, contrast)
  }, [contrast])

  const handleContrast = useCallback((v: number) => {
    setContrast(v)
    const canvas = canvasRef.current
    if (canvas) applyImageAdjustments(canvas, brightness, v)
  }, [brightness])

  const handleCrop = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = cropCanvasToSelection(canvas)
    if (!dataUrl) {
      setStatus('Select something to crop to its bounds.')
      return
    }
    await loadImage(dataUrl, false)
    setStatus('Cropped to selection.')
  }, [loadImage])

  const handleUndo = useCallback(async () => {
    await historyRef.current.undo()
    syncHistoryFlags()
    refreshSelection()
  }, [refreshSelection, syncHistoryFlags])

  const handleRedo = useCallback(async () => {
    await historyRef.current.redo()
    syncHistoryFlags()
    refreshSelection()
  }, [refreshSelection, syncHistoryFlags])

  const handleDuplicate = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    await duplicateActive(canvas)
    pushHistory()
    refreshSelection()
  }, [pushHistory, refreshSelection])

  const handleAddText = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    addBlankText(canvas)
    pushHistory()
    refreshSelection()
  }, [pushHistory, refreshSelection])

  const handleDelete = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    deleteActive(canvas)
    pushHistory()
    refreshSelection()
  }, [pushHistory, refreshSelection])

  // Keyboard shortcuts (Canva-like)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if (!typing && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault()
        setShortcutsOpen(true)
        return
      }
      if (e.key === 'Escape') setShortcutsOpen(false)

      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        void handleUndo()
        return
      }
      if (meta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        void handleRedo()
        return
      }
      if (meta && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        void handleDuplicate()
        return
      }
      if (meta && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10))
        return
      }
      if (meta && e.key === '-') {
        e.preventDefault()
        setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))
        return
      }
      if (meta && e.key === '0') {
        e.preventDefault()
        setZoom(1)
        return
      }

      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleSaveProject()
        return
      }

      if (typing) return

      if (e.key.toLowerCase() === 'g' && !meta) {
        e.preventDefault()
        void handleGenerate()
        return
      }
      if (e.key.toLowerCase() === 'd' && !meta) {
        e.preventDefault()
        void handleExport()
        return
      }
      if (e.key.toLowerCase() === 'c' && !meta) {
        e.preventDefault()
        void handleCopyScreenshot()
        return
      }

      // Pixel-perfect nudging — better than Canva's coarse moves
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        const canvas = canvasRef.current
        const active = canvas?.getActiveObject()
        if (canvas && active && !(active as IText).isEditing) {
          e.preventDefault()
          const step = e.shiftKey ? 10 : 1
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
          active.set({
            left: (active.left || 0) + dx,
            top: (active.top || 0) + dy,
          })
          active.setCoords()
          canvas.requestRenderAll()
          refreshSelection()
          pushHistory()
        }
        return
      }

      if (e.key === 'Enter') {
        const canvas = canvasRef.current
        const active = canvas?.getActiveObject()
        if (active instanceof IText && !active.isEditing) {
          e.preventDefault()
          active.enterEditing()
          active.selectAll()
          canvas?.requestRenderAll()
        }
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleDelete()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    handleDelete,
    handleDuplicate,
    handleRedo,
    handleUndo,
    handleSaveProject,
    handleGenerate,
    handleExport,
    handleCopyScreenshot,
    pushHistory,
    refreshSelection,
  ])

  const accessBadge = useMemo(() => {
    const access = user?.access
    if (!access) return { label: undefined as string | undefined, tone: 'ok' as const }
    if (access.paid_active) {
      const until = access.paid_until ? new Date(access.paid_until) : null
      const days = until
        ? Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86400000))
        : null
      return {
        label: days != null ? `Paid · ${days}d` : 'Paid',
        tone: 'ok' as const,
      }
    }
    if (access.trial_active && access.trial_ends_at) {
      const ends = new Date(access.trial_ends_at)
      const days = Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86400000))
      const hours = Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 3600000))
      return {
        label: days > 0 ? `Trial · ${days}d left` : `Trial · ${hours}h left`,
        tone: days <= 1 ? ('warn' as const) : ('ok' as const),
      }
    }
    return { label: 'Locked', tone: 'locked' as const }
  }, [user?.access])

  return (
    <div className="app-shell">
      <Toolbar
        hasImage={hasImage}
        analyzing={analyzing}
        progress={progress}
        hideOriginal={hideOriginal}
        zoom={zoom}
        canUndo={canUndo}
        canRedo={canRedo}
        brightness={brightness}
        contrast={contrast}
        screenshotMode={screenshotMode}
        deviceLabel={getDevice(deviceId).name}
        canDownload={canDownload}
        userLabel={user?.username}
        isAdmin={user?.role === 'admin'}
        accessLabel={accessBadge.label}
        accessTone={accessBadge.tone}
        onUpload={handleUpload}
        onAnalyze={handleAnalyze}
        onExport={() => void handleExport()}
        onCopyScreenshot={() => void handleCopyScreenshot()}
        onScreenshotModeChange={setScreenshotMode}
        onSaveProject={() => void handleSaveProject()}
        onSaveTemplate={() => void handleSaveTemplate()}
        onAddText={handleAddText}
        onDelete={handleDelete}
        onDuplicate={() => void handleDuplicate()}
        onUndo={() => void handleUndo()}
        onRedo={() => void handleRedo()}
        onRotate={(deg) => {
          const canvas = canvasRef.current
          if (!canvas) return
          rotateBackground(canvas, deg)
          pushHistory()
        }}
        onHideOriginalChange={(v) => {
          void handleHideOriginalChange(v)
        }}
        onBrightnessChange={handleBrightness}
        onContrastChange={handleContrast}
        onCrop={handleCrop}
        onZoomIn={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10))}
        onZoomOut={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}
        onZoomFit={() => setZoom(1)}
        onBringForward={() => {
          const canvas = canvasRef.current
          if (!canvas) return
          bringForward(canvas)
          pushHistory()
        }}
        onSendBackward={() => {
          const canvas = canvasRef.current
          if (!canvas) return
          sendBackward(canvas)
          pushHistory()
        }}
        onOpenBilling={onOpenBilling}
        onOpenAdmin={onOpenAdmin}
        onLogout={() => void logout()}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <div className="workspace">
        <Sidebar
          projects={projects}
          templates={templates}
          layers={layers}
          generateValues={generateValues}
          activeTemplate={activeTemplate}
          currentProjectId={currentProjectId}
          deviceId={deviceId}
          institutionId={institutionId}
          fieldKeys={generateFieldKeys}
          onUpload={handleUpload}
          onOpenProject={(p) => void handleOpenProject(p)}
          onDeleteProject={(id) => void handleDeleteProject(id)}
          onSelectTemplate={(t) => void handleSelectTemplate(t)}
          onDeleteTemplate={(id) => void handleDeleteTemplate(id)}
          onSelectLayer={(layer) => {
            const canvas = canvasRef.current
            if (!canvas) return
            canvas.setActiveObject(layer.object)
            canvas.requestRenderAll()
            refreshSelection()
          }}
          onToggleVisible={(layer) => {
            toggleLayerVisibility(layer.object)
            refreshLayers()
            pushHistory()
          }}
          onToggleLock={(layer) => {
            toggleLayerLock(layer.object)
            refreshLayers()
            pushHistory()
          }}
          onAddText={handleAddText}
          onGenerateValuesChange={(patch) => {
            setComposeLive(true)
            setGenerateValues((prev) => ({ ...prev, ...patch }))
          }}
          onRefreshPreview={() => void applyComposeToCanvas()}
          onDeviceChange={handleDeviceChange}
          onInstitutionChange={handleInstitutionChange}
          screenTheme={screenTheme}
          onScreenThemeChange={handleScreenThemeChange}
          onSaveProject={() => void handleSaveProject()}
          onSaveAsTemplate={() => void handleSaveTemplate()}
          onBatchExport={() => void handleBatchExport()}
          palette={palette}
          status={status}
          analyzing={analyzing}
          studies={studies}
          studying={studying}
          studyProgress={studyProgress}
          onStudyAddFiles={(files) => void handleStudyAddFiles(files)}
          onStudyToggle={(id, active) => void handleStudyToggle(id, active)}
          onStudyRemove={(id) => void handleStudyRemove(id)}
          onStudyApply={handleStudyApply}
          onStudyApplyKit={handleStudyApplyKit}
          showFrame={showFrame}
          onShowFrameChange={setShowFrame}
          exportGrain={exportGrain}
          onExportGrainChange={setExportGrain}
          composing={composing}
        />
        <ScreenshotStage
          analyzing={analyzing}
          status={status}
          showFrame={showFrame}
          framedPreviewUrl={framedPreviewUrl}
          composing={composing}
          canCopy={canDownload}
          copyDisabled={!hasImage}
          onCopyScreenshot={() => void handleCopyScreenshot()}
          editable={
            <EditorCanvas
              onReady={handleReady}
              onSelectionChange={refreshSelection}
              zoom={zoom}
              analyzing={analyzing}
              progress={progress}
              compact
            >
              <FloatingBar
                selected={selected}
                anchor={floatAnchor}
                onChange={handlePropChange}
                onDuplicate={() => void handleDuplicate()}
                onDelete={handleDelete}
                onEdit={() => {
                  const canvas = canvasRef.current
                  const active = canvas?.getActiveObject()
                  if (active instanceof IText) {
                    active.enterEditing()
                    active.selectAll()
                    canvas?.requestRenderAll()
                  }
                }}
              />
            </EditorCanvas>
          }
        />
        <button
          type="button"
          className="props-drawer-toggle"
          onClick={() => setPropsOpen((o) => !o)}
        >
          {propsOpen ? 'Hide fields' : 'Fields'}
        </button>
        <div className={`props-shell${propsOpen ? ' open' : ''}`}>
          <PropertyPanel
            selected={selected}
            palette={palette}
            generateValues={generateValues}
            onGenerateValuesChange={(patch) => {
              setComposeLive(true)
              setGenerateValues((prev) => ({ ...prev, ...patch }))
            }}
            fieldKeys={generateFieldKeys}
            composing={composing}
            onChange={handlePropChange}
          />
        </div>
      </div>
    </div>
  )
}

export default App
