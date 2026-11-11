import { describe, expect, it } from 'vitest'
import { allFoods } from '../data'
import { defaultPreferences } from './storage'
import {
  compareVenueMenuItems,
  countActiveFilters,
  isCheckItem,
  isCruiseOrVacationItem,
  isMakeItem,
  isOrderItem,
  itemMatchesCatalogJob,
  itemPassesFilters,
  listVenues,
  readFilters,
  sortVenueMenu,
  type CatalogFilters,
} from './filters'
import type { CrohnsFoodItem } from '../types'

const baseItem: CrohnsFoodItem = {
  id: 'chicken-broth',
  name: 'Chicken broth',
  categoryFolder: 'drinks-sauces',
  crohnsScore: 9.5,
  safetyTier: 'flare-safe',
  mealTypes: ['drink', 'sauce'],
  region: 'American',
  costTier: 1,
  convenienceScore: 5,
  prepMethod: ['ready-to-eat'],
  fiberGramsPerServing: 0,
  lactoseSafe: true,
  citrusFree: true,
  tags: ['broth', 'flare-safe', 'savory'],
  searchKeywords: ['stock', 'soup'],
  whyItWorks: 'Gentle liquid.',
  prepOrOrderInstructions: 'Warm and sip.',
}

const openPrefs = {
  ...defaultPreferences,
  minScore: 6.5,
  guardrails: {
    ...defaultPreferences.guardrails,
    citrusFreeOnly: false,
  },
}

const emptyFilters: CatalogFilters = {
  q: '',
  mode: 'all',
  meal: '',
  region: '',
  tag: '',
  cost: '',
  job: 'make',
  place: 'home',
  venue: '',
}

describe('catalog job predicates', () => {
  const makeItem: CrohnsFoodItem = {
    ...baseItem,
    id: 'skillet-eggs',
    name: 'Skillet eggs',
    prepMethod: ['skillet', 'stovetop'],
    mealTypes: ['breakfast'],
    tags: ['eggs', 'homemade'],
  }
  const orderItem: CrohnsFoodItem = {
    ...baseItem,
    id: 'cafe-burrito',
    name: 'Cafe burrito',
    prepMethod: ['ready-to-eat'],
    mealTypes: ['lunch', 'takeout'],
    tags: ['restaurant', 'mexican'],
    brandOrRestaurant: 'Café Rio',
  }
  const driveThru: CrohnsFoodItem = {
    ...baseItem,
    id: 'drive-fries',
    name: 'Drive-thru fries',
    prepMethod: ['ready-to-eat', 'drive-thru'],
    mealTypes: ['snack'],
    tags: ['potato'],
    brandOrRestaurant: "Dan's Drive-In",
  }
  const checkItem: CrohnsFoodItem = {
    ...baseItem,
    id: 'fresh-banana',
    name: 'Banana',
    prepMethod: ['ready-to-eat'],
    mealTypes: ['snack'],
    tags: ['produce', 'fruit'],
    brandOrRestaurant: 'Fresh Produce Staple',
  }

  it('classifies Make / Order / Check without using brand presence alone', () => {
    expect(isMakeItem(makeItem)).toBe(true)
    expect(isOrderItem(makeItem)).toBe(false)
    expect(isCheckItem(makeItem)).toBe(false)

    expect(isOrderItem(orderItem)).toBe(true)
    expect(isMakeItem(orderItem)).toBe(false)
    expect(isCheckItem(orderItem)).toBe(false)

    expect(isOrderItem(driveThru)).toBe(true)
    expect(isCheckItem(checkItem)).toBe(true)
    expect(isMakeItem(checkItem)).toBe(false)
    expect(isOrderItem(checkItem)).toBe(false)

    // brand alone is not Order — Check staples often have a brand string
    expect(isOrderItem(checkItem)).toBe(false)
  })

  it('groceryIngredients counts as Make even when ready-to-eat', () => {
    const kit: CrohnsFoodItem = {
      ...baseItem,
      id: 'soup-kit',
      prepMethod: ['ready-to-eat'],
      groceryIngredients: ['broth', 'rice'],
      tags: ['grocery'],
    }
    expect(isMakeItem(kit)).toBe(true)
    expect(isCheckItem(kit)).toBe(false)
  })

  it('itemMatchesCatalogJob ignores job while vacation browsing', () => {
    expect(itemMatchesCatalogJob(makeItem, 'order', false)).toBe(false)
    expect(itemMatchesCatalogJob(orderItem, 'order', false)).toBe(true)
    expect(itemMatchesCatalogJob(makeItem, 'make', true)).toBe(true)
    expect(itemMatchesCatalogJob(orderItem, 'check', true)).toBe(true)
  })

  it('Make / Order / Check filters pass the right non-vacation items', () => {
    expect(
      itemPassesFilters(makeItem, { ...emptyFilters, job: 'make' }, openPrefs),
    ).toBe(true)
    expect(
      itemPassesFilters(orderItem, { ...emptyFilters, job: 'make' }, openPrefs),
    ).toBe(false)
    expect(
      itemPassesFilters(orderItem, { ...emptyFilters, job: 'order' }, openPrefs),
    ).toBe(true)
    expect(
      itemPassesFilters(checkItem, { ...emptyFilters, job: 'check' }, openPrefs),
    ).toBe(true)
    expect(
      itemPassesFilters(makeItem, { ...emptyFilters, job: 'check' }, openPrefs),
    ).toBe(false)
  })
})

