import { useCallback, useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import type {
  DeviceId,
  FieldKey,
  GenerateValues,
  InstitutionCategory,
  ReceiptTemplate,
  SavedProject,
} from '../types/receipt'
import { groupLayers, type LayerInfo } from '../editor/layers'
import type { StudyReference } from '../study/types'
import { styleKitForInstitution } from '../study/styleKits'
import { GeneratePanel } from './GeneratePanel'
import { StudyPanel } from './StudyPanel'
import type { ScreenTheme } from '../catalog/screenTheme'
import './Sidebar.css'

type PrimaryTab = 'generate' | 'study' | 'projects'
type SecondaryTab = 'uploads' | 'templates' | 'layers' | 'qa'

const CATEGORY_ORDER: InstitutionCategory[] = [
  'crypto',
  'bank',
  'fintech',
  'mobile',
  'thermal',
  'custom',
]

const CATEGORY_LABEL: Record<InstitutionCategory, string> = {
  crypto: 'Crypto',
  bank: 'Banks',
  fintech: 'Fintech / P2P',
  mobile: 'Mobile money',
  thermal: 'Thermal',
  custom: 'Custom',
}

interface Props {
  projects: SavedProject[]
  templates: ReceiptTemplate[]
  layers: LayerInfo[]
  generateValues: GenerateValues
  activeTemplate?: ReceiptTemplate | null
  currentProjectId?: string | null
  deviceId: DeviceId
  institutionId: string
  fieldKeys?: FieldKey[]
  onUpload: (file: File) => void
  onOpenProject: (p: SavedProject) => void
  onDeleteProject: (id: string) => void
  onSelectTemplate: (t: ReceiptTemplate) => void
  onDeleteTemplate: (id: string) => void
  onSelectLayer: (layer: LayerInfo) => void
  onToggleVisible: (layer: LayerInfo) => void
  onToggleLock: (layer: LayerInfo) => void
  onAddText: () => void
  onGenerateValuesChange: (v: GenerateValues) => void
  onRefreshPreview?: () => void
  onDeviceChange: (id: DeviceId) => void
  onInstitutionChange: (id: string) => void
  screenTheme: ScreenTheme
  onScreenThemeChange: (theme: ScreenTheme) => void
  onSaveProject: () => void
  onSaveAsTemplate: () => void
  onBatchExport?: () => void
  palette: string[]
  status: string
  analyzing: boolean
  studies: StudyReference[]
  studying: boolean
  studyProgress?: string
  onStudyAddFiles: (files: File[]) => void
  onStudyToggle: (id: string, active: boolean) => void
  onStudyRemove: (id: string) => void
  onStudyApply: () => void
  onStudyApplyKit: (kit: import('../study/styleKits').ReceiptStyleKit) => void
  showFrame?: boolean
  onShowFrameChange?: (v: boolean) => void
  exportGrain?: boolean
  onExportGrainChange?: (v: boolean) => void
  composing?: boolean
}

function pickImageFile(files: FileList | null | undefined): File | null {
  if (!files?.length) return null
  for (const file of files) {
    if (file.type.startsWith('image/')) return file
  }
  return null
}

export function Sidebar(props: Props) {
  const {
    projects,
    templates,
    layers,
    generateValues,
    activeTemplate,
    currentProjectId,
    deviceId,
    institutionId,
    fieldKeys: _fieldKeys,
    onUpload,
    onOpenProject,
    onDeleteProject,
    onSelectTemplate,
    onDeleteTemplate,
    onSelectLayer,
    onToggleVisible,
    onToggleLock,
    onAddText,
    onGenerateValuesChange,
    onRefreshPreview,
    onDeviceChange,
    onInstitutionChange,
    screenTheme,
    onScreenThemeChange,
    onSaveProject,
    onSaveAsTemplate,
    onBatchExport,
    palette,
    status,
    analyzing,
    studies,
    studying,
    studyProgress,
    onStudyAddFiles,
    onStudyToggle,
    onStudyRemove,
    onStudyApply,
    onStudyApplyKit,
    showFrame,
    onShowFrameChange,
    exportGrain,
    onExportGrainChange,
    composing,
  } = props

  const [primary, setPrimary] = useState<PrimaryTab>('generate')
  const [secondary, setSecondary] = useState<SecondaryTab | null>(null)
  const [dragging, setDragging] = useState(false)
  const tab = secondary || primary

  const templatesByCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: templates.filter((t) => (t.category || 'custom') === cat),
  })).filter((g) => g.items.length > 0)

  const layerGroups = useMemo(() => groupLayers(layers), [layers])
  const kit = styleKitForInstitution(institutionId)

  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragging(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)
      const file = pickImageFile(e.dataTransfer.files)
      if (file) onUpload(file)
    },
    [onUpload],
  )

  const primaryTabs: { id: PrimaryTab; label: string }[] = [
    { id: 'generate', label: 'Generate' },
    { id: 'study', label: 'Study' },
    { id: 'projects', label: 'Projects' },
  ]

  const secondaryTabs: { id: SecondaryTab; label: string }[] = [
    { id: 'uploads', label: 'Remake' },
    { id: 'templates', label: 'Catalog' },
    { id: 'layers', label: 'Layers' },
    { id: 'qa', label: 'QA' },
  ]

  return (
    <aside className="sidebar">
      <nav className="side-tabs side-tabs-primary">
        {primaryTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`side-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => {
              setPrimary(t.id)
              setSecondary(null)
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <nav className="side-tabs side-tabs-secondary">
        {secondaryTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`side-tab side-tab-sm${tab === t.id ? ' active' : ''}`}
            onClick={() => setSecondary(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="side-body">
        {tab === 'projects' && (
          <section className="side-block">
            <h2>Your designs</h2>
            <p className="side-hint">Saved until you delete. Auto-saves while you work.</p>
            <div className="side-actions">
              <button type="button" className="side-cta" onClick={onSaveProject}>
                Save project
              </button>
              <button type="button" className="side-cta ghost" onClick={onSaveAsTemplate}>
                Save as template
              </button>
            </div>
            {projects.length === 0 ? (
              <p className="side-hint">No projects yet. Generate one or remake a photo.</p>
            ) : (
              <ul className="project-list">
                {projects.map((p) => (
                  <li key={p.id} className={p.id === currentProjectId ? 'active' : ''}>
                    <button type="button" className="project-card" onClick={() => onOpenProject(p)}>
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" className="project-thumb" />
                      ) : (
                        <span className="template-preview" />
                      )}
                      <span className="template-name">{p.name}</span>
                      <span className="template-meta">
                        {new Date(p.updatedAt).toLocaleString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="template-delete"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => {
                        if (window.confirm(`Delete “${p.name}”? This cannot be undone.`)) {
                          onDeleteProject(p.id)
                        }
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'uploads' && (
          <section className="side-block">
            <h2>Remake a photo</h2>
            <p className="side-hint">
              Secondary path — Magic Edit extracts text from a photo. Prefer Generate from catalog for
              pixel-perfect wallet screens.
            </p>
            <label
              className={`dropzone${dragging ? ' dropzone-active' : ''}`}
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <span className="dropzone-title">
                {dragging ? 'Drop to load' : analyzing ? 'Extracting…' : 'Drop image or click'}
              </span>
              <span className="dropzone-sub">PNG, JPG, WEBP</span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onUpload(f)
                  e.target.value = ''
                }}
              />
            </label>
            {status && <p className="side-status">{status}</p>}
            <button type="button" className="side-cta" onClick={onAddText}>
              + Add a text box
            </button>
            {palette.length > 0 && (
              <>
                <h2 className="spaced">Brand colors</h2>
                <div className="palette">
                  {palette.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="swatch"
                      style={{ background: c }}
                      title={c}
                      onClick={() => navigator.clipboard?.writeText(c)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {tab === 'study' && (
          <StudyPanel
            studies={studies}
            studying={studying}
            progress={studyProgress}
            onAddFiles={onStudyAddFiles}
            onToggleActive={onStudyToggle}
            onRemove={onStudyRemove}
            onApplyToGenerate={onStudyApply}
            onApplyKit={onStudyApplyKit}
          />
        )}

        {tab === 'templates' && (
          <section className="side-block">
            <h2>Catalog</h2>
            <p className="side-hint">Device × wallet templates. Open one — canvas updates live.</p>
            {templatesByCategory.map(({ cat, items }) => (
              <div key={cat} className="catalog-group">
                <h3 className="catalog-heading">{CATEGORY_LABEL[cat]}</h3>
                <ul className="template-list">
                  {items.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={`template-card${activeTemplate?.id === t.id ? ' selected' : ''}`}
                        onClick={() => onSelectTemplate(t)}
                      >
                        {t.thumbnail ? (
                          <img src={t.thumbnail} alt="" className="template-thumb" />
                        ) : (
                          <span className="template-preview" aria-hidden />
                        )}
                        <span className="template-name">{t.name}</span>
                        <span className="template-meta">
                          {t.deviceId || 'device'}
                          {' · '}
                          {t.width}×{t.height}
                        </span>
                      </button>
                      {!t.isStarter && (
                        <button
                          type="button"
                          className="template-delete"
                          aria-label={`Delete ${t.name}`}
                          onClick={() => onDeleteTemplate(t.id)}
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {tab === 'generate' && (
          <>
            {status ? <p className="side-status side-status-sticky">{status}</p> : null}
            <GeneratePanel
              values={generateValues}
              onChange={onGenerateValuesChange}
              templateName={activeTemplate?.name}
              disabled={false}
              deviceId={deviceId}
              institutionId={institutionId}
              onDeviceChange={onDeviceChange}
              onInstitutionChange={onInstitutionChange}
              screenTheme={screenTheme}
              onScreenThemeChange={onScreenThemeChange}
              onRefresh={onRefreshPreview}
              live
              composing={composing}
            />
            {onShowFrameChange ? (
              <label className="side-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(showFrame)}
                  onChange={(e) => onShowFrameChange(e.target.checked)}
                />
                Framed live preview
              </label>
            ) : null}
            <label className="side-toggle">
              <input
                type="checkbox"
                checked={Boolean(exportGrain)}
                onChange={(e) => onExportGrainChange?.(e.target.checked)}
              />
              Film grain on download
            </label>
            {onBatchExport ? (
              <button type="button" className="side-cta ghost spaced-btn" onClick={onBatchExport}>
                Batch export · all recommended devices
              </button>
            ) : null}
          </>
        )}

        {tab === 'layers' && (
          <section className="side-block">
            <h2>Layers</h2>
            <p className="side-hint">Grouped by Status bar / Header / Details / CTA.</p>
            {layerGroups.length === 0 ? (
              <p className="side-hint">No layers yet.</p>
            ) : (
              layerGroups.map((g) => (
                <div key={g.id} className="layer-group">
                  <h3 className="layer-group-title">{g.label}</h3>
                  <ul className="layer-list">
                    {g.layers.map((layer) => (
                      <li key={layer.id}>
                        <button
                          type="button"
                          className="layer-row"
                          onClick={() => onSelectLayer(layer)}
                        >
                          <span className="layer-type">{layer.type === 'text' ? 'T' : '□'}</span>
                          <span className="layer-label">{layer.label}</span>
                        </button>
                        <button
                          type="button"
                          className="layer-icon"
                          title={layer.visible ? 'Hide' : 'Show'}
                          onClick={() => onToggleVisible(layer)}
                        >
                          {layer.visible ? '◉' : '〇'}
                        </button>
                        <button
                          type="button"
                          className="layer-icon"
                          title={layer.locked ? 'Unlock' : 'Lock'}
                          onClick={() => onToggleLock(layer)}
                        >
                          {layer.locked ? '🔒' : '🔓'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'qa' && (
          <section className="side-block">
            <h2>Realism QA</h2>
            <p className="side-hint">
              Checklist from the research kit for {kit?.brand || 'this screen'}.
            </p>
            {kit ? (
              <>
                <ul className="qa-list">
                  {kit.notes.map((n) => (
                    <li key={n}>
                      <label className="qa-item">
                        <input type="checkbox" />
                        <span>{n}</span>
                      </label>
                    </li>
                  ))}
                  {kit.layout ? (
                    <li>
                      <label className="qa-item">
                        <input type="checkbox" />
                        <span>
                          Layout: inset {kit.layout.topInset}px · {kit.layout.rowDensity} rows ·{' '}
                          {kit.layout.darkChrome ? 'dark' : 'light'} chrome
                        </span>
                      </label>
                    </li>
                  ) : null}
                </ul>
                <p className="kit-source">{kit.source}</p>
              </>
            ) : (
              <p className="side-hint">No research kit for this institution yet.</p>
            )}
          </section>
        )}
      </div>
    </aside>
  )
}
