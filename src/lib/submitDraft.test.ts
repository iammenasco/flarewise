import { describe, expect, it } from 'vitest'
import {
  buildSubmitItem,
  draftHasContent,
  emptyDraft,
  friendlySubmitGaps,
  shouldPromptSubmitOnReconnect,
  submitIssueTitle,
} from './submitDraft'

describe('draftHasContent', () => {
  it('ignores empty placeholder drafts', () => {
    expect(draftHasContent(emptyDraft)).toBe(false)
  })

  it('detects a named draft', () => {
    expect(draftHasContent({ ...emptyDraft, name: 'Chicken broth' })).toBe(true)
  })
})

describe('shouldPromptSubmitOnReconnect', () => {
  it('prompts only on offline → online with pending work', () => {
    expect(shouldPromptSubmitOnReconnect(false, true, true)).toBe(true)
    expect(shouldPromptSubmitOnReconnect(true, true, true)).toBe(false)
    expect(shouldPromptSubmitOnReconnect(false, true, false)).toBe(false)
    expect(shouldPromptSubmitOnReconnect(false, false, true)).toBe(false)
  })
})

describe('friendlySubmitGaps', () => {
  it('lists plain-language missing pieces', () => {
    const gaps = friendlySubmitGaps(buildSubmitItem(emptyDraft))
    expect(gaps.some((g) => g.toLowerCase().includes('name'))).toBe(true)
    expect(gaps.join(' ')).not.toMatch(/whyItWorks|instancePath|\^\[/)
  })

  it('is empty for a complete item', () => {
    const item = buildSubmitItem({
      ...emptyDraft,
      name: 'Chicken broth',
      tags: ['broth', 'takeout'],
      searchKeywords: ['stock'],
      whyItWorks: 'Warm and low fiber.',
      prepOrOrderInstructions: 'Heat and sip.',
    })
    expect(friendlySubmitGaps(item)).toEqual([])
  })
})

describe('submitIssueTitle', () => {
  it('prefixes the dish name', () => {
    expect(submitIssueTitle({ name: 'Broth' })).toBe('Add food: Broth')
  })
})

describe('buildSubmitItem vacation tag auto-enrichment', () => {
  it('auto-adds disney-cruise and ship tags when brandOrRestaurant mentions a Disney ship', () => {
    const item = buildSubmitItem({
      ...emptyDraft,
      name: 'Warm Cinnamon Sticky Bun',
      brandOrRestaurant: 'Disney Wonder · Palo Brunch',
      tags: ['pastry', 'cinnamon'],
      searchKeywords: ['palo sticky bun'],
      whyItWorks: 'Refined dough.',
      prepOrOrderInstructions: 'Order warm.',
    })
    expect(item.tags).toContain('disney-cruise')
    expect(item.tags).toContain('disney-wonder')
  })

  it('auto-adds vacation and theme-park tags for Disneyland, California Adventure, and Knott’s Berry Farm', () => {
    const dl = buildSubmitItem({
      ...emptyDraft,
      name: 'Safari Skewer',
      brandOrRestaurant: 'Bengal Barbecue (Disneyland Park)',
      tags: ['beef', 'skewer'],
      searchKeywords: ['bengal bbq'],
      whyItWorks: 'Lean beef.',
      prepOrOrderInstructions: 'Order plain.',
    })
    expect(dl.tags).toContain('vacation')
    expect(dl.tags).toContain('disneyland')

    const dca = buildSubmitItem({
      ...emptyDraft,
      name: 'Sourdough Bread Bowl Soup',
      brandOrRestaurant: 'Aunt Cass Café (Disney California Adventure)',
      tags: ['sourdough', 'soup'],
      searchKeywords: ['boudin sourdough'],
      whyItWorks: 'Fermented sourdough.',
      prepOrOrderInstructions: 'Eat soft interior.',
    })
    expect(dca.tags).toContain('vacation')
    expect(dca.tags).toContain('california-adventure')

    const knotts = buildSubmitItem({
      ...emptyDraft,
      name: 'Roasted Half Chicken & Mashed Potatoes',
      brandOrRestaurant: "Mrs. Knott's Chicken Dinner Restaurant (Knott's Berry Farm)",
      tags: ['chicken', 'potato'],
      searchKeywords: ['mrs knotts'],
      whyItWorks: 'Roasted chicken.',
      prepOrOrderInstructions: 'Order roasted not fried.',
    })
    expect(knotts.tags).toContain('vacation')
    expect(knotts.tags).toContain('knotts-berry-farm')
  })
})
