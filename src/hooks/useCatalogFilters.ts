import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { allFoods } from '../data'
import {
  itemPassesFilters,
  readFilters,
  sortVenueMenu,
  type CatalogFilters,
} from '../lib/filters'
import { createFoodSearch } from '../lib/search'
import type { CatalogPreferences, CrohnsFoodItem } from '../types'

export type { CatalogFilters } from '../lib/filters'
export type { ModeFilter } from '../lib/filters'

type PatchOptions = {
  /** Pass `null` to close the drawer in the same URL write as filter changes. */
  item?: string | null
}

export function useCatalogFilters(prefs: CatalogPreferences) {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const fuse = useMemo(() => createFoodSearch(allFoods), [])

  function writeUrl(
    next: Partial<CatalogFilters>,
    opts: PatchOptions = {},
  ) {
    const merged = { ...filters, ...next }
    const sp = new URLSearchParams()
    if (merged.q) sp.set('q', merged.q)
    if (merged.mode !== 'all') sp.set('mode', merged.mode)
    if (merged.meal) sp.set('meal', merged.meal)
    if (merged.region) sp.set('region', merged.region)
    if (merged.tag) sp.set('tag', merged.tag)
    if (merged.cost) sp.set('cost', merged.cost)
    if (merged.place !== 'home') sp.set('place', merged.place)
    if (merged.venue) sp.set('venue', merged.venue)

    const item = 'item' in opts ? opts.item : params.get('item')
    if (item) sp.set('item', item)

    setParams(sp, { replace: true })
  }

  function patch(next: Partial<CatalogFilters>, opts?: PatchOptions) {
    writeUrl(next, opts)
  }

  function setSelected(id: string | null) {
    writeUrl({}, { item: id })
  }

  const selectedId = params.get('item')

  const filtered: CrohnsFoodItem[] = useMemo(() => {
    let list = allFoods

    if (filters.q.trim()) {
      list = fuse.search(filters.q.trim()).map((r) => r.item)
    }

    list = list.filter((item) => itemPassesFilters(item, filters, prefs))
    if (filters.venue) {
      list = sortVenueMenu(list)
    }
    return list
  }, [filters, fuse, prefs])

  return {
    filters,
    filtered,
    selectedId,
    patch,
    setSelected,
  }
}

export function pickForMe(
  items: CrohnsFoodItem[],
  countGroups = true,
): CrohnsFoodItem[] {
  const pool = items.filter((i) => i.safetyTier !== 'danger-zone')
  const breakfast = pool.filter((i) =>
    i.mealTypes.some((m) => m === 'breakfast' || m === 'snack'),
  )
  const lunchDinner = pool.filter((i) =>
    i.mealTypes.some((m) => m === 'lunch' || m === 'dinner'),
  )
  const takeout = pool.filter(
    (i) =>
      i.mealTypes.some((m) => m === 'takeout') || i.convenienceScore >= 5,
  )

  function sample(arr: CrohnsFoodItem[]) {
    if (!arr.length) return null
    return arr[Math.floor(Math.random() * arr.length)]
  }

  if (!countGroups) return pool.slice(0, 3)

  const picks: CrohnsFoodItem[] = []
  const a = sample(breakfast)
  const b = sample(lunchDinner.filter((i) => i.id !== a?.id))
  const c = sample(takeout.filter((i) => i.id !== a?.id && i.id !== b?.id))
  if (a) picks.push(a)
  if (b) picks.push(b)
  if (c) picks.push(c)

  // Fill if categories were thin
  while (picks.length < 3 && pool.length) {
    const next = sample(pool.filter((i) => !picks.some((p) => p.id === i.id)))
    if (!next) break
    picks.push(next)
  }
  return picks
}
