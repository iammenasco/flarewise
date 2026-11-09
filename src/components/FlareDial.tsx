import {
  FEELING_TRACK_GRADIENT,
  feelingFromMinScore,
  feelingLabel,
  feelingScopeHint,
  minScoreFromFeeling,
  scaleColor,
} from '../lib/score'

/**
 * Dial is emotional: left = bad day (red), right = good day (green).
 * List filters to foods that fit today; cards use words (Flare safe / Everyday / …).
 */
interface FlareDialProps {
  minScore: number
  onMinScore: (value: number) => void
}

export function FlareDial({ minScore, onMinScore }: FlareDialProps) {
  const feeling = feelingFromMinScore(minScore)
  const thumb = scaleColor(feeling)
  const scope = feelingScopeHint(feeling)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">
          Today
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow-sm"
          style={{ backgroundColor: thumb }}
        >
          {feelingLabel(feeling)}
        </span>
      </div>

      <div className="relative flex h-11 items-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full opacity-90"
          style={{ background: FEELING_TRACK_GRADIENT }}
        />
        <input
          aria-label="How is today feeling"
          aria-valuetext={`${feelingLabel(feeling)}. ${scope}.`}
          className="feeling-range relative z-10 w-full"
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={feeling}
          style={{ color: thumb }}
          onChange={(e) =>
            onMinScore(minScoreFromFeeling(Number(e.target.value)))
          }
        />
      </div>

      <div className="muted flex items-start justify-between gap-2 text-[11px] font-medium">
        <span className="shrink-0">Bad day</span>
        <span className="min-w-0 flex-1 text-center text-[var(--brand-ink)]/80">
          {scope}
        </span>
        <span className="shrink-0">Good day</span>
      </div>
    </div>
  )
}
