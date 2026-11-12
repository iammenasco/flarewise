import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearGistSyncConfig,
  createSecretGist,
  loadGistSyncConfig,
  pushGistBackup,
  reconcileGistBackup,
  saveGistSyncConfig,
  type GistSyncConfig,
  type GistSyncStatus,
} from '../lib/gistSync'
import type { CatalogPreferences } from '../types'

const PUSH_DEBOUNCE_MS = 1500

export function useGistSync(opts: {
  prefs: CatalogPreferences
  updatedAt: string
  online: boolean
  applySyncedPrefs: (prefs: CatalogPreferences, updatedAt: string) => void
}) {
  const [config, setConfig] = useState<GistSyncConfig | null>(() =>
    typeof window === 'undefined' ? null : loadGistSyncConfig(),
  )
  const [status, setStatus] = useState<GistSyncStatus>({ state: 'idle' })
  const [tokenInput, setTokenInput] = useState('')
  const [gistIdInput, setGistIdInput] = useState(() => config?.gistId ?? '')

  const prefsRef = useRef(opts.prefs)
  const updatedAtRef = useRef(opts.updatedAt)
  const applyRef = useRef(opts.applySyncedPrefs)
  const applyingRemoteRef = useRef(false)
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialPullDoneRef = useRef(false)
  const suppressPushUntilRef = useRef(0)

  useEffect(() => {
    prefsRef.current = opts.prefs
    updatedAtRef.current = opts.updatedAt
    applyRef.current = opts.applySyncedPrefs
  }, [opts.prefs, opts.updatedAt, opts.applySyncedPrefs])

  const persistConfig = useCallback((next: GistSyncConfig | null) => {
    setConfig(next)
    if (next) saveGistSyncConfig(next)
    else clearGistSyncConfig()
  }, [])

  const runReconcile = useCallback(async () => {
    const current = loadGistSyncConfig()
    if (!current) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    setStatus({ state: 'syncing', direction: 'pull' })
    try {
      const result = await reconcileGistBackup({
        config: current,
        localPrefs: prefsRef.current,
        localUpdatedAt: updatedAtRef.current,
      })
      persistConfig(result.config)
      if (result.applyPrefs && result.applyUpdatedAt) {
        applyingRemoteRef.current = true
        suppressPushUntilRef.current = Date.now() + PUSH_DEBOUNCE_MS + 500
        applyRef.current(result.applyPrefs, result.applyUpdatedAt)
        queueMicrotask(() => {
          applyingRemoteRef.current = false
        })
      }
      setStatus({
        state: 'ok',
        at: result.config.lastSyncedAt ?? new Date().toISOString(),
        direction: result.direction,
      })
    } catch (err) {
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Sync failed',
      })
    }
  }, [persistConfig])

  // Initial pull once per connected session when online.
  // Mark push-ready only after reconcile finishes so we do not race a push.
  useEffect(() => {
    if (!config || !opts.online) return
    if (initialPullDoneRef.current) return
    let cancelled = false
    void (async () => {
      await runReconcile()
      if (!cancelled) initialPullDoneRef.current = true
    })()
    return () => {
      cancelled = true
    }
  }, [config, opts.online, runReconcile])

  useEffect(() => {
    if (!config) return
    const onOnline = () => {
      void runReconcile()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [config, runReconcile])

  // Debounced push when local prefs change after the first reconcile.
  // Depend on connected (not config): persistConfig updates lastSyncedAt after
  // each push, and that must not re-arm another push.
  const connected = Boolean(config)
  useEffect(() => {
    if (!connected || !opts.online) return
    if (!initialPullDoneRef.current) return
    if (applyingRemoteRef.current) return
    if (Date.now() < suppressPushUntilRef.current) return

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(() => {
      if (applyingRemoteRef.current) return
      if (Date.now() < suppressPushUntilRef.current) return
      void (async () => {
        const current = loadGistSyncConfig()
        if (!current) return
        setStatus({ state: 'syncing', direction: 'push' })
        try {
          const next = await pushGistBackup(
            current,
            prefsRef.current,
            updatedAtRef.current,
          )
          persistConfig(next)
          setStatus({
            state: 'ok',
            at: next.lastSyncedAt ?? new Date().toISOString(),
            direction: 'push',
          })
        } catch (err) {
          setStatus({
            state: 'error',
            message: err instanceof Error ? err.message : 'Push failed',
          })
        }
      })()
    }, PUSH_DEBOUNCE_MS)

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    }
  }, [connected, opts.online, opts.prefs, opts.updatedAt, persistConfig])

  async function connectCreate() {
    const token = tokenInput.trim()
    if (!token) {
      setStatus({ state: 'error', message: 'Paste a GitHub token first.' })
      return
    }
    setStatus({ state: 'syncing', direction: 'create' })
    try {
      const next = await createSecretGist(
        token,
        prefsRef.current,
        updatedAtRef.current,
      )
      suppressPushUntilRef.current = Date.now() + PUSH_DEBOUNCE_MS + 500
      initialPullDoneRef.current = true
      persistConfig(next)
      setTokenInput('')
      setGistIdInput(next.gistId)
      setStatus({
        state: 'ok',
        at: next.lastSyncedAt ?? new Date().toISOString(),
        direction: 'create',
      })
    } catch (err) {
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Could not create gist',
      })
    }
  }

  async function connectAttach() {
    const token = tokenInput.trim()
    const gistId = gistIdInput.trim()
    if (!token || !gistId) {
      setStatus({
        state: 'error',
        message: 'Paste both a token and an existing gist id.',
      })
      return
    }
    const next: GistSyncConfig = { token, gistId }
    setTokenInput('')
    setStatus({ state: 'syncing', direction: 'pull' })
    try {
      const result = await reconcileGistBackup({
        config: next,
        localPrefs: prefsRef.current,
        localUpdatedAt: updatedAtRef.current,
      })
      suppressPushUntilRef.current = Date.now() + PUSH_DEBOUNCE_MS + 500
      initialPullDoneRef.current = true
      persistConfig(result.config)
      if (result.applyPrefs && result.applyUpdatedAt) {
        applyingRemoteRef.current = true
        applyRef.current(result.applyPrefs, result.applyUpdatedAt)
        queueMicrotask(() => {
          applyingRemoteRef.current = false
        })
      }
      setGistIdInput(result.config.gistId)
      setStatus({
        state: 'ok',
        at: result.config.lastSyncedAt ?? new Date().toISOString(),
        direction: result.direction,
      })
    } catch (err) {
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Could not attach gist',
      })
    }
  }

  function disconnect() {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    persistConfig(null)
    initialPullDoneRef.current = false
    setStatus({ state: 'idle' })
  }

  return {
    config,
    status,
    tokenInput,
    setTokenInput,
    gistIdInput,
    setGistIdInput,
    connectCreate,
    connectAttach,
    disconnect,
    syncNow: runReconcile,
  }
}