describe('itemPassesFilters', () => {
  it('keeps items that match a tag filter', () => {
    expect(
      itemPassesFilters(
        baseItem,
        { ...emptyFilters, job: 'check', tag: 'broth' },
        openPrefs,
      ),
    ).toBe(true)
  })

  it('drops items that lack the active tag', () => {
    const toast = { ...baseItem, id: 'toast', tags: ['bread', 'toaster'] }
    expect(
      itemPassesFilters(
        toast,
        { ...emptyFilters, job: 'check', tag: 'broth' },
        openPrefs,
      ),
    ).toBe(false)
  })

  it('hides danger-zone unless showDangerZone is on', () => {
    const avoid = {
      ...baseItem,
      id: 'chili',
      safetyTier: 'danger-zone' as const,
      crohnsScore: 3,
    }
    expect(
      itemPassesFilters(
        avoid,
        { ...emptyFilters, job: 'check' },
        openPrefs,
      ),
    ).toBe(false)
    expect(
      itemPassesFilters(
        avoid,
        { ...emptyFilters, job: 'check' },
        {
          ...openPrefs,
          guardrails: { ...openPrefs.guardrails, showDangerZone: true },
        },
      ),
    ).toBe(true)
  })

  it('respects the Today dial minScore for non-avoid items', () => {
    const careful = {
      ...baseItem,
      id: 'burrito',
      crohnsScore: 7,
      safetyTier: 'remission-road' as const,
    }
    expect(
      itemPassesFilters(
        careful,
        { ...emptyFilters, job: 'check' },
        {
          ...openPrefs,
          minScore: 9,
        },
      ),
    ).toBe(false)
    expect(
      itemPassesFilters(
        careful,
        { ...emptyFilters, job: 'check' },
        {
          ...openPrefs,
          minScore: 6.5,
        },
      ),
    ).toBe(true)
  })

  it('default home hides vacation; legacy cruiseMode unlocks them', () => {
    const cruiseItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'creamy-butternut-squash-soup',
      tags: ['soup', 'disney-cruise', 'disney-wonder', 'disney-magic'],
    }
    const disneylandItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'disneyland-bengal-bbq-safari-skewer',
      tags: ['beef', 'vacation', 'disneyland'],
    }
    const knottsItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'knotts-mrs-knotts-roasted-chicken',
      tags: ['chicken', 'vacation', 'knotts-berry-farm'],
    }
    const checkFilters = { ...emptyFilters, job: 'check' as const }
    expect(itemPassesFilters(baseItem, checkFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(cruiseItem, checkFilters, openPrefs)).toBe(false)
    expect(itemPassesFilters(disneylandItem, checkFilters, openPrefs)).toBe(
      false,
    )
    expect(itemPassesFilters(knottsItem, checkFilters, openPrefs)).toBe(false)

    const vacationPrefs = {
      ...openPrefs,
      guardrails: { ...openPrefs.guardrails, cruiseMode: true },
    }
    expect(itemPassesFilters(cruiseItem, checkFilters, vacationPrefs)).toBe(
      true,
    )
    expect(
      itemPassesFilters(disneylandItem, checkFilters, vacationPrefs),
    ).toBe(true)
    expect(itemPassesFilters(knottsItem, checkFilters, vacationPrefs)).toBe(
      true,
    )
    expect(itemPassesFilters(baseItem, checkFilters, vacationPrefs)).toBe(
      false,
    )

    expect(
      itemPassesFilters(
        disneylandItem,
        { ...checkFilters, tag: 'disneyland' },
        vacationPrefs,
      ),
    ).toBe(true)
    expect(
      itemPassesFilters(
        disneylandItem,
        { ...checkFilters, tag: 'knotts-berry-farm' },
        vacationPrefs,
      ),
    ).toBe(false)
    expect(
      itemPassesFilters(
        cruiseItem,
        { ...checkFilters, tag: 'disney-wonder' },
        vacationPrefs,
      ),
    ).toBe(true)
    expect(
      itemPassesFilters(
        cruiseItem,
        { ...checkFilters, tag: 'disney-treasure' },
        vacationPrefs,
      ),
    ).toBe(false)
  })

  it('identifies committed cruise and vacation items via isCruiseOrVacationItem', () => {
    const cruiseItems = allFoods.filter(isCruiseOrVacationItem)
    expect(cruiseItems.length).toBeGreaterThanOrEqual(12)
    expect(defaultPreferences.guardrails.cruiseMode).toBe(false)
  })

  it('Filters Parks and Cruise unlock only their vacation catalogs (any job)', () => {
    const parkItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'bengal-skewer',
      tags: ['beef', 'vacation', 'theme-park', 'disneyland'],
    }
    const cruiseItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'triton-soup',
      tags: ['soup', 'disney-cruise', 'disney-wonder'],
    }
    const parkFilters: CatalogFilters = {
      ...emptyFilters,
      job: 'make',
      place: 'theme-parks',
    }
    const cruiseFilters: CatalogFilters = {
      ...emptyFilters,
      job: 'check',
      place: 'cruise',
    }
    // Vacation unlock ignores job so park/ship menus stay usable.
    expect(itemPassesFilters(parkItem, parkFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(cruiseItem, parkFilters, openPrefs)).toBe(false)
    expect(itemPassesFilters(baseItem, parkFilters, openPrefs)).toBe(false)
    expect(itemPassesFilters(cruiseItem, cruiseFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(parkItem, cruiseFilters, openPrefs)).toBe(false)
  })

  it('filters a venue menu to an exact brandOrRestaurant under Order + Parks', () => {
    const plazaChicken: CrohnsFoodItem = {
      ...baseItem,
      id: 'plaza-chicken',
      brandOrRestaurant: 'Plaza Inn (Main Street, U.S.A. · Disneyland Park)',
      tags: ['chicken', 'vacation', 'disneyland'],
      safetyTier: 'low-risk',
      crohnsScore: 8,
    }
    const other: CrohnsFoodItem = {
      ...baseItem,
      id: 'other-park',
      brandOrRestaurant: 'Carnation Cafe (Disneyland Park)',
      tags: ['soup', 'vacation', 'disneyland'],
    }
    const venueFilters: CatalogFilters = {
      ...emptyFilters,
      job: 'order',
      place: 'theme-parks',
      venue: 'Plaza Inn (Main Street, U.S.A. · Disneyland Park)',
    }
    expect(itemPassesFilters(plazaChicken, venueFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(other, venueFilters, openPrefs)).toBe(false)
  })

  it('Order job keeps everyday restaurant venue menus without vacation unlock', () => {
    const rio: CrohnsFoodItem = {
      ...baseItem,
      id: 'cafe-rio-rice',
      brandOrRestaurant: 'Café Rio',
      tags: ['restaurant', 'rice'],
      mealTypes: ['lunch', 'dinner'],
      prepMethod: ['ready-to-eat'],
    }
    expect(
      itemPassesFilters(rio, { ...emptyFilters, job: 'order' }, openPrefs),
    ).toBe(true)
    expect(
      itemPassesFilters(rio, { ...emptyFilters, job: 'make' }, openPrefs),
    ).toBe(false)
  })
})

