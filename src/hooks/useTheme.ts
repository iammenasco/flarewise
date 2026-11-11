import { useEffect } from 'react'
import {
  applyResolvedTheme,
  resolveTheme,
  systemPrefersDark,
  type ThemePreference,
} from '../lib/theme'

/**
 * Applies resolved light/dark to <html>, theme-color, and favicon.
 * Listens for OS scheme changes while preference is "system".
 */
export function useTheme(preference: ThemePreference) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const sync = () => {
      applyResolvedTheme(resolveTheme(preference, systemPrefersDark(media)))
    }

    sync()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync)
      return () => media.removeEventListener('change', sync)
    }

    media.addListener(sync)
    return () => media.removeListener(sync)
  }, [preference])
}
