import { useGistSync } from '../hooks/useGistSync'
import { useOnline } from '../hooks/useOnline'
import type { CatalogPreferences } from '../types'

type BackupRestorePanelProps = {
  prefs: CatalogPreferences
  updatedAt: string
  downloadBackup: () => void
  restoreBackup: (raw: string) => boolean
  applySyncedPrefs: (prefs: CatalogPreferences, updatedAt: string) => void
}

function formatSyncTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function BackupRestorePanel({
  prefs,
  updatedAt,
  downloadBackup,
  restoreBackup,
  applySyncedPrefs,
}: BackupRestorePanelProps) {
  const online = useOnline()
  const gist = useGistSync({
    prefs,
    updatedAt,
    online,
    applySyncedPrefs,
  })

  const statusLine = (() => {
    if (gist.status.state === 'syncing') {
      return gist.status.direction === 'push'
        ? 'Syncing to Gist…'
        : gist.status.direction === 'create'
          ? 'Creating secret Gist…'
          : 'Checking Gist…'
    }
    if (gist.status.state === 'error') return gist.status.message
    if (gist.status.state === 'ok') {
      return `Last synced ${formatSyncTime(gist.status.at)}`
    }
    if (gist.config?.lastSyncedAt) {
      return `Last synced ${formatSyncTime(gist.config.lastSyncedAt)}`
    }
    return null
  })()

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Backup & restore
        </p>
        <p className="mb-2 text-xs leading-relaxed text-[var(--brand-ink)]/65">
          Download a JSON file, or import one from another device.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 font-semibold text-[var(--brand-ink)]"
            onClick={downloadBackup}
          >
            Download backup
          </button>
          <label className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 font-semibold text-[var(--brand-ink)]">
            Import backup
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const text = await file.text()
                restoreBackup(text)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      <div className="border-t border-[var(--brand-ink)]/10 pt-3">
        <p className="font-semibold text-[var(--brand-ink)]">
          Optional: sync to a secret GitHub Gist
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--brand-ink)]/65">
          Set once, then stars / grocery / personal notes stay current while
          this tab is open. Uses a{' '}
          <span className="font-semibold">secret</span> gist and a
          fine-grained token with <span className="font-semibold">Gists</span>{' '}
          only. The token stays on this device (localStorage) — never in the
          gist body.
        </p>

        {gist.config ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[var(--brand-ink)]/80">
              Connected to gist{' '}
              <code className="rounded bg-[var(--brand-soft)] px-1">
                {gist.config.gistId}
              </code>
              {gist.config.htmlUrl ? (
                <>
                  {' · '}
                  <a
                    className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
                    href={gist.config.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    open
                  </a>
                </>
              ) : null}
            </p>
            {statusLine ? (
              <p
                className={
                  gist.status.state === 'error'
                    ? 'text-xs text-red-700 dark:text-red-300'
                    : 'text-xs text-[var(--brand-ink)]/65'
                }
              >
                {statusLine}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 font-semibold text-[var(--brand-ink)]"
                onClick={() => void gist.syncNow()}
                disabled={!online || gist.status.state === 'syncing'}
              >
                Sync now
              </button>
              <button
                type="button"
                className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 font-semibold text-[var(--brand-ink)]"
                onClick={gist.disconnect}
              >
                Disconnect
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--brand-ink)]/55">
              Second device: paste the same token + this gist id under Attach.
              Disconnect clears the token here; it does not delete the gist.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <label className="block text-xs font-semibold text-[var(--brand-ink)]">
              GitHub token (gist scope)
              <input
                type="password"
                autoComplete="off"
                spellCheck={false}
                className="mt-1 w-full rounded-xl border border-[var(--brand-ink)]/15 bg-transparent px-3 py-2 font-normal text-[var(--brand-ink)]"
                placeholder="github_pat_…"
                value={gist.tokenInput}
                onChange={(e) => gist.setTokenInput(e.target.value)}
              />
            </label>
            <label className="block text-xs font-semibold text-[var(--brand-ink)]">
              Existing gist id (second device / reuse)
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                className="mt-1 w-full rounded-xl border border-[var(--brand-ink)]/15 bg-transparent px-3 py-2 font-normal text-[var(--brand-ink)]"
                placeholder="optional"
                value={gist.gistIdInput}
                onChange={(e) => gist.setGistIdInput(e.target.value)}
              />
            </label>
            {statusLine && gist.status.state === 'error' ? (
              <p className="text-xs text-red-700 dark:text-red-300">
                {statusLine}
              </p>
            ) : null}
            {gist.status.state === 'syncing' ? (
              <p className="text-xs text-[var(--brand-ink)]/65">{statusLine}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-[var(--brand)] px-3 py-2 font-semibold text-white"
                onClick={() => void gist.connectCreate()}
                disabled={!online || gist.status.state === 'syncing'}
              >
                Create secret gist
              </button>
              <button
                type="button"
                className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 font-semibold text-[var(--brand-ink)]"
                onClick={() => void gist.connectAttach()}
                disabled={!online || gist.status.state === 'syncing'}
              >
                Attach existing
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--brand-ink)]/55">
              Create a fine-grained PAT with{' '}
              <a
                className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
                href="https://github.com/settings/personal-access-tokens"
                target="_blank"
                rel="noreferrer"
              >
                Gists: Read and write
              </a>
              . Sync only runs while Flarewise is open.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
