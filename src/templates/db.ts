import { v4 as uuid } from 'uuid'
import type {
  DeviceId,
  GenerateValues,
  ReceiptTemplate,
  SavedProject,
  TemplateField,
} from '../types/receipt'
import { EMPTY_GENERATE_VALUES } from '../types/receipt'
import { applyGenerateValuesToCanvasJson, mergeGenerateValues } from '../catalog/applyValues'
import { buildCatalogTemplates, composeScreenshot } from '../catalog/compose'
import { BINANCE_DEFAULTS } from '../catalog/screens/binance'
import type { StudyReference } from '../study/types'

const DB_NAME = 'receipt-maker-db'
const DB_VERSION = 3
const PROJECTS = 'projects'
const TEMPLATES = 'templates'
const STUDIES = 'studies'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(PROJECTS)) {
        db.createObjectStore(PROJECTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(TEMPLATES)) {
        db.createObjectStore(TEMPLATES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STUDIES)) {
        db.createObjectStore(STUDIES, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => resolve((req.result as T[]) || [])
    req.onerror = () => reject(req.error)
  })
}

async function put<T extends { id: string }>(storeName: string, value: T): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(storeName, 'readwrite')
  tx.objectStore(storeName).put(value)
  await txDone(tx)
}

async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(storeName, 'readwrite')
  tx.objectStore(storeName).delete(id)
  await txDone(tx)
}

async function getOne<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).get(id)
    req.onsuccess = () => resolve((req.result as T) || null)
    req.onerror = () => reject(req.error)
  })
}

// ——— Projects ———

export async function listProjects(): Promise<SavedProject[]> {
  const all = await getAll<SavedProject>(PROJECTS)
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getProject(id: string): Promise<SavedProject | null> {
  return getOne<SavedProject>(PROJECTS, id)
}

export async function saveProject(project: SavedProject): Promise<SavedProject> {
  const next = { ...project, updatedAt: new Date().toISOString() }
  await put(PROJECTS, next)
  return next
}

export async function deleteProject(id: string): Promise<void> {
  await remove(PROJECTS, id)
}

export function createProjectDraft(opts: {
  name: string
  width: number
  height: number
  canvasJson: Record<string, unknown>
  originalDataUrl?: string
  thumbnail: string
  palette: string[]
  fieldValues?: Partial<GenerateValues>
  templateId?: string
  deviceId?: DeviceId
  institutionId?: string
}): SavedProject {
  const now = new Date().toISOString()
  return {
    id: uuid(),
    name: opts.name,
    createdAt: now,
    updatedAt: now,
    width: opts.width,
    height: opts.height,
    originalDataUrl: opts.originalDataUrl,
    thumbnail: opts.thumbnail,
    canvasJson: opts.canvasJson,
    palette: opts.palette,
    fieldValues: opts.fieldValues || {},
    templateId: opts.templateId,
    deviceId: opts.deviceId,
    institutionId: opts.institutionId,
  }
}

// ——— Templates / catalog seed ———

export async function ensureDefaultTemplates(): Promise<ReceiptTemplate[]> {
  const catalog = buildCatalogTemplates()
  const existing = await getAll<ReceiptTemplate>(TEMPLATES)
  const custom = existing.filter((t) => !t.isStarter && !t.id.startsWith('catalog-'))
  // Drop legacy starters
  const legacyIds = new Set([
    'starter-binance-wallet',
    'starter-crypto-wallet',
    'starter-blank-receipt',
  ])

  for (const t of catalog) await put(TEMPLATES, t)
  for (const t of existing) {
    if (legacyIds.has(t.id) || (t.isStarter && t.id.startsWith('catalog-'))) {
      // catalog already refreshed via put above; remove pure legacy
      if (legacyIds.has(t.id)) await remove(TEMPLATES, t.id)
    }
  }

  const all = [...catalog, ...custom]
  return all.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
}

const DEMO_PROJECT_ID = 'demo-binance-usdt-45'
/** Bump to force-refresh the seeded demo canvas after layout fidelity passes. */
const DEMO_LAYOUT_VERSION = 9

/** Seed / refresh Binance · S24 Ultra demo — updates when layout version bumps. */
export async function ensureBinanceUsdtDemo(): Promise<SavedProject> {
  await ensureDefaultTemplates()
  const values = { ...EMPTY_GENERATE_VALUES, ...BINANCE_DEFAULTS, amountCrypto: '-45 USDT' }
  const composed = composeScreenshot('s24-ultra', 'binance-withdrawal', values)
  const tpl = await getOne<ReceiptTemplate>(TEMPLATES, `catalog-binance-withdrawal-s24-ultra`)
  const existing = await getOne<SavedProject>(PROJECTS, DEMO_PROJECT_ID)
  const existingVersion = Number(
    (existing?.fieldValues as Record<string, unknown> | undefined)?.demoLayoutVersion ?? 0,
  )

  if (existing?.canvasJson && existingVersion === DEMO_LAYOUT_VERSION) {
    return existing
  }

  const now = new Date().toISOString()
  const project: SavedProject = {
    id: DEMO_PROJECT_ID,
    name: composed.name,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    width: composed.width,
    height: composed.height,
    thumbnail: '',
    canvasJson: composed.canvasJson,
    palette: composed.palette,
    fieldValues: {
      ...values,
      // layout stamp — ignored by compose; used only to refresh seed
      other: values.other,
    } as Partial<GenerateValues> & { demoLayoutVersion?: string },
    templateId: tpl?.id || `catalog-binance-withdrawal-s24-ultra`,
    deviceId: 's24-ultra',
    institutionId: 'binance-withdrawal',
  }
  ;(project.fieldValues as { demoLayoutVersion?: string }).demoLayoutVersion = String(DEMO_LAYOUT_VERSION)
  await put(PROJECTS, project)
  return project
}

export async function listTemplates(): Promise<ReceiptTemplate[]> {
  return ensureDefaultTemplates()
}

export async function upsertTemplate(template: ReceiptTemplate): Promise<ReceiptTemplate[]> {
  const next = {
    ...template,
    updatedAt: new Date().toISOString(),
  }
  await put(TEMPLATES, next)
  return listTemplates()
}

export async function deleteTemplate(id: string): Promise<ReceiptTemplate[]> {
  const existing = await getOne<ReceiptTemplate>(TEMPLATES, id)
  if (existing?.isStarter) return listTemplates()
  await remove(TEMPLATES, id)
  return listTemplates()
}

// ——— Study references ———

export async function listStudies(): Promise<StudyReference[]> {
  const all = await getAll<StudyReference>(STUDIES)
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function upsertStudy(ref: StudyReference): Promise<StudyReference[]> {
  await put(STUDIES, ref)
  return listStudies()
}

export async function deleteStudy(id: string): Promise<StudyReference[]> {
  await remove(STUDIES, id)
  return listStudies()
}

export async function setStudyActive(id: string, active: boolean): Promise<StudyReference[]> {
  const existing = await getOne<StudyReference>(STUDIES, id)
  if (!existing) return listStudies()
  await put(STUDIES, { ...existing, active })
  return listStudies()
}

export { applyGenerateValuesToCanvasJson, mergeGenerateValues }
export type { TemplateField }
