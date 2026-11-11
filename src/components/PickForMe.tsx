import { Sparkles, X } from 'lucide-react'
import { tierChipClass, tierLabelForFeeling } from '../lib/score'
import type { CrohnsFoodItem } from '../types'

interface PickForMeProps {
  open: boolean
  feeling: number
  picks: CrohnsFoodItem[]
  onClose: () => void
  onOpenItem: (id: string) => void
  onReroll: () => void
}

const labels = ['Breakfast / snack', 'Lunch / dinner', 'Takeout / zero-energy']

export function PickForMe({
  open,
  feeling,
  picks,
  onClose,
  onOpenItem,
  onReroll,
}: PickForMeProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--brand-ink)]/40"
        aria-label="Close picker"
        onClick={onClose}
      />
      <div className="panel safe-bottom relative z-10 w-full max-w-lg rounded-t-3xl p-4 shadow-2xl sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
              Surprise me
            </p>
            <h2 className="brand-font text-2xl text-[var(--brand-ink)]">
              Three ideas for today
            </h2>
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

        <div className="space-y-2">
          {picks.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenItem(item.id)}
              className="w-full rounded-2xl border border-[var(--line)] bg-[var(--elevated)] p-3 text-left"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
                {labels[idx] ?? `Option ${idx + 1}`}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-bold ${tierChipClass(item.safetyTier, feeling)}`}
                >
                  {tierLabelForFeeling(item.safetyTier, feeling)}
                </span>
                <span className="font-bold text-[var(--brand-ink)]">{item.name}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onReroll}
          className="btn btn-primary mt-4 w-full !rounded-xl"
        >
          <Sparkles className="h-4 w-4" />
          Shuffle again
        </button>
      </div>
    </div>
  )
}
