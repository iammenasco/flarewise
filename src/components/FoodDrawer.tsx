import { useState } from 'react'
import {
  AlertTriangle,
  Ban,
  Check,
  ExternalLink,
  Minus,
  Share2,
  ShoppingCart,
  Star,
  X,
} from 'lucide-react'
import { githubEditUrl } from '../lib/github'
import {
  costLabel,
  tierChipClass,
  tierHintForFeeling,
  tierLabelForFeeling,
} from '../lib/score'
import { shareFood } from '../lib/share'
import type { CrohnsFoodItem, PersonalStatus } from '../types'

interface FoodDrawerProps {
  item: CrohnsFoodItem | null
  feeling: number
  starred: boolean
  inCart: boolean
  personalStatus?: PersonalStatus
  onClose: () => void
  onToggleStar: () => void
  onToggleCart: () => void
  onSetStatus: (status: PersonalStatus | undefined) => void
  onTag: (tag: string) => void
}

const STATUS_OPTIONS: {
  id: PersonalStatus | undefined
  label: string
  icon: typeof Check
}[] = [
  { id: undefined, label: 'Unset', icon: Minus },
  { id: 'safe', label: 'Works for me', icon: Check },
  { id: 'iffy', label: 'Iffy', icon: AlertTriangle },
  { id: 'trigger', label: 'Trigger', icon: Ban },
]

export function FoodDrawer({
  item,
  feeling,
  starred,
  inCart,
  personalStatus,
  onClose,
  onToggleStar,
  onToggleCart,
  onSetStatus,
  onTag,
}: FoodDrawerProps) {
  const [shareNote, setShareNote] = useState<string | null>(null)

  if (!item) return null

  const food = item
  const chipClass = tierChipClass(food.safetyTier, feeling)

  async function onShare() {
    const result = await shareFood({
      id: food.id,
      name: food.name,
      text: food.whyItWorks,
    })
    if (result === 'copied') {
      setShareNote('Link copied')
      window.setTimeout(() => setShareNote(null), 1800)
    } else if (result === 'failed') {
      setShareNote('Couldn’t share — copy from the address later')
      window.setTimeout(() => setShareNote(null), 2200)
    } else {
      setShareNote(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0 bg-[var(--brand-ink)]/40"
        onClick={onClose}
      />
      <div className="panel safe-bottom relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-4 shadow-2xl sm:rounded-3xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-sm font-bold ${chipClass}`}
              >
                {tierLabelForFeeling(item.safetyTier, feeling)}
              </span>
              <span className="text-sm text-[var(--brand-ink)]/55">
                {costLabel(item.costTier)} · convenience {item.convenienceScore}/5
              </span>
            </div>
            <h2 className="brand-font text-2xl text-[var(--brand-ink)]">{item.name}</h2>
            <p className={`mt-2 rounded-xl border px-3 py-2 text-sm font-medium ${chipClass}`}>
              {tierHintForFeeling(item.safetyTier, feeling)}
            </p>
            <p className="mt-2 text-sm text-[var(--brand-ink)]/60">
              {item.brandOrRestaurant ? `${item.brandOrRestaurant} · ` : ''}
              {item.region} · {item.fiberGramsPerServing}g fiber
              {item.lactoseSafe ? ' · lactose-safe' : ''}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 hover:bg-[var(--brand-soft)]"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={onToggleStar}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-soft)] px-3 py-2.5 text-sm font-semibold text-[var(--brand-ink)]"
          >
            <Star className={`h-4 w-4 ${starred ? 'fill-amber-400 text-amber-400' : ''}`} />
            {starred ? 'Starred' : 'Star'}
          </button>
          <button
            type="button"
            onClick={onToggleCart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-3 py-2.5 text-sm font-semibold text-white"
          >
            <ShoppingCart className="h-4 w-4" />
            {inCart ? 'In cart' : 'Add to cart'}
          </button>
          <button
            type="button"
            onClick={() => void onShare()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2.5 text-sm font-semibold text-[var(--brand-ink)]"
            aria-label={`Share ${item.name}`}
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        {shareNote ? (
          <p className="mb-3 text-center text-xs font-semibold text-[var(--brand)]">
            {shareNote}
          </p>
        ) : null}

        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
            Your tolerance
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {STATUS_OPTIONS.map((option) => {
              const active = personalStatus === option.id
              const Icon = option.icon
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => onSetStatus(option.id)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                    active
                      ? option.id === 'safe'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : option.id === 'iffy'
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : option.id === 'trigger'
                            ? 'border-rose-500 bg-rose-50 text-rose-800'
                            : 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                      : 'border-[var(--line)] bg-white/70 text-[var(--brand-ink)]/70'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <section className="space-y-4 text-sm leading-relaxed text-[var(--brand-ink)]/85">
          <div>
            <h3 className="mb-1 font-bold text-[var(--brand-ink)]">Why it works</h3>
            <p>{item.whyItWorks}</p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-[var(--brand-ink)]">
              Prep / order script
            </h3>
            <p>{item.prepOrOrderInstructions}</p>
          </div>
          {item.flareEmergencySwap ? (
            <div>
              <h3 className="mb-1 font-bold text-[var(--brand-ink)]">
                Flare / remission hack
              </h3>
              <p>{item.flareEmergencySwap}</p>
            </div>
          ) : null}
          {item.familyMealMod ? (
            <div>
              <h3 className="mb-1 font-bold text-[var(--brand-ink)]">
                Family meal fork-in-the-road
              </h3>
              <p>{item.familyMealMod}</p>
            </div>
          ) : null}
          {item.watchOuts?.length ? (
            <div>
              <h3 className="mb-1 font-bold text-rose-600">Watch-outs</h3>
              <ul className="list-disc space-y-1 pl-5">
                {item.watchOuts.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {item.groceryIngredients?.length ? (
            <div>
              <h3 className="mb-1 font-bold text-[var(--brand-ink)]">
                Grocery ingredients
              </h3>
              <ul className="list-disc space-y-1 pl-5">
                {item.groceryIngredients.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
            Tags — tap to filter
          </p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="chip"
                aria-label={`Filter catalog by tag ${tag}`}
                onClick={() => onTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <a
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)]"
          href={githubEditUrl(item._sourcePath)}
          target="_blank"
          rel="noreferrer"
        >
          Edit this item on GitHub
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
