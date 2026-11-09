import type { CatalogPreferences, CrohnsFoodItem, Guardrails, PersonalStatus } from '../types'
import { draftHasContent } from './submitDraft'

export const STORAGE_KEYS = {
  starred: 'flarewise_starred_ids',
  grocery: 'flarewise_grocery_ids',
  checkedIngredients: 'flarewise_checked_ingredients',
  minScore: 'flarewise_min_score',
  guardrails: 'flarewise_guardrails',
  personalStatus: 'flarewise_personal_status',
  submitDraft: 'flarewise_submit_draft',
  submitQueue: 'flarewise_submit_queue',
} as const

/** Legacy SoftScore / crohns-era keys — migrated once on load. */
const LEGACY_KEYS: Partial<Record<keyof typeof STORAGE_KEYS, string>> = {
  starred: 'crohns_catalog_starred_ids',
  grocery: 'crohns_catalog_grocery_ids',
  checkedIngredients: 'crohns_catalog_checked_ingredients',
  minScore: 'crohns_catalog_min_score',
  guardrails: 'crohns_catalog_guardrails',
  personalStatus: 'crohns_catalog_personal_status',
  submitDraft: 'crohns_catalog_submit_draft',
}

export type QueuedSubmission = {
  localId: string
  savedAt: string
  item: CrohnsFoodItem
}

export const defaultGuardrails: Guardrails = {
  citrusFreeOnly: true,
  lactoseSafeOnly: false,
  toasterOvenOnly: false,
  grabAndGoOnly: false,
  hideDangerZone: true,
  showDangerZone: false,
}

export const defaultPreferences: CatalogPreferences = {
  starredIds: [],
  groceryIds: [],
  checkedGroceryIngredients: [],
  // Default toward flare-safe / everyday — full dial still opens to all non-Avoid.
  minScore: 9,
  guardrails: defaultGuardrails,
  personalStatus: {},
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function migrateKey(current: string, legacy: string) {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(current) != null) return
  const old = localStorage.getItem(legacy)
  if (old == null) return
  localStorage.setItem(current, old)
  localStorage.removeItem(legacy)
}

function migrateAllKeys() {
  for (const key of Object.keys(STORAGE_KEYS) as (keyof typeof STORAGE_KEYS)[]) {
    const legacy = LEGACY_KEYS[key]
    if (legacy) migrateKey(STORAGE_KEYS[key], legacy)
  }
}

function newLocalId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function loadPreferences(): CatalogPreferences {
  if (typeof window === 'undefined') return defaultPreferences
  migrateAllKeys()
  const guardrails = {
    ...defaultGuardrails,
    ...readJson(STORAGE_KEYS.guardrails, defaultGuardrails),
  }
  // Keep hide/show danger zone in sync
  if (guardrails.showDangerZone) guardrails.hideDangerZone = false
  return {
    starredIds: readJson(STORAGE_KEYS.starred, []),
    groceryIds: readJson(STORAGE_KEYS.grocery, []),
    checkedGroceryIngredients: readJson(STORAGE_KEYS.checkedIngredients, []),
    minScore: readJson(STORAGE_KEYS.minScore, 6.5),
    guardrails,
    personalStatus: readJson(STORAGE_KEYS.personalStatus, {}),
  }
}

export function savePreferences(prefs: CatalogPreferences) {
  localStorage.setItem(STORAGE_KEYS.starred, JSON.stringify(prefs.starredIds))
  localStorage.setItem(STORAGE_KEYS.grocery, JSON.stringify(prefs.groceryIds))
  localStorage.setItem(
    STORAGE_KEYS.checkedIngredients,
    JSON.stringify(prefs.checkedGroceryIngredients),
  )
  localStorage.setItem(STORAGE_KEYS.minScore, JSON.stringify(prefs.minScore))
  localStorage.setItem(STORAGE_KEYS.guardrails, JSON.stringify(prefs.guardrails))
  localStorage.setItem(
    STORAGE_KEYS.personalStatus,
    JSON.stringify(prefs.personalStatus),
  )
}

export function exportPreferences(prefs: CatalogPreferences): string {
  return JSON.stringify(prefs, null, 2)
}

export function importPreferences(raw: string): CatalogPreferences | null {
  try {
    const parsed = JSON.parse(raw) as CatalogPreferences
    if (!parsed || typeof parsed !== 'object') return null
    return {
      ...defaultPreferences,
      ...parsed,
      guardrails: { ...defaultGuardrails, ...parsed.guardrails },
      personalStatus: parsed.personalStatus ?? {},
    }
  } catch {
    return null
  }
}

export function loadSubmitDraft(): CrohnsFoodItem | null {
  if (typeof window === 'undefined') return null
  migrateAllKeys()
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.submitDraft)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CrohnsFoodItem
    if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveSubmitDraft(draft: CrohnsFoodItem) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.submitDraft, JSON.stringify(draft))
}

export function clearSubmitDraft() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.submitDraft)
}

export function loadSubmitQueue(): QueuedSubmission[] {
  if (typeof window === 'undefined') return []
  migrateAllKeys()
  const queue = readJson<QueuedSubmission[]>(STORAGE_KEYS.submitQueue, [])
  if (!Array.isArray(queue)) return []
  return queue.filter(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      typeof entry.localId === 'string' &&
      entry.item &&
      typeof entry.item.name === 'string',
  )
}

export function saveSubmitQueue(queue: QueuedSubmission[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.submitQueue, JSON.stringify(queue))
}

export function enqueueSubmission(item: CrohnsFoodItem): QueuedSubmission {
  const entry: QueuedSubmission = {
    localId: newLocalId(),
    savedAt: new Date().toISOString(),
    item,
  }
  const next = [...loadSubmitQueue(), entry]
  saveSubmitQueue(next)
  return entry
}

export function removeQueuedSubmission(localId: string) {
  saveSubmitQueue(loadSubmitQueue().filter((e) => e.localId !== localId))
}

/** Working draft + queued foods waiting to send. */
export function countPendingSubmissions() {
  const queue = loadSubmitQueue().length
  const draft = loadSubmitDraft()
  const working = draft && draftHasContent(draft) ? 1 : 0
  return queue + working
}

export type { PersonalStatus }
