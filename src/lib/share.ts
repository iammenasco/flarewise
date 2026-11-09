/** Canonical public origin for share / unfurl URLs. */
export const SITE_ORIGIN = 'https://flarewise.menas.co'

/** Static share page with OG tags (crawler-friendly). Opens the SPA via redirect. */
export function foodShareUrl(id: string) {
  return `${SITE_ORIGIN}/f/${encodeURIComponent(id)}/`
}

export function foodAppUrl(id: string) {
  return `${SITE_ORIGIN}/#/?item=${encodeURIComponent(id)}`
}

export async function shareFood(opts: {
  id: string
  name: string
  text?: string
}): Promise<'shared' | 'copied' | 'failed'> {
  const url = foodShareUrl(opts.id)
  const title = `${opts.name} · Flarewise`
  const text =
    opts.text?.trim() ||
    `${opts.name} — Crohn's-friendly pick on Flarewise`

  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, text, url })
      return 'shared'
    }
  } catch (error) {
    // User cancel is fine; fall through only on hard failures.
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'failed'
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return 'copied'
    }
  } catch {
    // ignore
  }

  return 'failed'
}
