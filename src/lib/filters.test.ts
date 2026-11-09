import { describe, expect, it } from 'vitest'
import { defaultPreferences } from './storage'
import {
  countActiveFilters,
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
