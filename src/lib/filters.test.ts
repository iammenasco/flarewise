import { describe, expect, it } from 'vitest'
import { allFoods } from '../data'
import { defaultPreferences } from './storage'
import {
  countActiveFilters,
  isCruiseOrVacationItem,
  itemPassesFilters,
  readFilters,
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
})

describe('readFilters', () => {
  it('reads tag from the query string', () => {
    const params = new URLSearchParams('tag=broth&mode=starred')
    expect(readFilters(params)).toMatchObject({
      tag: 'broth',
      mode: 'starred',
    })
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
})
