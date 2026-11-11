import { describe, expect, it } from 'vitest'
import {
  faviconHrefForTheme,
  isThemePreference,
  resolveTheme,
  systemPrefersDark,
} from './theme'

describe('theme', () => {
  it('resolves system from OS preference', () => {
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('validates preference values', () => {
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('auto')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })

  it('reads matchMedia-style system preference', () => {
    expect(systemPrefersDark({ matches: true })).toBe(true)
    expect(systemPrefersDark({ matches: false })).toBe(false)
    expect(systemPrefersDark(null)).toBe(false)
  })

  it('picks dark/light favicon hrefs', () => {
    expect(faviconHrefForTheme('light', '/')).toEqual({
      svg: '/favicon.svg',
      png: '/favicon.png',
    })
    expect(faviconHrefForTheme('dark', './')).toEqual({
      svg: './favicon-dark.svg',
      png: './favicon.png',
    })
  })
})
