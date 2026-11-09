import type { SafetyTier } from '../types'

export function tierFromScore(score: number): SafetyTier {
  if (score >= 9) return 'flare-safe'
  if (score >= 7.5) return 'low-risk'
  if (score >= 6.5) return 'remission-road'
  return 'danger-zone'
}

export function tierLabel(tier: SafetyTier): string {
  switch (tier) {
    case 'flare-safe':
      return 'Flare safe'
    case 'low-risk':
      return 'Everyday'
    case 'remission-road':
      return 'Careful'
    case 'danger-zone':
      return 'Avoid'
  }
}

/**
 * Labels relative to Today — so a "Careful" food unlocked on a great day
 * does not still nag "wait until you feel stronger."
 */
export function tierLabelForFeeling(tier: SafetyTier, feeling: number): string {
  if (tier === 'remission-road' && feeling >= 7) return 'Good-day fit'
  return tierLabel(tier)
}

export function tierHintForFeeling(tier: SafetyTier, feeling: number): string {
  switch (tier) {
    case 'flare-safe':
      return feeling <= 3
        ? 'Gentle enough for rough days'
        : 'Extra gentle — fine even on rough days'
    case 'low-risk':
      return feeling <= 4
        ? 'A solid everyday option'
        : 'Fits a steadier day like today'
    case 'remission-road':
      return feeling >= 7
        ? 'A bit more work for the gut — showing because today looks good'
        : 'Better when you are feeling stronger'
    case 'danger-zone':
      return 'Warning / avoid for most people here'
  }
}

export function tierChipClass(tier: SafetyTier, feeling = 5): string {
  if (tier === 'remission-road' && feeling >= 7) {
    return 'border-teal-200 bg-teal-50 text-teal-900'
  }
  switch (tier) {
    case 'flare-safe':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'low-risk':
      return 'border-[var(--brand)]/25 bg-[var(--brand-soft)] text-[var(--brand-ink)]'
    case 'remission-road':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'danger-zone':
      return 'border-rose-200 bg-rose-50 text-rose-800'
  }
}

