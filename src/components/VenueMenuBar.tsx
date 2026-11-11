import { UtensilsCrossed, X } from 'lucide-react'

interface VenueMenuBarProps {
  venue: string
  venues: { brand: string; count: number }[]
  onSelectVenue: (brand: string) => void
  onClearVenue: () => void
}

export function VenueMenuBar({
  venue,
  venues,
  onSelectVenue,
  onClearVenue,
}: VenueMenuBarProps) {
  if (venue) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand-soft)]/70 px-2.5 py-2">
        <UtensilsCrossed
          className="h-4 w-4 shrink-0 text-[var(--brand)]"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">
            Venue menu
          </p>
          <p className="truncate text-sm font-semibold text-[var(--brand-ink)]">
            {venue}
          </p>
          <p className="muted text-[11px]">Ranked flare-safe → careful</p>
        </div>
        <button
          type="button"
          className="icon-btn !h-9 !w-9"
          aria-label="Close venue menu"
          onClick={onClearVenue}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (!venues.length) return null

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">
        Menus nearby
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {venues.map(({ brand, count }) => (
          <button
            key={brand}
            type="button"
            className="chip shrink-0 !min-h-9 !max-w-[14rem] !px-2.5 !py-1 !text-xs"
            title={brand}
            onClick={() => onSelectVenue(brand)}
          >
            <span className="truncate">{brand}</span>
            <span className="opacity-70">{count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
