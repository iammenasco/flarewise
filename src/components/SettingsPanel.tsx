import { Monitor, Moon, Sun } from 'lucide-react'
import { BackupRestorePanel } from './BackupRestorePanel'
import { Chip } from './FilterBar'
import { THEME_PREFERENCES, type ThemePreference } from '../lib/theme'
import type { CatalogPreferences } from '../types'

const THEME_ICONS = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const

type SettingsPanelProps = {
  prefs: CatalogPreferences
  updatedAt: string
  onToggleShowServerCard: () => void
  onTheme: (theme: ThemePreference) => void
  downloadBackup: () => void
  restoreBackup: (raw: string) => boolean
  applySyncedPrefs: (prefs: CatalogPreferences, updatedAt: string) => void
}

export function SettingsPanel({
  prefs,
  updatedAt,
  onToggleShowServerCard,
  onTheme,
  downloadBackup,
  restoreBackup,
  applySyncedPrefs,
}: SettingsPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Preferences
        </p>
        <div className="space-y-2.5">
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={prefs.showServerCard}
                onClick={onToggleShowServerCard}
              >
                Server card on food details
              </Chip>
            </div>
            <p className="muted mt-1.5 text-xs">
              High-contrast order card for servers, plus one-tap prep copy.
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--brand-ink)]/70">
              Appearance
            </p>
            <div
              className="flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label="Appearance"
            >
              {THEME_PREFERENCES.map((item) => {
                const Icon = THEME_ICONS[item.id]
                return (
                  <Chip
                    key={item.id}
                    active={prefs.theme === item.id}
                    onClick={() => onTheme(item.id)}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {item.label}
                  </Chip>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <BackupRestorePanel
        prefs={prefs}
        updatedAt={updatedAt}
        downloadBackup={downloadBackup}
        restoreBackup={restoreBackup}
        applySyncedPrefs={applySyncedPrefs}
      />
    </div>
  )
}
