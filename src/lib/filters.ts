import type {
  CatalogPreferences,
  CrohnsFoodItem,
  MealType,
  Region,
  SafetyTier,
} from '../types'

export type ModeFilter = 'all' | 'starred' | 'grocery'

export type PlaceContextId = 'home' | 'theme-parks' | 'cruise'

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

const THEME_PARK_TAGS = [
  'theme-park',
  'disneyland',
  'california-adventure',
  'dca',
  'downtown-disney',
  'knotts-berry-farm',
  'knotts',
  'buena-park',
] as const

const CRUISE_TAGS = [
  'cruise',
  'disney-cruise',
  'disney-wonder',
  'disney-magic',
  'disney-treasure',
  'alaska-cruise',
  'christmas-cruise',
  'plaza-de-coco',
] as const

/** Search scope: Everyday / Parks / Cruise (URL param still `place`). */
export const PLACE_CONTEXTS = [
  {
    id: 'home' as const,
    label: 'Everyday',
    shortLabel: 'Everyday',
    hint: 'Everyday catalog — vacation menus stay tucked away',
    matchTags: [] as readonly string[],
    vacation: false as const,
  },
  {
    id: 'theme-parks' as const,
    label: 'Parks',
    shortLabel: 'Parks',
    hint: "Disneyland, DCA, Knott's",
    matchTags: THEME_PARK_TAGS,
    vacation: true as const,
  },
  {
    id: 'cruise' as const,
    label: 'Cruise',
    shortLabel: 'Cruise',
    hint: 'Disney Wonder, Magic, Treasure',
    matchTags: CRUISE_TAGS,
    vacation: true as const,
  },
] as const

export type PlaceContext = (typeof PLACE_CONTEXTS)[number]

const PLACE_BY_ID = new Map<PlaceContextId, PlaceContext>(
  PLACE_CONTEXTS.map((ctx) => [ctx.id, ctx]),
)

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

const TIER_RANK: Record<SafetyTier, number> = {
  'flare-safe': 0,
  'low-risk': 1,
  'remission-road': 2,
  'danger-zone': 3,
}

export function isVacationTag(tag: string): boolean {
  const lower = tag.trim().toLowerCase()
  return VACATION_TAGS.has(lower) || lower.startsWith('disney-')
}

/** Alias kept for backwards compatibility with existing imports/tests. */
export const isCruiseTag = isVacationTag

export function isCruiseOrVacationItem(item: CrohnsFoodItem): boolean {
  return item.tags.some((t) => isVacationTag(t))
}

export function isPlaceContextId(value: string): value is PlaceContextId {
  return PLACE_BY_ID.has(value as PlaceContextId)
}

export function getPlaceContext(id: PlaceContextId): PlaceContext {
  return PLACE_BY_ID.get(id) ?? PLACE_CONTEXTS[0]
}

/**
 * Vacation browsing follows search scope (Parks/Cruise).
 * Legacy: `cruiseMode` at Everyday still unlocks vacation if a stale pref remains.
 */
export function isVacationBrowsing(
  place: PlaceContextId,
  cruiseMode: boolean,
): boolean {
  const ctx = getPlaceContext(place)
  return ctx.vacation || (place === 'home' && cruiseMode)
}

export function itemMatchesPlaceTags(
  item: CrohnsFoodItem,
  place: PlaceContextId,
): boolean {
  const ctx = getPlaceContext(place)
  if (ctx.matchTags.length === 0) return true
  return ctx.matchTags.some((tag) => item.tags.includes(tag))
}

export interface CatalogFilters {
  q: string
  mode: ModeFilter
  meal: MealType | ''
  region: Region | ''
  tag: string
  cost: '' | '1' | '2' | '3'
  /** Search scope: Everyday / Parks / Cruise (URL `place`). */
  place: PlaceContextId
  /** Exact brandOrRestaurant venue menu (URL-encoded in the query string). */
  venue: string
}

export function readFilters(params: URLSearchParams): CatalogFilters {
  const mode = params.get('mode')
  const cost = params.get('cost')
  const placeRaw = params.get('place') ?? ''
  return {
    q: params.get('q') ?? '',
    mode: mode === 'starred' || mode === 'grocery' ? mode : 'all',
    meal: (params.get('meal') as MealType) || '',
    region: (params.get('region') as Region) || '',
    tag: params.get('tag') ?? '',
    cost: cost === '1' || cost === '2' || cost === '3' ? cost : '',
    place: isPlaceContextId(placeRaw) ? placeRaw : 'home',
    venue: params.get('venue') ?? '',
  }
}

/** Pure predicate used by the catalog list and unit tests. */
export function itemPassesFilters(
  item: CrohnsFoodItem,
  filters: CatalogFilters,
  prefs: CatalogPreferences,
): boolean {
  if (prefs.personalStatus[item.id] === 'trigger') return false

  // Vacation filter: Everyday hides parks/cruise menus unless scope is Parks/
  // Cruise (or a legacy Everyday + cruiseMode pref / vacation destination tag).
  const isVacation = isCruiseOrVacationItem(item)
  const tagIsVacation = Boolean(filters.tag && isVacationTag(filters.tag))
  const vacationBrowsing = isVacationBrowsing(
    filters.place,
    prefs.guardrails.cruiseMode,
  )
  if (vacationBrowsing) {
    if (!isVacation) return false
  } else if (isVacation && !tagIsVacation) {
    return false
  }

  if (!itemMatchesPlaceTags(item, filters.place)) return false

  if (filters.venue) {
    if ((item.brandOrRestaurant ?? '').trim() !== filters.venue.trim()) {
      return false
    }
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

/** Rank venue menus flare-safe → everyday → careful → avoid, then score. */
export function compareVenueMenuItems(
  a: CrohnsFoodItem,
  b: CrohnsFoodItem,
): number {
  const tierDiff = TIER_RANK[a.safetyTier] - TIER_RANK[b.safetyTier]
  if (tierDiff !== 0) return tierDiff
  return b.crohnsScore - a.crohnsScore
}

export function sortVenueMenu(items: CrohnsFoodItem[]): CrohnsFoodItem[] {
  return [...items].sort(compareVenueMenuItems)
}

/** Distinct brands in a filtered list, busiest first (for venue chips). */
export function listVenues(
  items: CrohnsFoodItem[],
  limit = 24,
): { brand: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const brand = (item.brandOrRestaurant ?? '').trim()
    if (!brand) continue
    counts.set(brand, (counts.get(brand) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand))
    .slice(0, limit)
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
  if (filters.place !== 'home') n += 1
  if (filters.venue) n += 1
  if (guardrails.lactoseSafeOnly) n += 1
  if (guardrails.toasterOvenOnly) n += 1
  if (guardrails.grabAndGoOnly) n += 1
  // Parks/Cruise already counted via place; only count legacy Vacation at Home.
  if (guardrails.cruiseMode && filters.place === 'home') n += 1
  // citrusFreeOnly defaults on — don't count it as an "extra" filter
  if (guardrails.showDangerZone) n += 1
  return n
}
