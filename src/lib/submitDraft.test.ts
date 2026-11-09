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
