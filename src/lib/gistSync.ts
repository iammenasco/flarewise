import type { CatalogPreferences } from '../types'
import {
  exportPreferences,
  importPreferences,
  prefsFromBackup,
  type PreferencesBackup,
} from './storage'

export const GIST_BACKUP_FILENAME = 'flarewise-backup.json'

export const GIST_SYNC_STORAGE_KEY = 'flarewise_gist_sync'

export type GistSyncConfig = {
  token: string
  gistId: string
  /** Public HTML URL for the gist (secret gists still have a URL if you know it). */
  htmlUrl?: string
  lastSyncedAt?: string
}

export type GistSyncStatus =
  | { state: 'idle' }
  | { state: 'syncing'; direction: 'pull' | 'push' | 'create' }
  | { state: 'ok'; at: string; direction: 'pull' | 'push' | 'create' | 'noop' }
  | { state: 'error'; message: string }

export type BackupWinner = 'local' | 'remote' | 'equal'

/** Compare ISO timestamps; missing/invalid counts as older. */
export function chooseBackupWinner(
  localUpdatedAt: string | null | undefined,
  remoteUpdatedAt: string | null | undefined,
): BackupWinner {
  const localMs = parseUpdatedAtMs(localUpdatedAt)
  const remoteMs = parseUpdatedAtMs(remoteUpdatedAt)
  if (localMs === remoteMs) return 'equal'
  if (localMs == null) return 'remote'
  if (remoteMs == null) return 'local'
  return localMs > remoteMs ? 'local' : 'remote'
}

function parseUpdatedAtMs(value: string | null | undefined): number | null {
  if (!value || typeof value !== 'string') return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

export function loadGistSyncConfig(): GistSyncConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(GIST_SYNC_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GistSyncConfig>
    if (
      !parsed ||
      typeof parsed.token !== 'string' ||
      !parsed.token.trim() ||
      typeof parsed.gistId !== 'string' ||
      !parsed.gistId.trim()
    ) {
      return null
    }
    return {
      token: parsed.token.trim(),
      gistId: parsed.gistId.trim(),
      htmlUrl:
        typeof parsed.htmlUrl === 'string' ? parsed.htmlUrl : undefined,
      lastSyncedAt:
        typeof parsed.lastSyncedAt === 'string'
          ? parsed.lastSyncedAt
          : undefined,
    }
  } catch {
    return null
  }
}

export function saveGistSyncConfig(config: GistSyncConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(GIST_SYNC_STORAGE_KEY, JSON.stringify(config))
}

export function clearGistSyncConfig() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GIST_SYNC_STORAGE_KEY)
}

type GistFileMap = Record<string, { content?: string; filename?: string }>

type GistApiResponse = {
  id: string
  html_url?: string
  files?: GistFileMap
  message?: string
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function readGistError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string }
    if (body?.message) return body.message
  } catch {
    /* ignore */
  }
  if (res.status === 401 || res.status === 403) {
    return 'GitHub token rejected — check gist scope and reconnect.'
  }
  if (res.status === 404) {
    return 'Gist not found — check the gist id or recreate it.'
  }
  return `GitHub Gist error (${res.status})`
}

export function backupContentFromGist(gist: GistApiResponse): string | null {
  const files = gist.files
  if (!files) return null
  const preferred = files[GIST_BACKUP_FILENAME]
  if (preferred?.content) return preferred.content
  for (const file of Object.values(files)) {
    if (file?.content) return file.content
  }
  return null
}

export async function fetchGistBackup(
  token: string,
  gistId: string,
): Promise<{ backup: PreferencesBackup; htmlUrl?: string }> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(await readGistError(res))
  const gist = (await res.json()) as GistApiResponse
  const content = backupContentFromGist(gist)
  if (!content) throw new Error('Gist has no backup file content.')
  const backup = importPreferences(content)
  if (!backup) throw new Error('Gist backup JSON is invalid.')
  return { backup, htmlUrl: gist.html_url }
}

export async function createSecretGist(
  token: string,
  prefs: CatalogPreferences,
  updatedAt: string,
): Promise<GistSyncConfig> {
  const content = exportPreferences(prefs, updatedAt)
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      description: 'Flarewise preferences backup (secret)',
      public: false,
      files: {
        [GIST_BACKUP_FILENAME]: { content },
      },
    }),
  })
  if (!res.ok) throw new Error(await readGistError(res))
  const gist = (await res.json()) as GistApiResponse
  if (!gist.id) throw new Error('GitHub did not return a gist id.')
  return {
    token: token.trim(),
    gistId: gist.id,
    htmlUrl: gist.html_url,
    lastSyncedAt: new Date().toISOString(),
  }
}

export async function pushGistBackup(
  config: GistSyncConfig,
  prefs: CatalogPreferences,
  updatedAt: string,
): Promise<GistSyncConfig> {
  const content = exportPreferences(prefs, updatedAt)
  const res = await fetch(`https://api.github.com/gists/${config.gistId}`, {
    method: 'PATCH',
    headers: authHeaders(config.token),
    body: JSON.stringify({
      files: {
        [GIST_BACKUP_FILENAME]: { content },
      },
    }),
  })
  if (!res.ok) throw new Error(await readGistError(res))
  const gist = (await res.json()) as GistApiResponse
  return {
    ...config,
    htmlUrl: gist.html_url ?? config.htmlUrl,
    lastSyncedAt: new Date().toISOString(),
  }
}

/**
 * Pull remote, apply LWW, optionally push local.
 * Returns prefs to apply locally when remote wins; otherwise null.
 */
export async function reconcileGistBackup(opts: {
  config: GistSyncConfig
  localPrefs: CatalogPreferences
  localUpdatedAt: string
}): Promise<{
  config: GistSyncConfig
  applyPrefs: CatalogPreferences | null
  applyUpdatedAt: string | null
  direction: 'pull' | 'push' | 'noop'
}> {
  const { backup, htmlUrl } = await fetchGistBackup(
    opts.config.token,
    opts.config.gistId,
  )
  const remoteUpdatedAt = backup.updatedAt ?? null
  const winner = chooseBackupWinner(opts.localUpdatedAt, remoteUpdatedAt)
  const baseConfig: GistSyncConfig = {
    ...opts.config,
    htmlUrl: htmlUrl ?? opts.config.htmlUrl,
  }

  if (winner === 'remote') {
    return {
      config: {
        ...baseConfig,
        lastSyncedAt: new Date().toISOString(),
      },
      applyPrefs: prefsFromBackup(backup),
      applyUpdatedAt: remoteUpdatedAt,
      direction: 'pull',
    }
  }

  if (winner === 'local') {
    const next = await pushGistBackup(
      baseConfig,
      opts.localPrefs,
      opts.localUpdatedAt,
    )
    return {
      config: next,
      applyPrefs: null,
      applyUpdatedAt: null,
      direction: 'push',
    }
  }

  return {
    config: {
      ...baseConfig,
      lastSyncedAt: new Date().toISOString(),
    },
    applyPrefs: null,
    applyUpdatedAt: null,
    direction: 'noop',
  }
}
