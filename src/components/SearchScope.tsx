import {
  PLACE_CONTEXTS,
  type PlaceContextId,
} from '../lib/filters'

interface SearchScopeProps {
  place: PlaceContextId
  onPlace: (place: PlaceContextId) => void
}

/** Compact Everyday / Parks / Cruise scope sitting with the search field. */
export function SearchScope({ place, onPlace }: SearchScopeProps) {
  return (
    <div
      className="flex gap-1 overflow-x-auto"
      role="radiogroup"
      aria-label="Search scope"
    >
      {PLACE_CONTEXTS.map((ctx) => (
        <button
          key={ctx.id}
          type="button"
          role="radio"
          aria-checked={place === ctx.id}
          className="chip shrink-0 !min-h-8 !px-2.5 !py-1 !text-xs"
          data-active={place === ctx.id}
          title={ctx.hint}
          onClick={() => onPlace(ctx.id)}
        >
          {ctx.shortLabel}
        </button>
      ))}
    </div>
  )
}
