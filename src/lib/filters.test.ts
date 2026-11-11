import { describe, expect, it } from 'vitest'
import { allFoods } from '../data'
import { defaultPreferences } from './storage'
import {
  compareVenueMenuItems,
  countActiveFilters,
  isCruiseOrVacationItem,
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
  place: 'home',
  venue: '',
}

describe('itemPassesFilters', () => {
  it('keeps items that match a tag filter', () => {
    expect(
      itemPassesFilters(baseItem, { ...emptyFilters, tag: 'broth' }, openPrefs),
    ).toBe(true)
  })

  it('drops items that lack the active tag', () => {
    const toast = { ...baseItem, id: 'toast', tags: ['bread', 'toaster'] }
    expect(
      itemPassesFilters(toast, { ...emptyFilters, tag: 'broth' }, openPrefs),
    ).toBe(false)
  })

  it('hides danger-zone unless showDangerZone is on', () => {
    const avoid = {
      ...baseItem,
      id: 'chili',
      safetyTier: 'danger-zone' as const,
      crohnsScore: 3,
    }
    expect(itemPassesFilters(avoid, emptyFilters, openPrefs)).toBe(false)
    expect(
      itemPassesFilters(avoid, emptyFilters, {
        ...openPrefs,
        guardrails: { ...openPrefs.guardrails, showDangerZone: true },
      }),
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
      itemPassesFilters(careful, emptyFilters, {
        ...openPrefs,
        minScore: 9,
      }),
    ).toBe(false)
    expect(
      itemPassesFilters(careful, emptyFilters, {
        ...openPrefs,
        minScore: 6.5,
      }),
    ).toBe(true)
  })

  it('hides cruise and theme-park vacation items by default (when cruiseMode is false) and shows only vacation items when cruiseMode is true', () => {
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
    // Unselected by default: everyday item passes, vacation items are hidden
    expect(itemPassesFilters(baseItem, emptyFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(cruiseItem, emptyFilters, openPrefs)).toBe(false)
    expect(itemPassesFilters(disneylandItem, emptyFilters, openPrefs)).toBe(false)
    expect(itemPassesFilters(knottsItem, emptyFilters, openPrefs)).toBe(false)

    // Selected (cruiseMode / Vacation mode = true): vacation items pass, everyday item is hidden
    const vacationPrefs = {
      ...openPrefs,
      guardrails: { ...openPrefs.guardrails, cruiseMode: true },
    }
    expect(itemPassesFilters(cruiseItem, emptyFilters, vacationPrefs)).toBe(true)
    expect(itemPassesFilters(disneylandItem, emptyFilters, vacationPrefs)).toBe(true)
    expect(itemPassesFilters(knottsItem, emptyFilters, vacationPrefs)).toBe(true)
    expect(itemPassesFilters(baseItem, emptyFilters, vacationPrefs)).toBe(false)

    // Destination tag filter inside Vacation mode (theme parks & cruise ships)
    expect(
      itemPassesFilters(
        disneylandItem,
        { ...emptyFilters, tag: 'disneyland' },
        vacationPrefs,
      ),
    ).toBe(true)
    expect(
      itemPassesFilters(
        disneylandItem,
        { ...emptyFilters, tag: 'knotts-berry-farm' },
        vacationPrefs,
      ),
    ).toBe(false)
    expect(
      itemPassesFilters(
        cruiseItem,
        { ...emptyFilters, tag: 'disney-wonder' },
        vacationPrefs,
      ),
    ).toBe(true)
    expect(
      itemPassesFilters(
        cruiseItem,
        { ...emptyFilters, tag: 'disney-treasure' },
        vacationPrefs,
      ),
    ).toBe(false)
  })

  it('identifies committed cruise and vacation items via isCruiseOrVacationItem', () => {
    const cruiseItems = allFoods.filter(isCruiseOrVacationItem)
    expect(cruiseItems.length).toBeGreaterThanOrEqual(12)
    expect(defaultPreferences.guardrails.cruiseMode).toBe(false)
  })

  it('scopes Bear Lake & Cache Valley to local tags without unlocking vacation menus', () => {
    const loganItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'angies-scramble',
      brandOrRestaurant: "Angie's Restaurant (Logan, UT)",
      tags: ['eggs', 'logan', 'cache-valley'],
    }
    const bearLakeItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'crepes-bear-lake',
      brandOrRestaurant: 'Crepes and Coffee (Garden City / Bear Lake, UT)',
      tags: ['crepe', 'bear-lake', 'garden-city'],
    }
    const disneylandItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'plaza-inn',
      tags: ['chicken', 'vacation', 'disneyland'],
    }
    const placeFilters: CatalogFilters = {
      ...emptyFilters,
      place: 'bear-lake-cache',
    }
    expect(itemPassesFilters(loganItem, placeFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(bearLakeItem, placeFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(baseItem, placeFilters, openPrefs)).toBe(false)
    expect(itemPassesFilters(disneylandItem, placeFilters, openPrefs)).toBe(
      false,
    )
  })

  it('scopes Workplace & hotels to BambooHR / hotel tags', () => {
    const workItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'thomas-oatmeal',
      brandOrRestaurant: 'Thomas2Go / Thomas Cuisine (BambooHR Lindon, UT)',
      tags: ['oatmeal', 'bamboohr', 'thomas2go'],
    }
    const hotelItem: CrohnsFoodItem = {
      ...baseItem,
      id: 'holiday-inn-pancakes',
      tags: ['pancakes', 'hotel'],
    }
    const placeFilters: CatalogFilters = {
      ...emptyFilters,
      place: 'work-hotels',
    }
    expect(itemPassesFilters(workItem, placeFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(hotelItem, placeFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(baseItem, placeFilters, openPrefs)).toBe(false)
  })

  it('scopes Theme parks and Cruise places to vacation menus only', () => {
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
      place: 'theme-parks',
    }
    const cruiseFilters: CatalogFilters = {
      ...emptyFilters,
      place: 'cruise',
    }
    // Place itself unlocks vacation browsing even if cruiseMode pref is false.
    expect(itemPassesFilters(parkItem, parkFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(cruiseItem, parkFilters, openPrefs)).toBe(false)
    expect(itemPassesFilters(baseItem, parkFilters, openPrefs)).toBe(false)
    expect(itemPassesFilters(cruiseItem, cruiseFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(parkItem, cruiseFilters, openPrefs)).toBe(false)
  })

  it('filters a venue menu to an exact brandOrRestaurant', () => {
    const dansBurger: CrohnsFoodItem = {
      ...baseItem,
      id: 'dans-burger',
      brandOrRestaurant: "Dan's Drive-In (Montpelier, ID)",
      tags: ['burger', 'bear-lake', 'montpelier'],
      safetyTier: 'low-risk',
      crohnsScore: 8,
    }
    const other: CrohnsFoodItem = {
      ...baseItem,
      id: 'other-burger',
      brandOrRestaurant: 'Some Beaches (Laketown / Bear Lake, UT)',
      tags: ['burger', 'bear-lake'],
    }
    const venueFilters: CatalogFilters = {
      ...emptyFilters,
      place: 'bear-lake-cache',
      venue: "Dan's Drive-In (Montpelier, ID)",
    }
    expect(itemPassesFilters(dansBurger, venueFilters, openPrefs)).toBe(true)
    expect(itemPassesFilters(other, venueFilters, openPrefs)).toBe(false)
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
      place: 'home',
      venue: '',
    })
  })

  it('reads place and venue from the query string', () => {
    const params = new URLSearchParams(
      "place=bear-lake-cache&venue=Dan's Drive-In (Montpelier, ID)",
    )
    expect(readFilters(params)).toMatchObject({
      place: 'bear-lake-cache',
      venue: "Dan's Drive-In (Montpelier, ID)",
    })
  })

  it('falls back to home for unknown place values', () => {
    expect(readFilters(new URLSearchParams('place=mars')).place).toBe('home')
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

  it('counts non-home place and venue', () => {
    expect(
      countActiveFilters(
        {
          ...emptyFilters,
          place: 'bear-lake-cache',
          venue: "Dan's Drive-In (Montpelier, ID)",
        },
        openPrefs.guardrails,
      ),
    ).toBe(2)
  })
})
