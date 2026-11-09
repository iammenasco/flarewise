import { describe, expect, it } from 'vitest'
import { foodAppUrl, foodShareUrl, SITE_ORIGIN } from './share'

describe('share urls', () => {
  it('builds crawler-friendly share paths', () => {
    expect(foodShareUrl('chinese-congee-savory-rice-porridge')).toBe(
      `${SITE_ORIGIN}/f/chinese-congee-savory-rice-porridge/`,
    )
  })

  it('encodes ids safely', () => {
    expect(foodShareUrl('a/b')).toContain('/f/a%2Fb/')
  })

  it('builds SPA deep links', () => {
    expect(foodAppUrl('congee')).toBe(`${SITE_ORIGIN}/#/?item=congee`)
  })
})