describe('venue menu ranking', () => {
  it('sorts flare-safe before careful, then by score', () => {
    const careful: CrohnsFoodItem = {
      ...baseItem,
      id: 'careful',
      safetyTier: 'remission-road',
      crohnsScore: 7.5,
    }
    const everydayHigh: CrohnsFoodItem = {
      ...baseItem,
      id: 'everyday-high',
      safetyTier: 'low-risk',
      crohnsScore: 8.5,
    }
    const everydayLow: CrohnsFoodItem = {
      ...baseItem,
      id: 'everyday-low',
      safetyTier: 'low-risk',
      crohnsScore: 7.8,
    }
    const flare: CrohnsFoodItem = {
      ...baseItem,
      id: 'flare',
      safetyTier: 'flare-safe',
      crohnsScore: 9.2,
    }
    const sorted = sortVenueMenu([careful, everydayLow, flare, everydayHigh])
    expect(sorted.map((i) => i.id)).toEqual([
      'flare',
      'everyday-high',
      'everyday-low',
      'careful',
    ])
    expect(compareVenueMenuItems(flare, careful)).toBeLessThan(0)
  })

  it('lists venues by item count', () => {
    const items: CrohnsFoodItem[] = [
      {
        ...baseItem,
        id: 'a1',
        brandOrRestaurant: "Dan's Drive-In (Montpelier, ID)",
      },
      {
        ...baseItem,
        id: 'a2',
        brandOrRestaurant: "Dan's Drive-In (Montpelier, ID)",
      },
      {
        ...baseItem,
        id: 'b1',
        brandOrRestaurant: 'Crepes and Coffee (Garden City / Bear Lake, UT)',
      },
    ]
    expect(listVenues(items)).toEqual([
      { brand: "Dan's Drive-In (Montpelier, ID)", count: 2 },
      {
        brand: 'Crepes and Coffee (Garden City / Bear Lake, UT)',
        count: 1,
      },
    ])
  })
})

