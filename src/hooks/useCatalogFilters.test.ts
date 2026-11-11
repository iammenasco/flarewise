import { describe, expect, it } from 'vitest'
import {
  SEARCH_URL_DEBOUNCE_MS,
  buildSearchParams,
} from './useCatalogFilters'
import type { CatalogFilters } from '../lib/filters'

const base: CatalogFilters = {
  q: '',
  mode: 'all',
  meal: '',
  region: '',
  tag: '',
  cost: '',
  place: 'home',
  venue: '',
}

describe('search URL helpers', () => {
  it('debounces URL commits so typing is not blocked on every key', () => {
    expect(SEARCH_URL_DEBOUNCE_MS).toBeGreaterThanOrEqual(150)
    expect(SEARCH_URL_DEBOUNCE_MS).toBeLessThanOrEqual(400)
  })

  it('buildSearchParams omits empty everyday defaults', () => {
    const sp = buildSearchParams(base, null)
    expect(sp.toString()).toBe('')
  })

  it('buildSearchParams keeps q and non-default scope for shareable URLs', () => {
    const sp = buildSearchParams(
      {
        ...base,
        q: 'Strawberries',
        place: 'theme-parks',
        mode: 'starred',
      },
      'some-item',
    )
    expect(sp.get('q')).toBe('Strawberries')
    expect(sp.get('place')).toBe('theme-parks')
    expect(sp.get('mode')).toBe('starred')
    expect(sp.get('item')).toBe('some-item')
  })
})
