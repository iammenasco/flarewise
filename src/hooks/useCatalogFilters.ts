import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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

/** Delay before committing search draft to the URL (shareable `?q=`). */
export const SEARCH_URL_DEBOUNCE_MS = 200

type PatchOptions = {
  /** Pass `null` to close the drawer in the same URL write as filter changes. */
  item?: string | null
}

export function buildSearchParams(
  merged: CatalogFilters,
  item: string | null,
): URLSearchParams {
  const sp = new URLSearchParams()
  if (merged.q) sp.set('q', merged.q)
  if (merged.mode !== 'all') sp.set('mode', merged.mode)
  if (merged.meal) sp.set('meal', merged.meal)
  if (merged.region) sp.set('region', merged.region)
  if (merged.tag) sp.set('tag', merged.tag)
  if (merged.cost) sp.set('cost', merged.cost)
  if (merged.place !== 'home') sp.set('place', merged.place)
  if (merged.venue) sp.set('venue', merged.venue)
  if (item) sp.set('item', item)
  return sp
}

export function useCatalogFilters(prefs: CatalogPreferences) {
  const [params, setParams] = useSearchParams()
  const paramKey = params.toString()
  const urlFilters = useMemo(
    () => readFilters(new URLSearchParams(paramKey)),
    [paramKey],
  )

  const [draftQ, setDraftQ] = useState(urlFilters.q)
  const deferredQ = useDeferredValue(draftQ)
  /** Skip one URL→draft sync after we ourselves wrote `q` (avoids clobbering mid-type). */
  const skipNextUrlSync = useRef(false)

  useEffect(() => {
    if (skipNextUrlSync.current) {
      skipNextUrlSync.current = false
      return
    }
    setDraftQ(urlFilters.q)
  }, [urlFilters.q])

  const filters = useMemo(
    () => ({ ...urlFilters, q: draftQ }),
    [urlFilters, draftQ],
  )

  const searchFilters = useMemo(
    () => ({ ...urlFilters, q: deferredQ }),
    [urlFilters, deferredQ],
  )

  const fuse = useMemo(() => createFoodSearch(allFoods), [])

  function writeUrl(
    next: Partial<CatalogFilters>,
    opts: PatchOptions = {},
  ) {
    const merged = { ...urlFilters, q: draftQ, ...next }
    const item =
      'item' in opts ? (opts.item ?? null) : params.get('item')
    if ('q' in next) {
      skipNextUrlSync.current = true
      setDraftQ(merged.q)
    }
    setParams(buildSearchParams(merged, item), { replace: true })
  }

  function patch(next: Partial<CatalogFilters>, opts?: PatchOptions) {
    writeUrl(next, opts)
  }

  /** Update search text immediately; URL/`?q=` catches up after debounce. */
  function setQuery(q: string) {
    setDraftQ(q)
  }

  function setSelected(id: string | null) {
    writeUrl({}, { item: id })
  }

  // Debounce draft → shareable URL (does not block the input).
  useEffect(() => {
    if (draftQ === urlFilters.q) return
    const timer = window.setTimeout(() => {
      skipNextUrlSync.current = true
      const item = params.get('item')
      setParams(
        buildSearchParams({ ...urlFilters, q: draftQ }, item),
        { replace: true },
      )
    }, SEARCH_URL_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
    // params/setParams intentionally omitted: we only re-arm when draft or URL filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce commit snapshot
  }, [draftQ, urlFilters, paramKey])

  const selectedId = params.get('item')

  const guardKey = [
    prefs.minScore,
    prefs.guardrails.citrusFreeOnly,
    prefs.guardrails.lactoseSafeOnly,
    prefs.guardrails.toasterOvenOnly,
    prefs.guardrails.grabAndGoOnly,
    prefs.guardrails.cruiseMode,
    prefs.guardrails.showDangerZone,
    prefs.starredIds.join(','),
    prefs.groceryIds.join(','),
    JSON.stringify(prefs.personalStatus),
  ].join('|')

  const filtered: CrohnsFoodItem[] = useMemo(() => {
    let list = allFoods

    if (searchFilters.q.trim()) {
      list = fuse.search(searchFilters.q.trim()).map((r) => r.item)
    }

    list = list.filter((item) =>
      itemPassesFilters(item, searchFilters, prefs),
    )
    if (searchFilters.venue) {
      list = sortVenueMenu(list)
    }
    return list
    // prefs is read from the render that produced guardKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stabilize on primitives
  }, [searchFilters, fuse, guardKey])

  return {
    filters,
    filtered,
    selectedId,
    patch,
    setQuery,
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
