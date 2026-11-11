import { useEffect, useState } from 'react'
import {
  defaultPreferences,
  exportPreferences,
  importPreferences,
  loadPreferences,
  savePreferences,
} from '../lib/storage'
import type { CatalogPreferences, Guardrails, PersonalStatus } from '../types'

export function usePreferences() {
  const [prefs, setPrefs] = useState<CatalogPreferences>(() =>
    typeof window === 'undefined' ? defaultPreferences : loadPreferences(),
  )
  const [ready] = useState(() => typeof window !== 'undefined')

  useEffect(() => {
    if (!ready) return
    savePreferences(prefs)
  }, [prefs, ready])

  function toggleStar(id: string) {
    setPrefs((prev) => ({
      ...prev,
      starredIds: prev.starredIds.includes(id)
        ? prev.starredIds.filter((x) => x !== id)
        : [...prev.starredIds, id],
    }))
  }

  function toggleGrocery(id: string) {
    setPrefs((prev) => ({
      ...prev,
      groceryIds: prev.groceryIds.includes(id)
        ? prev.groceryIds.filter((x) => x !== id)
        : [...prev.groceryIds, id],
    }))
  }

  function setMinScore(minScore: number) {
    setPrefs((prev) => ({ ...prev, minScore }))
  }

  function setGuardrails(patch: Partial<Guardrails>) {
    setPrefs((prev) => {
      const next = { ...prev.guardrails, ...patch }
      if ('showDangerZone' in patch) {
        next.hideDangerZone = !patch.showDangerZone
      }
      return { ...prev, guardrails: next }
    })
  }

  function setShowServerCard(showServerCard: boolean) {
    setPrefs((prev) => ({ ...prev, showServerCard }))
  }

  function setPersonalStatus(id: string, status: PersonalStatus | undefined) {
    setPrefs((prev) => {
      const personalStatus = { ...prev.personalStatus }
      if (!status) delete personalStatus[id]
      else personalStatus[id] = status
      return { ...prev, personalStatus }
    })
  }

  function toggleCheckedIngredient(ingredient: string) {
    setPrefs((prev) => ({
      ...prev,
      checkedGroceryIngredients: prev.checkedGroceryIngredients.includes(
        ingredient,
      )
        ? prev.checkedGroceryIngredients.filter((x) => x !== ingredient)
        : [...prev.checkedGroceryIngredients, ingredient],
    }))
  }

  function clearGrocery() {
    setPrefs((prev) => ({
      ...prev,
      groceryIds: [],
      checkedGroceryIngredients: [],
    }))
  }

  function downloadBackup() {
    const blob = new Blob([exportPreferences(prefs)], {
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
    if (next) setPrefs(next)
    return Boolean(next)
  }

  return {
    prefs,
    ready,
    toggleStar,
    toggleGrocery,
    setMinScore,
    setGuardrails,
    setShowServerCard,
    setPersonalStatus,
    toggleCheckedIngredient,
    clearGrocery,
    downloadBackup,
    restoreBackup,
  }
}
