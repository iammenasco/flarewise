import { ShoppingCart, Star } from 'lucide-react'
import {
  costLabel,
  tierChipClass,
  tierLabelForFeeling,
} from '../lib/score'
import type { CrohnsFoodItem, PersonalStatus } from '../types'

interface FoodCardProps {
  item: CrohnsFoodItem
  feeling: number
  starred: boolean
  inCart: boolean
  personalStatus?: PersonalStatus
  onOpen: () => void
  onToggleStar: () => void
  onToggleCart: () => void
}

function statusDotClass(status?: PersonalStatus) {
  if (status === 'safe') return 'bg-emerald-500'
  if (status === 'iffy') return 'bg-amber-500'
  if (status === 'trigger') return 'bg-rose-500'
  return ''
}

export function FoodCard({
  item,
  feeling,
  starred,
  inCart,
  personalStatus,
  onOpen,
  onToggleStar,
  onToggleCart,
}: FoodCardProps) {
  return (
    <article className="panel rounded-xl px-3 py-2.5 shadow-sm">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-tight ${tierChipClass(item.safetyTier, feeling)}`}
            >
              {tierLabelForFeeling(item.safetyTier, feeling)}
            </span>
            {personalStatus ? (
              <span
                className={`inline-block h-2 w-2 rounded-full ${statusDotClass(personalStatus)}`}
                title={
                  personalStatus === 'safe'
                    ? 'Safe for you'
                    : personalStatus === 'iffy'
                      ? 'Iffy for you'
                      : 'Personal trigger'
                }
              />
            ) : null}
            <span className="text-[11px] text-[var(--brand-ink)]/45">
              {costLabel(item.costTier)} · {item.fiberGramsPerServing}g fiber
            </span>
          </div>
          <h2 className="text-[15px] font-bold leading-snug text-[var(--brand-ink)]">
            {item.name}
          </h2>
          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--brand-ink)]/55">
            {item.brandOrRestaurant ? `${item.brandOrRestaurant} · ` : ''}
            {item.region}
          </p>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={starred ? 'Unstar' : 'Star'}
            className="icon-btn"
            onClick={onToggleStar}
          >
            <Star
              className={`h-5 w-5 ${starred ? 'fill-amber-400 text-amber-400' : ''}`}
            />
          </button>
          <button
            type="button"
            aria-label={inCart ? 'Remove from grocery list' : 'Add to grocery list'}
            className="icon-btn"
            onClick={onToggleCart}
          >
            <ShoppingCart
              className={`h-5 w-5 ${inCart ? 'text-[var(--brand)]' : ''}`}
            />
          </button>
        </div>
      </div>
    </article>
  )
}
