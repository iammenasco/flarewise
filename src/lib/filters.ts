import type {
  CatalogPreferences,
  CrohnsFoodItem,
  MealType,
  Region,
} from '../types'

export type ModeFilter = 'all' | 'starred' | 'grocery'

export const THEME_PARK_CHIPS = [
  { tag: 'disneyland', label: 'Disneyland', shortLabel: 'Disneyland' },
  {
    tag: 'california-adventure',
    label: 'California Adventure',
    shortLabel: 'DCA',
  },
  {
    tag: 'knotts-berry-farm',
    label: "Knott's Berry Farm",
    shortLabel: "Knott's",
  },
] as const

export const CRUISE_SHIP_CHIPS = [
  { tag: 'disney-wonder', label: 'Disney Wonder', shortLabel: 'Wonder' },
  { tag: 'disney-magic', label: 'Disney Magic', shortLabel: 'Magic' },
  { tag: 'disney-treasure', label: 'Disney Treasure', shortLabel: 'Treasure' },
] as const

export const VACATION_DESTINATION_CHIPS = [
  ...THEME_PARK_CHIPS,
  ...CRUISE_SHIP_CHIPS,
] as const

const VACATION_TAGS = new Set([
  'cruise',
  'vacation',
  'theme-park',
  'disney-cruise',
  'disney-wonder',
  'disney-magic',
  'disney-treasure',
  'disneyland',
  'california-adventure',
  'dca',
  'downtown-disney',
  'knotts-berry-farm',
  'knotts',
])

export function isVacationTag(tag: string): boolean {
  const lower = tag.trim().toLowerCase()
  return VACATION_TAGS.has(lower) || lower.startsWith('disney-')
}

/** Alias kept for backwards compatibility with existing imports/tests. */
export const isCruiseTag = isVacationTag

export function isCruiseOrVacationItem(item: CrohnsFoodItem): boolean {
  return item.tags.some((t) => isVacationTag(t))
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

  // Vacation filter: unselected by default so cruise & theme-park items stay
  // tucked out of everyday browsing unless Vacation mode or a vacation tag is active.
  const isVacation = isCruiseOrVacationItem(item)
  const tagIsVacation = Boolean(filters.tag && isVacationTag(filters.tag))
  if (prefs.guardrails.cruiseMode) {
    if (!isVacation) return false
  } else if (isVacation && !tagIsVacation) {
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