describe('readFilters', () => {
  it('reads tag from the query string', () => {
    const params = new URLSearchParams('tag=broth&mode=starred')
    expect(readFilters(params)).toMatchObject({
      tag: 'broth',
      mode: 'starred',
      job: 'make',
      place: 'home',
      venue: '',
    })
  })

  it('reads job, place and venue from the query string', () => {
    const params = new URLSearchParams(
      'job=order&place=theme-parks&venue=Plaza Inn (Main Street, U.S.A. · Disneyland Park)',
    )
    expect(readFilters(params)).toMatchObject({
      job: 'order',
      place: 'theme-parks',
      venue: 'Plaza Inn (Main Street, U.S.A. · Disneyland Park)',
    })
  })

  it('falls back to make / home for unknown job or place values', () => {
    expect(readFilters(new URLSearchParams('job=bake')).job).toBe('make')
    expect(readFilters(new URLSearchParams('place=mars')).place).toBe('home')
    expect(
      readFilters(new URLSearchParams('place=bear-lake-cache')).place,
    ).toBe('home')
    expect(readFilters(new URLSearchParams('place=work-hotels')).place).toBe(
      'home',
    )
  })
})

describe('countActiveFilters', () => {
  it('counts tag as an active filter', () => {
    expect(
      countActiveFilters(
        { ...emptyFilters, tag: 'broth' },
        openPrefs.guardrails,
      ),
    ).toBe(1)
  })

  it('counts vacation place and venue, not front job', () => {
    expect(
      countActiveFilters(
        {
          ...emptyFilters,
          job: 'order',
          place: 'theme-parks',
          venue: 'Plaza Inn (Main Street, U.S.A. · Disneyland Park)',
        },
        openPrefs.guardrails,
      ),
    ).toBe(2)
  })

  it('does not double-count Parks/Cruise via cruiseMode', () => {
    expect(
      countActiveFilters(
        { ...emptyFilters, place: 'cruise' },
        { ...openPrefs.guardrails, cruiseMode: true },
      ),
    ).toBe(1)
  })
})
