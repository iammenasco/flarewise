import type { ReactNode } from 'react'
import { Ship } from 'lucide-react'
import { CRUISE_SHIP_CHIPS, isCruiseTag } from '../lib/filters'
import { MEAL_CHIPS, REGION_CHIPS, costLabel } from '../lib/score'
import type { CatalogFilters, ModeFilter } from '../hooks/useCatalogFilters'

interface FilterBarProps {
  filters: CatalogFilters
  onPatch: (patch: Partial<CatalogFilters>) => void
  lactoseSafeOnly: boolean
  toasterOvenOnly: boolean
  grabAndGoOnly: boolean
  citrusFreeOnly: boolean
  cruiseMode: boolean
  showDangerZone: boolean
  onToggleGuardrail: (
    key:
      | 'lactoseSafeOnly'
      | 'toasterOvenOnly'
      | 'grabAndGoOnly'
      | 'citrusFreeOnly'
      | 'cruiseMode'
      | 'showDangerZone',
  ) => void
  onSelectShip: (shipTag: string) => void
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
  cruiseMode,
  showDangerZone,
  onToggleGuardrail,
  onSelectShip,
  onClearExtra,
}: FilterBarProps) {
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
          {filters.tag && !isCruiseTag(filters.tag) ? (
            <Chip active onClick={() => onPatch({ tag: '' })}>
              #{filters.tag} ×
            </Chip>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
          Vacation
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={cruiseMode}
            onClick={() => onToggleGuardrail('cruiseMode')}
          >
            <span className="inline-flex items-center gap-1.5">
              <Ship className="h-3.5 w-3.5" />
              Vacation / Cruise mode
            </span>
          </Chip>
        </div>
        {cruiseMode ? (
          <div className="mt-2 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)]/55 p-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--brand-ink)]/70">
              Cruise ship
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={!filters.tag || !isCruiseTag(filters.tag)}
                onClick={() => onPatch({ tag: '' })}
              >
                All ships
              </Chip>
              {CRUISE_SHIP_CHIPS.map((ship) => (
                <Chip
                  key={ship.tag}
                  active={filters.tag === ship.tag}
                  onClick={() => onSelectShip(ship.tag)}
                >
                  {ship.label}
                </Chip>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted mt-1.5 text-xs">
            Off by default — turn on to switch into Disney Cruise menus and pick
            your ship.
          </p>
        )}
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
    </div>
  )
}
