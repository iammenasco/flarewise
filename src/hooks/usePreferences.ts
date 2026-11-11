import { useEffect, useState } from 'react'
import {
  defaultPreferences,
  exportPreferences,
  importPreferences,
  loadPreferences,
  loadPrefsUpdatedAt,
  prefsFromBackup,
  savePreferences,
  savePrefsUpdatedAt,
  touchPrefsUpdatedAt,
} from '../lib/storage'
import type {
  CatalogPreferences,
  Guardrails,
  PersonalStatus,
  ThemePreference,
} from '../types'

export function usePreferences() {
  const [prefs, setPrefs] = useState<CatalogPreferences>(() =>
    typeof window === 'undefined' ? defaultPreferences : loadPreferences(),
  )
  const [updatedAt, setUpdatedAt] = useState<string>(() =>
    typeof window === 'undefined'
      ? new Date(0).toISOString()
      : loadPrefsUpdatedAt(),
  )
  const [ready] = useState(() => typeof window !== 'undefined')

  useEffect(() => {
    if (!ready) return
    savePreferences(prefs)
  }, [prefs, ready])

  function mutate(
    updater: (prev: CatalogPreferences) => CatalogPreferences,
  ) {
    setUpdatedAt(touchPrefsUpdatedAt())
    setPrefs(updater)
  }

  function toggleStar(id: string) {
    mutate((prev) => ({
      ...prev,
      starredIds: prev.starredIds.includes(id)
        ? prev.starredIds.filter((x) => x !== id)
        : [...prev.starredIds, id],
    }))
  }

  function toggleGrocery(id: string) {
    mutate((prev) => ({
      ...prev,
      groceryIds: prev.groceryIds.includes(id)
        ? prev.groceryIds.filter((x) => x !== id)
        : [...prev.groceryIds, id],
    }))
  }

  function setMinScore(minScore: number) {
    mutate((prev) => ({ ...prev, minScore }))
  }

  function setGuardrails(patch: Partial<Guardrails>) {
    mutate((prev) => {
      const next = { ...prev.guardrails, ...patch }
      if ('showDangerZone' in patch) {
        next.hideDangerZone = !patch.showDangerZone
      }
      return { ...prev, guardrails: next }
    })
  }

  function setShowServerCard(showServerCard: boolean) {
    mutate((prev) => ({ ...prev, showServerCard }))
  }

  function setTheme(theme: ThemePreference) {
    mutate((prev) => ({ ...prev, theme }))
  }

  function setPersonalStatus(id: string, status: PersonalStatus | undefined) {
    mutate((prev) => {
      const personalStatus = { ...prev.personalStatus }
      if (!status) delete personalStatus[id]
      else personalStatus[id] = status
      return { ...prev, personalStatus }
    })
  }

  function toggleCheckedIngredient(ingredient: string) {
    mutate((prev) => ({
      ...prev,
      checkedGroceryIngredients: prev.checkedGroceryIngredients.includes(
        ingredient,
      )
        ? prev.checkedGroceryIngredients.filter((x) => x !== ingredient)
        : [...prev.checkedGroceryIngredients, ingredient],
    }))
  }

  function clearGrocery() {
    mutate((prev) => ({
      ...prev,
      groceryIds: [],
      checkedGroceryIngredients: [],
    }))
  }

  function downloadBackup() {
    const blob = new Blob([exportPreferences(prefs, updatedAt)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flarewise-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function restoreBackup(raw: string) {
    const next = importPreferences(raw)
    if (!next) return false
    const at = next.updatedAt ?? new Date().toISOString()
    savePrefsUpdatedAt(at)
    setUpdatedAt(at)
    setPrefs(prefsFromBackup(next))
    return true
  }

  /** Apply remote prefs without advancing local updatedAt past the remote stamp. */
  function applySyncedPrefs(
    next: CatalogPreferences,
    remoteUpdatedAt: string,
  ) {
    savePrefsUpdatedAt(remoteUpdatedAt)
    setUpdatedAt(remoteUpdatedAt)
    setPrefs(next)
  }

  return {
    prefs,
    updatedAt,
    ready,
    toggleStar,
    toggleGrocery,
    setMinScore,
    setGuardrails,
    setShowServerCard,
    setTheme,
    setPersonalStatus,
    toggleCheckedIngredient,
    clearGrocery,
    downloadBackup,
    restoreBackup,
    applySyncedPrefs,
  }
}
