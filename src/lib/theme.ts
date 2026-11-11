import type { ThemePreference } from '../types'

export type { ThemePreference }
export type ResolvedTheme = 'light' | 'dark'

export const THEME_PREFERENCES: {
  id: ThemePreference
  label: string
}[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#e8f2fb',
  dark: '#0f2740',
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function resolveTheme(
  preference: ThemePreference,
  systemDark = false,
): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference
  return systemDark ? 'dark' : 'light'
}

export function systemPrefersDark(
  media:
    | Pick<MediaQueryList, 'matches'>
    | null
    | undefined = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null,
): boolean {
  return Boolean(media?.matches)
}

/** Favicon href for the resolved theme (PNG fallback stays shared). */
export function faviconHrefForTheme(
  theme: ResolvedTheme,
  baseUrl = '/',
): { svg: string; png: string } {
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return {
    svg: theme === 'dark' ? `${root}favicon-dark.svg` : `${root}favicon.svg`,
    png: `${root}favicon.png`,
  }
}

export function applyResolvedTheme(
  theme: ResolvedTheme,
  doc: Document = document,
  baseUrl = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/',
) {
  const root = doc.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme

  const themeColor = THEME_COLORS[theme]
  for (const meta of doc.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', themeColor)
  }

  const icons = faviconHrefForTheme(theme, baseUrl)
  const svgIcon = doc.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]')
  const pngIcon = doc.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/png"]')
  if (svgIcon) svgIcon.href = icons.svg
  if (pngIcon) pngIcon.href = icons.png
}
