import type {
  CatalogPreferences,
  CrohnsFoodItem,
  MealType,
  Region,
} from '../types'

export type ModeFilter = 'all' | 'starred' | 'grocery'

export const CRUISE_SHIP_CHIPS = [
  { tag: 'disney-wonder', label: 'Disney Wonder', shortLabel: 'Wonder' },
  { tag: 'disney-magic', label: 'Disney Magic', shortLabel: 'Magic' },
  { tag: 'disney-treasure', label: 'Disney Treasure', shortLabel: 'Treasure' },
] as const

const CRUISE_TAGS = new Set([
  'cruise',
  'vacation',
  'disney-cruise',
  'disney-wonder',
  'disney-magic',
  'disney-treasure',
])

export function isCruiseTag(tag: string): boolean {
  const lower = tag.trim().toLowerCase()
  return CRUISE_TAGS.has(lower) || lower.startsWith('disney-')
}

export function isCruiseOrVacationItem(item: CrohnsFoodItem): boolean {
  return item.tags.some((t) => isCruiseTag(t))
}

export interface CatalogFilters {
  q: string
  mode: ModeFilter
  meal: MealType | ''
  region: Region | ''
  tag: string
  cost: '' | '1' | '2' | '3'
}

export function readFilters(params: URLSearchParams): CatalogFilters {
  const mode = params.get('mode')
  const cost = params.get('cost')
  return {
    q: params.get('q') ?? '',
    mode: mode === 'starred' || mode === 'grocery' ? mode : 'all',
    meal: (params.get('meal') as MealType) || '',
    region: (params.get('region') as Region) || '',
    tag: params.get('tag') ?? '',
    cost: cost === '1' || cost === '2' || cost === '3' ? cost : '',
  }
}

/** Pure predicate used by the catalog list and unit tests. */
export function itemPassesFilters(
  item: CrohnsFoodItem,
  filters: CatalogFilters,
  prefs: CatalogPreferences,
): boolean {
  if (prefs.personalStatus[item.id] === 'trigger') return false

  // Cruise / Vacation filter: unselected by default so cruise items stay
  // tucked out of everyday browsing unless Cruise mode or a cruise tag is active.
  const isCruise = isCruiseOrVacationItem(item)
  const tagIsCruise = Boolean(filters.tag && isCruiseTag(filters.tag))
  if (prefs.guardrails.cruiseMode) {
    if (!isCruise) return false
  } else if (isCruise && !tagIsCruise) {
    return false
  }

  // Danger-zone / avoid cards only appear when explicitly enabled.
  // Everything else still respects the Today dial (minScore).
  if (item.safetyTier === 'danger-zone') {
    if (!prefs.guardrails.showDangerZone) return false
  } else if (item.crohnsScore < prefs.minScore) {
    return false
  }

  if (prefs.guardrails.citrusFreeOnly && !item.citrusFree) return false
  if (prefs.guardrails.lactoseSafeOnly && !item.lactoseSafe) return false
  if (
    prefs.guardrails.toasterOvenOnly &&
    !item.prepMethod.includes('toaster-oven')
  ) {
    return false
  }
  if (prefs.guardrails.grabAndGoOnly && item.convenienceScore < 5) {
    return false
  }

  if (filters.mode === 'starred' && !prefs.starredIds.includes(item.id)) {
    return false
  }
  if (filters.mode === 'grocery' && !prefs.groceryIds.includes(item.id)) {
    return false
  }
  if (filters.meal && !item.mealTypes.includes(filters.meal)) return false
  if (filters.region && item.region !== filters.region) return false
  if (filters.tag && !item.tags.includes(filters.tag)) return false
  if (filters.cost && String(item.costTier) !== filters.cost) return false

  return true
}

export function countActiveFilters(
  filters: CatalogFilters,
  guardrails: {
    lactoseSafeOnly: boolean
    toasterOvenOnly: boolean
    grabAndGoOnly: boolean
    citrusFreeOnly: boolean
    cruiseMode?: boolean
    showDangerZone: boolean
  },
) {
  let n = 0
  if (filters.meal) n += 1
  if (filters.region) n += 1
  if (filters.tag) n += 1
  if (filters.cost) n += 1
  if (guardrails.lactoseSafeOnly) n += 1
  if (guardrails.toasterOvenOnly) n += 1
  if (guardrails.grabAndGoOnly) n += 1
  if (guardrails.cruiseMode) n += 1
  // citrusFreeOnly defaults on — don't count it as an "extra" filter
  if (guardrails.showDangerZone) n += 1
  return n
}
