import { MapPin } from 'lucide-react'
import {
  PLACE_CONTEXTS,
  getPlaceContext,
  type PlaceContextId,
} from '../lib/filters'

interface WhereDialProps {
  place: PlaceContextId
  onPlace: (place: PlaceContextId) => void
}

export function WhereDial({ place, onPlace }: WhereDialProps) {
  const active = getPlaceContext(place)

  return (
    <div className="panel rounded-xl px-2.5 py-2 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          Where are you?
        </span>
        <span className="truncate text-[11px] font-medium text-[var(--brand-ink)]/65">
          {active.hint}
        </span>
      </div>
      <div
        className="flex gap-1.5 overflow-x-auto pb-0.5"
        role="radiogroup"
        aria-label="Where are you?"
      >
        {PLACE_CONTEXTS.map((ctx) => (
          <button
            key={ctx.id}
            type="button"
            role="radio"
            aria-checked={place === ctx.id}
            className="chip shrink-0 !min-h-9 !px-2.5 !py-1 !text-xs"
            data-active={place === ctx.id}
            title={ctx.label}
            onClick={() => onPlace(ctx.id)}
          >
            {ctx.shortLabel}
          </button>
        ))}
      </div>
    </div>
  )
}
