import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import schema from '../data/schema.json'
import { useJustReconnected } from '../hooks/useOnline'
import { githubNewIssueUrl } from '../lib/github'
import {
  GENTLE_TRACK_GRADIENT,
  gentleScaleColor,
  submitTierLabel,
} from '../lib/score'
import {
  clearSubmitDraft,
  enqueueSubmission,
  loadSubmitDraft,
  loadSubmitQueue,
  removeQueuedSubmission,
  saveSubmitDraft,
  type QueuedSubmission,
} from '../lib/storage'
import {
  MEAL_OPTIONS,
  PREP_OPTIONS,
  buildSubmitItem,
  categoryLabel,
  draftHasContent,
  emptyDraft,
  friendlySubmitGaps,
  mealLabel,
  prepLabel,
  submitIssueBody,
  submitIssueTitle,
} from '../lib/submitDraft'
import type { CrohnsFoodItem, MealType, PrepMethod } from '../types'

function initialDraft(): CrohnsFoodItem {
  const saved = loadSubmitDraft()
  if (saved && draftHasContent(saved)) return saved
  return emptyDraft
}

function parseCommaList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isDecimalInput(raw: string) {
  return raw === '' || /^\d*\.?\d*$/.test(raw)
}

export function SubmitPage() {
  const { online, justReconnected, dismissReconnect } = useJustReconnected()
  const [boot] = useState(initialDraft)
  const [draft, setDraft] = useState(boot)
  const [tagsText, setTagsText] = useState(() => boot.tags.join(', '))
  const [keywordsText, setKeywordsText] = useState(() =>
    boot.searchKeywords.join(', '),
  )
  const [fiberText, setFiberText] = useState(() =>
    boot.fiberGramsPerServing === 0 ? '' : String(boot.fiberGramsPerServing),
  )
  const [queue, setQueue] = useState<QueuedSubmission[]>(() => loadSubmitQueue())
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    if (draftHasContent(draft)) saveSubmitDraft(draft)
    else clearSubmitDraft()
  }, [draft])

  const item = useMemo(() => buildSubmitItem(draft), [draft])
  const gaps = friendlySubmitGaps(item)
  const ready = gaps.length === 0
  const pendingCount = queue.length + (draftHasContent(draft) ? 1 : 0)
  const showWelcomeBack = justReconnected && pendingCount > 0 && online

  function update<K extends keyof CrohnsFoodItem>(key: K, value: CrohnsFoodItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function toggleMeal(meal: MealType) {
    setDraft((prev) => {
      const has = prev.mealTypes.includes(meal)
      const mealTypes = has
        ? prev.mealTypes.filter((m) => m !== meal)
        : [...prev.mealTypes, meal]
      return { ...prev, mealTypes }
    })
  }

  function togglePrep(prep: PrepMethod) {
    setDraft((prev) => {
      const has = prev.prepMethod.includes(prep)
      const prepMethod = has
        ? prev.prepMethod.filter((m) => m !== prep)
        : [...prev.prepMethod, prep]
      return { ...prev, prepMethod }
    })
  }

  function refreshQueue() {
    setQueue(loadSubmitQueue())
  }

  function resetForm() {
    setDraft(emptyDraft)
    setTagsText('')
    setKeywordsText('')
    setFiberText('')
    clearSubmitDraft()
  }

  function openReview(food: CrohnsFoodItem) {
    window.open(
      githubNewIssueUrl(submitIssueTitle(food), submitIssueBody(food)),
      '_blank',
      'noopener,noreferrer',
    )
  }

  /** Online: open the review form (GitHub issue). Offline: park it on-device. */
  function submitForReview() {
    if (!ready) return
    if (!online) {
      enqueueSubmission(item)
      refreshQueue()
      resetForm()
      setFlash('Saved on this phone — we’ll finish review when you’re back online.')
      dismissReconnect()
      return
    }
    openReview(item)
    resetForm()
    setFlash(null)
    dismissReconnect()
  }

  function submitQueued(entry: QueuedSubmission) {
    if (!online) return
    openReview(entry.item)
    removeQueuedSubmission(entry.localId)
    refreshQueue()
    dismissReconnect()
  }

  function removeQueued(localId: string) {
    removeQueuedSubmission(localId)
    refreshQueue()
  }

  return (
    <div className="food-scroll h-dvh overflow-y-auto overscroll-contain">
      <div className="mx-auto max-w-2xl px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(5rem,env(safe-area-inset-bottom))]">
        <Link to="/" className="text-sm font-semibold text-[var(--brand)]">
          ← Back to catalog
        </Link>
        <h1 className="brand-font mt-3 text-3xl text-[var(--brand-ink)]">
          Suggest a food
        </h1>
        <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
          Tell us about something that sits well. Submit opens a short review
          form so it can be added to the catalog.
        </p>

        {showWelcomeBack ? (
          <div
            role="status"
            className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950"
          >
            <p className="font-semibold">Welcome back online</p>
            <p className="mt-1">
              You have {pendingCount} food{pendingCount === 1 ? '' : 's'} waiting
              to finish review
              {queue[0]?.item.name ? (
                <>
                  {' '}
                  (next:{' '}
                  <span className="font-semibold">{queue[0].item.name}</span>)
                </>
              ) : null}
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {queue[0] ? (
                <button
                  type="button"
                  onClick={() => submitQueued(queue[0])}
                  className="rounded-xl bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
                >
                  Submit for review
                </button>
              ) : ready ? (
                <button
                  type="button"
                  onClick={submitForReview}
                  className="rounded-xl bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white"
                >
                  Submit for review
                </button>
              ) : null}
              <button
                type="button"
                onClick={dismissReconnect}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--brand-ink)]/70"
              >
                Not now
              </button>
            </div>
          </div>
        ) : null}

        {!online ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
            You&apos;re offline — you can still fill this out. We&apos;ll save
            it here and finish review when you&apos;re back online.
          </p>
        ) : null}

        {flash ? (
          <p className="mt-3 rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-3 py-2.5 text-sm text-[var(--brand-ink)]">
            {flash}
          </p>
        ) : null}

        {queue.length > 0 ? (
          <section className="panel mt-4 rounded-2xl p-3">
            <h2 className="text-sm font-semibold text-[var(--brand-ink)]">
              Waiting to finish ({queue.length})
            </h2>
            <ul className="mt-2 space-y-2">
              {queue.map((entry) => (
                <li
                  key={entry.localId}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">
                    {entry.item.name}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    {online ? (
                      <button
                        type="button"
                        className="font-semibold text-[var(--brand)]"
                        onClick={() => submitQueued(entry)}
                      >
                        Submit for review
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-[var(--brand-ink)]/55"
                      onClick={() => removeQueued(entry.localId)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Field
            label="Food name"
            hint="What do you call it at the store or restaurant?"
          >
            <input
              className="field"
              value={draft.name}
              placeholder="Chicken bone broth"
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </Field>

          <Field label="Brand or place (optional)">
            <input
              className="field"
              value={draft.brandOrRestaurant ?? ''}
              placeholder="Costco, homemade, Chipotle…"
              onChange={(e) => update('brandOrRestaurant', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Aisle / category">
              <select
                className="field"
                value={draft.categoryFolder}
                onChange={(e) =>
                  update(
                    'categoryFolder',
                    e.target.value as CrohnsFoodItem['categoryFolder'],
                  )
                }
              >
                {(schema.properties.categoryFolder.enum as string[]).map((v) => (
                  <option key={v} value={v}>
                    {categoryLabel(v as CrohnsFoodItem['categoryFolder'])}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cuisine style">
              <select
                className="field"
                value={draft.region}
                onChange={(e) =>
                  update('region', e.target.value as CrohnsFoodItem['region'])
                }
              >
                {(schema.properties.region.enum as string[]).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-semibold text-[var(--brand-ink)]">
              How gentle?
            </span>
            <p className="text-xs text-[var(--brand-ink)]/55">
              Most people start on the left. Slide right only if it needs a
              steadier day.
            </p>
            <div className="relative flex h-11 items-center">
              <div
                className="pointer-events-none absolute inset-x-0 top-1/2 h-2.5 rounded-full opacity-90"
                style={{
                  background: GENTLE_TRACK_GRADIENT,
                  transform: 'translateY(-50%) scaleX(-1)',
                }}
              />
              <input
                aria-label="How gentle is this food"
                aria-valuetext={submitTierLabel(item.safetyTier)}
                className="feeling-range relative z-10 w-full"
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={draft.crohnsScore}
                // rtl so high (gentle) scores sit on the left, matching the hint
                style={{
                  color: gentleScaleColor(draft.crohnsScore),
                  direction: 'rtl',
                }}
                onChange={(e) => update('crohnsScore', Number(e.target.value))}
              />
            </div>
            <div className="muted flex justify-between gap-2 text-[11px] font-medium">
              <span>Extra gentle</span>
              <span>Needs a good day</span>
            </div>
          </div>

          <Field label="When do you eat it?" hint="Tap all that fit.">
            <div className="flex flex-wrap gap-2">
              {MEAL_OPTIONS.map((meal) => (
                <button
                  key={meal}
                  type="button"
                  className="chip"
                  data-active={draft.mealTypes.includes(meal) ? 'true' : 'false'}
                  onClick={() => toggleMeal(meal)}
                >
                  {mealLabel(meal)}
                </button>
              ))}
            </div>
          </Field>

          <Field label="How do you usually get it?">
            <div className="flex flex-wrap gap-2">
              {PREP_OPTIONS.map((prep) => (
                <button
                  key={prep}
                  type="button"
                  className="chip"
                  data-active={draft.prepMethod.includes(prep) ? 'true' : 'false'}
                  onClick={() => togglePrep(prep)}
                >
                  {prepLabel(prep)}
                </button>
              ))}
            </div>
          </Field>

          <div>
            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-[var(--brand-ink)]">
                  Price
                </span>
                <select
                  className="field"
                  value={draft.costTier}
                  onChange={(e) =>
                    update('costTier', Number(e.target.value) as 1 | 2 | 3)
                  }
                >
                  <option value={1}>$</option>
                  <option value={2}>$$</option>
                  <option value={3}>$$$</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-[var(--brand-ink)]">
                  Effort
                </span>
                <select
                  className="field"
                  value={draft.convenienceScore}
                  onChange={(e) =>
                    update('convenienceScore', Number(e.target.value))
                  }
                >
                  {/* Stored as convenienceScore: higher = easier / more grab-and-go */}
                  <option value={5}>Super easy</option>
                  <option value={4}>Pretty easy</option>
                  <option value={3}>Some prep</option>
                  <option value={2}>Takes work</option>
                  <option value={1}>A project</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-[var(--brand-ink)]">
                  Fiber (g)
                </span>
                <input
                  className="field field-number"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  placeholder="Skip if unsure"
                  value={fiberText}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (!isDecimalInput(raw)) return
                    setFiberText(raw)
                    update(
                      'fiberGramsPerServing',
                      raw === '' || raw === '.' ? 0 : Number(raw),
                    )
                  }}
                />
              </label>
            </div>
            <p className="mt-1.5 text-xs text-[var(--brand-ink)]/55">
              Fiber is optional — leave blank if you don&apos;t know.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-[var(--brand)]"
                checked={draft.lactoseSafe}
                onChange={(e) => update('lactoseSafe', e.target.checked)}
              />
              Usually lactose-safe
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-[var(--brand)]"
                checked={draft.citrusFree}
                onChange={(e) => update('citrusFree', e.target.checked)}
              />
              No citrus
            </label>
          </div>

          <Field
            label="Short tags"
            hint="At least two words people might filter by."
          >
            <input
              className="field"
              value={tagsText}
              placeholder="broth, takeout, high-protein"
              onChange={(e) => {
                const raw = e.target.value
                setTagsText(raw)
                update('tags', parseCommaList(raw))
              }}
            />
          </Field>

          <Field
            label="Other names people might search"
            hint="Synonyms, brands, nicknames."
          >
            <input
              className="field"
              value={keywordsText}
              placeholder="stock, soup base, Costco broth"
              onChange={(e) => {
                const raw = e.target.value
                setKeywordsText(raw)
                update('searchKeywords', parseCommaList(raw))
              }}
            />
          </Field>

          <Field
            label="Why it’s gentle"
            hint="What makes this a good pick for a sensitive gut day?"
          >
            <textarea
              className="field min-h-24"
              value={draft.whyItWorks}
              placeholder="Warm, low fiber, easy to sip when nothing else sounds good."
              onChange={(e) => update('whyItWorks', e.target.value)}
            />
          </Field>

          <Field
            label="How to make or order it"
            hint="A short script you’d actually use."
          >
            <textarea
              className="field min-h-24"
              value={draft.prepOrOrderInstructions}
              placeholder="Heat gently on the stove. Sip slowly. Skip onion packets / spicy add-ons."
              onChange={(e) => update('prepOrOrderInstructions', e.target.value)}
            />
          </Field>
        </form>

        {!ready ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-semibold">Still need a few bits:</p>
            <ul className="mt-1 list-disc pl-5">
              {gaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm font-medium text-emerald-700">
            Looks ready.
          </p>
        )}

        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={!ready}
            onClick={submitForReview}
            className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {online ? 'Submit for review' : 'Save for later'}
          </button>
          {draftHasContent(draft) ? (
            <button
              type="button"
              onClick={() => {
                resetForm()
                setFlash(null)
                dismissReconnect()
              }}
              className="w-full py-2 text-sm font-semibold text-[var(--brand-ink)]/55"
            >
              Clear this draft
            </button>
          ) : null}
        </div>

        <style>{`
          .field {
            width: 100%;
            min-height: 2.75rem;
            border-radius: 0.9rem;
            border: 1px solid var(--line);
            background: rgba(255,255,255,0.85);
            padding: 0.7rem 0.85rem;
            outline: none;
          }
          .field:focus {
            border-color: var(--brand);
            box-shadow: 0 0 0 3px rgba(54,141,218,0.18);
          }
          .field::placeholder {
            color: rgba(22, 58, 99, 0.38);
          }
          .field-number::-webkit-outer-spin-button,
          .field-number::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .field-number {
            -moz-appearance: textfield;
            appearance: textfield;
          }
        `}</style>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-[var(--brand-ink)]">
        {label}
      </span>
      {hint ? (
        <span className="mb-1.5 block text-xs text-[var(--brand-ink)]/55">
          {hint}
        </span>
      ) : null}
      {children}
    </label>
  )
}
