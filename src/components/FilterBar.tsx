import type { ReactNode } from 'react'
import {
  CRUISE_SHIP_CHIPS,
  PLACE_CONTEXTS,
  THEME_PARK_CHIPS,
  isVacationTag,
  type PlaceContextId,
} from '../lib/filters'
import { MEAL_CHIPS, REGION_CHIPS, costLabel } from '../lib/score'
import type { CatalogFilters, ModeFilter } from '../hooks/useCatalogFilters'

interface FilterBarProps {
  filters: CatalogFilters
  onPatch: (patch: Partial<CatalogFilters>) => void
  lactoseSafeOnly: boolean
  toasterOvenOnly: boolean
  grabAndGoOnly: boolean
  citrusFreeOnly: boolean
  showDangerZone: boolean
  showServerCard: boolean
  onToggleGuardrail: (
    key:
      | 'lactoseSafeOnly'
      | 'toasterOvenOnly'
      | 'grabAndGoOnly'
      | 'citrusFreeOnly'
      | 'showDangerZone',
  ) => void
  onToggleShowServerCard: () => void
  onSelectVacation: (place: PlaceContextId) => void
  onSelectDestination: (destinationTag: string) => void
  onClearExtra: () => void
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="chip shrink-0 !min-h-9 !px-2.5 !py-1 !text-xs"
      data-active={active}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function ModeChips({
  mode,
  onMode,
}: {
  mode: ModeFilter
  onMode: (mode: ModeFilter) => void
}) {
  const modes: { id: ModeFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'starred', label: 'Starred' },
    { id: 'grocery', label: 'Grocery' },
  ]

  return (
    <div className="flex gap-1.5 overflow-x-auto">
      {modes.map((item) => (
        <Chip
          key={item.id}
          active={mode === item.id}
          onClick={() => onMode(item.id)}
        >
          {item.label}
        </Chip>
      ))}
    </div>
  )
}

export function FilterPanel({
  filters,
  onPatch,
  lactoseSafeOnly,
  toasterOvenOnly,
  grabAndGoOnly,
  citrusFreeOnly,
  showDangerZone,
  showServerCard,
  onToggleGuardrail,
  onToggleShowServerCard,
  onSelectVacation,
  onSelectDestination,
  onClearExtra,
}: FilterBarProps) {
  const parksScope = filters.place === 'theme-parks'
  const cruiseScope = filters.place === 'cruise'
  const vacationScope = parksScope || cruiseScope

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Meal
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MEAL_CHIPS.map((meal) => (
            <Chip
              key={meal}
              active={filters.meal === meal}
              onClick={() => onPatch({ meal: filters.meal === meal ? '' : meal })}
            >
              {meal}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Region
        </p>
        <div className="flex flex-wrap gap-1.5">
          {REGION_CHIPS.map((region) => (
            <Chip
              key={region}
              active={filters.region === region}
              onClick={() =>
                onPatch({ region: filters.region === region ? '' : region })
              }
            >
              {region}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Prep & diet
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={grabAndGoOnly}
            onClick={() => onToggleGuardrail('grabAndGoOnly')}
          >
            Grab & go
          </Chip>
          <Chip
            active={toasterOvenOnly}
            onClick={() => onToggleGuardrail('toasterOvenOnly')}
          >
            Toaster oven
          </Chip>
          <Chip
            active={lactoseSafeOnly}
            onClick={() => onToggleGuardrail('lactoseSafeOnly')}
          >
            Lactose-safe
          </Chip>
          <Chip
            active={citrusFreeOnly}
            onClick={() => onToggleGuardrail('citrusFreeOnly')}
          >
            Citrus-free
          </Chip>
          {([1, 2, 3] as const).map((tier) => (
            <Chip
              key={tier}
              active={filters.cost === String(tier)}
              onClick={() =>
                onPatch({
                  cost:
                    filters.cost === String(tier)
                      ? ''
                      : (String(tier) as CatalogFilters['cost']),
                })
              }
            >
              {costLabel(tier)}
            </Chip>
          ))}
          {filters.tag && !isVacationTag(filters.tag) ? (
            <Chip active onClick={() => onPatch({ tag: '' })}>
              #{filters.tag} ×
            </Chip>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Warnings
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={showDangerZone}
            onClick={() => onToggleGuardrail('showDangerZone')}
          >
            Show Avoid foods
          </Chip>
        </div>
        <p className="muted mt-1.5 text-xs">
          Avoid foods stay hidden unless you turn this on — they are reference
          warnings, not recommendations.
        </p>
      </div>

      <button type="button" className="btn btn-ghost w-full" onClick={onClearExtra}>
        Clear filters
      </button>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Extras
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={showServerCard} onClick={onToggleShowServerCard}>
            Server card on food details
          </Chip>
        </div>
        <p className="muted mt-1.5 text-xs">
          Off by default — turns on a high-contrast order card you can show a
          server, plus one-tap copy of the prep script.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Vacation
        </p>
        <div className="space-y-2.5 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)]/55 p-2.5">
          <div
            className="flex flex-wrap gap-1.5"
            role="radiogroup"
            aria-label="Vacation catalog"
          >
            {PLACE_CONTEXTS.map((ctx) => (
              <Chip
                key={ctx.id}
                active={filters.place === ctx.id}
                onClick={() => onSelectVacation(ctx.id)}
              >
                {ctx.shortLabel}
              </Chip>
            ))}
          </div>
          {vacationScope ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={!filters.tag || !isVacationTag(filters.tag)}
                  onClick={() => onPatch({ tag: '', venue: '' })}
                >
                  {parksScope ? 'All parks' : 'All ships'}
                </Chip>
              </div>
              {parksScope ? (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--brand-ink)]/70">
                    Theme parks
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {THEME_PARK_CHIPS.map((park) => (
                      <Chip
                        key={park.tag}
                        active={filters.tag === park.tag}
                        onClick={() => onSelectDestination(park.tag)}
                      >
                        {park.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : null}
              {cruiseScope ? (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--brand-ink)]/70">
                    Cruise ships
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CRUISE_SHIP_CHIPS.map((ship) => (
                      <Chip
                        key={ship.tag}
                        active={filters.tag === ship.tag}
                        onClick={() => onSelectDestination(ship.tag)}
                      >
                        {ship.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
        <p className="muted mt-1.5 text-xs">
          Off by default. Unlock Parks or Cruise for destination menus; venue
          chips stay on the catalog list. Everyday on cards still means the
          safety band, not vacation.
        </p>
      </div>
    </div>
  )
}