/** Today dial only: bad (red) → good (green). */
const FEELING_STOPS: { t: number; rgb: [number, number, number] }[] = [
  { t: 0, rgb: [225, 29, 72] }, // rose — rough day
  { t: 0.35, rgb: [245, 158, 11] }, // amber
  { t: 0.55, rgb: [54, 141, 218] }, // brand #368dda
  { t: 0.78, rgb: [20, 184, 166] }, // teal
  { t: 1, rgb: [16, 185, 129] }, // emerald — feeling great
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

/** Color for the Today dial thumb / mood badge from feeling 1–10. */
export function scaleColor(feeling: number): string {
  const t = Math.min(1, Math.max(0, (feeling - 1) / 9))
  for (let i = 0; i < FEELING_STOPS.length - 1; i += 1) {
    const left = FEELING_STOPS[i]
    const right = FEELING_STOPS[i + 1]
    if (t >= left.t && t <= right.t) {
      const local = (t - left.t) / (right.t - left.t || 1)
      const [r, g, b] = mix(left.rgb, right.rgb, local)
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
    }
  }
  const last = FEELING_STOPS[FEELING_STOPS.length - 1].rgb
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`
}

export const FEELING_TRACK_GRADIENT =
  'linear-gradient(90deg, rgb(225, 29, 72) 0%, rgb(245, 158, 11) 35%, rgb(54, 141, 218) 55%, rgb(20, 184, 166) 78%, rgb(16, 185, 129) 100%)'

/**
 * Submit-form “how gentle” dial — calm brand/emerald, no alarm red.
 * Low score (ambitious) → soft slate; high score (gentle) → emerald.
 */
const GENTLE_STOPS: { t: number; rgb: [number, number, number] }[] = [
  { t: 0, rgb: [148, 163, 184] }, // slate
  { t: 0.45, rgb: [54, 141, 218] }, // brand
  { t: 0.75, rgb: [20, 184, 166] }, // teal
  { t: 1, rgb: [16, 185, 129] }, // emerald
]

export function gentleScaleColor(score: number): string {
  const t = Math.min(1, Math.max(0, (score - 1) / 9))
  for (let i = 0; i < GENTLE_STOPS.length - 1; i += 1) {
    const left = GENTLE_STOPS[i]
    const right = GENTLE_STOPS[i + 1]
    if (t >= left.t && t <= right.t) {
      const local = (t - left.t) / (right.t - left.t || 1)
      const [r, g, b] = mix(left.rgb, right.rgb, local)
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
    }
  }
  const last = GENTLE_STOPS[GENTLE_STOPS.length - 1].rgb
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`
}

export const GENTLE_TRACK_GRADIENT =
  'linear-gradient(90deg, rgb(148, 163, 184) 0%, rgb(54, 141, 218) 45%, rgb(20, 184, 166) 75%, rgb(16, 185, 129) 100%)'

/** Softer wording on the suggest form (Avoid reads like a warning siren). */
export function submitTierLabel(tier: SafetyTier): string {
  switch (tier) {
    case 'flare-safe':
      return 'Flare safe'
    case 'low-risk':
      return 'Everyday'
    case 'remission-road':
      return 'Careful'
    case 'danger-zone':
      return 'Usually skip'
  }
}

export function feelingLabel(feeling: number): string {
  if (feeling <= 2.5) return 'Rough day'
  if (feeling <= 4.5) return 'Cautious'
  if (feeling <= 6.5) return 'Steady'
  if (feeling <= 8.5) return 'Pretty good'
  return 'Feeling great'
}

/**
 * Non-Avoid catalog scores run about 6.5–10. Map the full Today dial across
 * that range so Good day still changes the list (old 11-feeling mapping hit
 * 6.5 by "Cautious" and went dead for the rest of the slider).
 */
export const DIAL_MIN_FOOD_SCORE = 6.5
export const DIAL_MAX_FOOD_SCORE = 10

export function costLabel(tier: 1 | 2 | 3): string {
  return '$'.repeat(tier)
}

/** Dial UI: left = bad day, right = good day. */
export function minScoreFromFeeling(feeling: number) {
  const clampedFeeling = Math.min(10, Math.max(1, feeling))
  const raw =
    DIAL_MAX_FOOD_SCORE -
    ((clampedFeeling - 1) / 9) * (DIAL_MAX_FOOD_SCORE - DIAL_MIN_FOOD_SCORE)
  return Math.round(raw * 2) / 2
}

export function feelingFromMinScore(minScore: number) {
  const clamped = Math.min(
    DIAL_MAX_FOOD_SCORE,
    Math.max(DIAL_MIN_FOOD_SCORE, minScore),
  )
  const raw =
    1 +
    ((DIAL_MAX_FOOD_SCORE - clamped) /
      (DIAL_MAX_FOOD_SCORE - DIAL_MIN_FOOD_SCORE)) *
      9
  return Math.round(raw * 2) / 2
}

/** What the list is doing — based on the mapped food floor, not dead feeling zones. */
export function feelingScopeHint(feeling: number): string {
  const minScore = minScoreFromFeeling(feeling)
  if (minScore >= 9) return 'Flare-safe foods only'
  if (minScore >= 7.5) return 'Flare-safe + everyday'
  return 'Includes careful options'
}

export const MEAL_CHIPS = [
  'breakfast',
  'lunch',
  'dinner',
  'takeout',
  'snack',
  'drink',
  'sauce',
  'dessert',
] as const

export const REGION_CHIPS = [
  'American',
  'Japanese',
  'Korean',
  'Chinese',
  'Indian',
  'Mexican/Southwest',
  'Italian/Med',
  'Euro/Bistro',
  'Global',
] as const
