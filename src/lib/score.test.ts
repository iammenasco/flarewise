import { describe, expect, it } from 'vitest'
import {
  feelingFromMinScore,
  feelingScopeHint,
  minScoreFromFeeling,
  tierFromScore,
  tierLabel,
  tierLabelForFeeling,
} from './score'

describe('score mapping', () => {
  it('maps feeling extremes across the non-avoid food range', () => {
    expect(minScoreFromFeeling(1)).toBe(10)
    expect(minScoreFromFeeling(10)).toBe(6.5)
  })

  it('round-trips feeling ↔ minScore at half-step precision', () => {
    for (const feeling of [1, 2.5, 5, 7.5, 10]) {
      const min = minScoreFromFeeling(feeling)
      expect(feelingFromMinScore(min)).toBe(feeling)
    }
  })

  it('keeps the dial alive past Cautious (good-day still lowers the floor)', () => {
    expect(minScoreFromFeeling(4.5)).toBeGreaterThan(minScoreFromFeeling(8))
    expect(minScoreFromFeeling(8)).toBeLessThan(9)
  })

  it('derives tiers from crohnsScore', () => {
    expect(tierFromScore(9.5)).toBe('flare-safe')
    expect(tierFromScore(8)).toBe('low-risk')
    expect(tierFromScore(7)).toBe('remission-road')
    expect(tierFromScore(4)).toBe('danger-zone')
  })

  it('relabels Careful as Good-day fit on strong days', () => {
    expect(tierLabel('remission-road')).toBe('Careful')
    expect(tierLabelForFeeling('remission-road', 8)).toBe('Good-day fit')
  })

  it('scopes the list hint from mapped food floor', () => {
    expect(feelingScopeHint(1)).toBe('Flare-safe foods only')
    expect(feelingScopeHint(10)).toBe('Includes careful options')
  })
})
