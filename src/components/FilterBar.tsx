import type { ReactNode } from 'react'
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
  onToggleGuardrail: (
    key:
      | 'lactoseSafeOnly'
      | 'toasterOvenOnly'
      | 'grabAndGoOnly'
      | 'citrusFreeOnly'
      | 'showDangerZone',
  ) => void
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
  onToggleGuardrail,
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
          {filters.tag ? (
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
    </div>
  )
}
