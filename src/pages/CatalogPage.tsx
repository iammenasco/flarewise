import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FilterPanel, ModeChips } from '../components/FilterBar'
import { FlareDial } from '../components/FlareDial'
import { FoodCard } from '../components/FoodCard'
import { FoodDrawer } from '../components/FoodDrawer'
import { GroceryPanel } from '../components/GroceryPanel'
import { PickForMe } from '../components/PickForMe'
import { foodById } from '../data'
import { pickForMe, useCatalogFilters } from '../hooks/useCatalogFilters'
import { useJustReconnected } from '../hooks/useOnline'
import { usePreferences } from '../hooks/usePreferences'
import { countActiveFilters, isVacationTag } from '../lib/filters'
import { githubRepoUrl } from '../lib/github'
import { feelingFromMinScore } from '../lib/score'
import { countPendingSubmissions, loadSubmitQueue } from '../lib/storage'

export function CatalogPage() {
  const {
    prefs,
    toggleStar,
    toggleGrocery,
    setMinScore,
    setGuardrails,
    setPersonalStatus,
    toggleCheckedIngredient,
    clearGrocery,
    downloadBackup,
    restoreBackup,
  } = usePreferences()

  const { filters, filtered, selectedId, patch, setSelected } =
    useCatalogFilters(prefs)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(40)
  const [picks, setPicks] = useState(() => pickForMe(filtered))
  const [buildInfo, setBuildInfo] = useState<{ builtAt?: string } | null>(null)
  const foodScrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { online, justReconnected, dismissReconnect } = useJustReconnected()
  const pendingCount =
    justReconnected && online ? countPendingSubmissions() : 0
  const showReconnectSubmit = pendingCount > 0
  const nextQueuedName =
    justReconnected && online
      ? loadSubmitQueue()[0]?.item.name?.trim() || null
      : null

  const selected = selectedId ? (foodById.get(selectedId) ?? null) : null
  const feeling = feelingFromMinScore(prefs.minScore)

  const [prevFilterKey, setPrevFilterKey] = useState('')
  const filterKey = `${filters.q}:${filters.tag}:${filters.mode}:${filters.meal}:${filters.region}:${filters.cost}:${prefs.minScore}:${prefs.guardrails.showDangerZone}:${prefs.guardrails.cruiseMode}`
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setVisibleCount(40)
  }

  const visibleFoods = useMemo(() => {
    return filtered.slice(0, visibleCount)
  }, [filtered, visibleCount])

  const hasMore = filtered.length > visibleCount

  useEffect(() => {
    const root = foodScrollRef.current
    const target = loadMoreRef.current
    if (!root || !target || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) =>
            Math.min(count + 40, filtered.length),
          )
        }
      },
      { root, rootMargin: '200px 0px', threshold: 0 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [filtered.length, hasMore, visibleCount])

  useEffect(() => {
    void fetch(`${import.meta.env.BASE_URL}build-info.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { builtAt?: string } | null) => setBuildInfo(data))
      .catch(() => setBuildInfo({ builtAt: __APP_BUILD_TIME__ }))
  }, [])

  const resultLabel = useMemo(() => {
    const n = filtered.length
    if (filters.q) return `${n} match${n === 1 ? '' : 'es'}`
    return `${n} food${n === 1 ? '' : 's'} for today`
  }, [filtered.length, filters.q])

  const activeFilterCount = countActiveFilters(filters, prefs.guardrails)

  function roll() {
    setPicks(pickForMe(filtered))
    setPickerOpen(true)
  }

  function toggleVacationMode() {
    const next = !prefs.guardrails.cruiseMode
    setGuardrails({ cruiseMode: next })
    if (!next && filters.tag && isVacationTag(filters.tag)) {
      patch({ tag: '' })
    }
  }

  function selectDestination(destinationTag: string) {
    if (!prefs.guardrails.cruiseMode) {
      setGuardrails({ cruiseMode: true })
    }
    patch({ tag: filters.tag === destinationTag ? '' : destinationTag })
  }

  function clearExtraFilters() {
    patch({ meal: '', region: '', tag: '', cost: '' })
    setGuardrails({
      grabAndGoOnly: false,
      toasterOvenOnly: false,
      lactoseSafeOnly: false,
      cruiseMode: false,
      showDangerZone: false,
    })
  }

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="shrink-0 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}icons/icon-128.png`}
              alt=""
              className="h-9 w-9 rounded-xl shadow-sm"
              width={36}
              height={36}
            />
            <div className="min-w-0">
              <h1 className="brand-font text-xl leading-none text-[var(--brand-ink)]">
                Flarewise
              </h1>
              <p className="muted truncate text-xs">
                Crohn&apos;s-friendly food catalog
              </p>
            </div>
          </div>
          <Link
            to="/submit"
            className="btn btn-primary shrink-0"
            title={
              online
                ? 'Submit a food'
                : 'Draft offline — GitHub submit when you are back online'
            }
          >
            <Plus className="h-4 w-4" />
            Add
          </Link>
        </div>
        {!online ? (
          <p className="muted mt-2 text-xs">
            You&apos;re offline — browsing still works. Food suggestions save
            here until you can finish review online.
          </p>
        ) : null}
        {showReconnectSubmit ? (
          <div
            role="status"
            className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-950"
          >
            <p className="font-semibold">Welcome back online</p>
            <p className="mt-0.5">
              You have {pendingCount} food{pendingCount === 1 ? '' : 's'} waiting
              to finish review
              {nextQueuedName ? (
                <>
                  {' '}
                  (next:{' '}
                  <span className="font-semibold">{nextQueuedName}</span>)
                </>
              ) : null}
              .
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                to="/submit"
                className="rounded-xl bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white"
                onClick={dismissReconnect}
              >
                Submit for review
              </Link>
              <button
                type="button"
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-950/70"
                onClick={dismissReconnect}
              >
                Later
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <div className="shrink-0 space-y-2 border-b border-[var(--line)] pb-2">
        <label className="panel flex items-center gap-2 rounded-xl px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-[var(--brand)]" />
          <input
            value={filters.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Search cereal, noodles, takeout…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--brand-ink)]/40"
          />
          {filters.q ? (
            <button
              type="button"
              aria-label="Clear search"
              className="rounded-full p-0.5 text-[var(--brand-ink)]/45"
              onClick={() => patch({ q: '' })}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>

        <div className="panel flex items-center gap-2 rounded-xl px-2.5 py-2 shadow-sm">
          <FlareDial minScore={prefs.minScore} onMinScore={setMinScore} />
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="btn btn-soft relative shrink-0 self-center !min-h-10 !px-3 !text-xs"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <ModeChips
            mode={filters.mode}
            onMode={(mode) => patch({ mode })}
          />
          <button
            type="button"
            onClick={roll}
            className="btn btn-ghost shrink-0 !min-h-10 !px-3 !text-xs"
            aria-label="Surprise me with three ideas for today"
          >
            <Sparkles className="h-4 w-4 text-[var(--brand)]" />
            Surprise me
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 py-2">
          <p className="text-sm font-medium text-[var(--brand-ink)]/80">
            {resultLabel}
          </p>
          {filters.tag ? (
            <button
              type="button"
              className="chip !min-h-8 !text-xs"
              data-active="true"
              onClick={() => patch({ tag: '' })}
            >
              #{filters.tag} ×
            </button>
          ) : null}
        </div>

        <div
          ref={foodScrollRef}
          className="food-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {filters.mode === 'grocery' ? (
            <GroceryPanel
              prefs={prefs}
              onToggleChecked={toggleCheckedIngredient}
              onClear={clearGrocery}
            />
          ) : null}

          {visibleFoods.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              feeling={feeling}
              starred={prefs.starredIds.includes(item.id)}
              inCart={prefs.groceryIds.includes(item.id)}
              personalStatus={prefs.personalStatus[item.id]}
              onOpen={() => setSelected(item.id)}
              onToggleStar={() => toggleStar(item.id)}
              onToggleCart={() => toggleGrocery(item.id)}
            />
          ))}

          {hasMore ? (
            <div
              ref={loadMoreRef}
              className="pt-1 pb-3 text-center text-[11px] font-medium text-[var(--brand-ink)]/45"
              aria-hidden="true"
            >
              Loading more…
            </div>
          ) : null}

          {!filtered.length ? (
            <div className="panel rounded-2xl p-6 text-center text-sm text-[var(--brand-ink)]/65">
              Nothing matches. Slide Today toward a better day, or clear filters.
            </div>
          ) : null}

          <details className="panel rounded-2xl p-3 text-sm">
            <summary className="cursor-pointer font-semibold text-[var(--brand-ink)]">
              Backup & restore (local only)
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 font-semibold text-[var(--brand-ink)]"
                onClick={downloadBackup}
              >
                Download backup
              </button>
              <label className="rounded-xl bg-[var(--brand-soft)] px-3 py-2 font-semibold text-[var(--brand-ink)]">
                Import backup
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const text = await file.text()
                    restoreBackup(text)
                  }}
                />
              </label>
            </div>
          </details>

          <footer className="muted space-y-2 px-1 pb-2 pt-4 text-center text-[11px] leading-relaxed">
            <p>
              Flarewise is open source — free to use, fork, and improve. It is not
              medical advice. Everyone&apos;s gut is different; when in doubt,
              check with your care team.
            </p>
            <p>
              Last updated{' '}
              {new Date(buildInfo?.builtAt || __APP_BUILD_TIME__).toLocaleDateString(
                undefined,
                { year: 'numeric', month: 'short', day: 'numeric' },
              )}
              {' · '}
              <a
                className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
                href={githubRepoUrl()}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              {' · '}
              <a
                className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
                href={`${import.meta.env.BASE_URL}catalog.json`}
                target="_blank"
                rel="noreferrer"
              >
                catalog.json
              </a>
            </p>
          </footer>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-[var(--brand-ink)]/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="panel safe-bottom relative z-10 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-4 shadow-2xl sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="brand-font text-xl text-[var(--brand-ink)]">Filters</h2>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-[var(--brand-soft)]"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              onPatch={patch}
              lactoseSafeOnly={prefs.guardrails.lactoseSafeOnly}
              toasterOvenOnly={prefs.guardrails.toasterOvenOnly}
              grabAndGoOnly={prefs.guardrails.grabAndGoOnly}
              citrusFreeOnly={prefs.guardrails.citrusFreeOnly}
              cruiseMode={prefs.guardrails.cruiseMode}
              showDangerZone={prefs.guardrails.showDangerZone}
              onToggleGuardrail={(key) => {
                if (key === 'showDangerZone') {
                  setGuardrails({ showDangerZone: !prefs.guardrails.showDangerZone })
                  return
                }
                if (key === 'cruiseMode') {
                  toggleVacationMode()
                  return
                }
                setGuardrails({ [key]: !prefs.guardrails[key] })
              }}
              onSelectDestination={selectDestination}
              onClearExtra={clearExtraFilters}
            />
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-[var(--brand)] px-4 py-3 font-semibold text-white"
              onClick={() => setFiltersOpen(false)}
            >
              Show {filtered.length} food{filtered.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      ) : null}

      <FoodDrawer
        item={selected}
        feeling={feeling}
        starred={selected ? prefs.starredIds.includes(selected.id) : false}
        inCart={selected ? prefs.groceryIds.includes(selected.id) : false}
        personalStatus={
          selected ? prefs.personalStatus[selected.id] : undefined
        }
        onClose={() => setSelected(null)}
        onToggleStar={() => selected && toggleStar(selected.id)}
        onToggleCart={() => selected && toggleGrocery(selected.id)}
        onSetStatus={(status) =>
          selected && setPersonalStatus(selected.id, status)
        }
        onTag={(tag) => {
          // One URL write — separate patch + setSelected races and drops `tag`.
          patch({ tag }, { item: null })
        }}
      />

      <PickForMe
        open={pickerOpen}
        feeling={feeling}
        picks={picks}
        onClose={() => setPickerOpen(false)}
        onReroll={roll}
        onOpenItem={(id) => {
          setPickerOpen(false)
          setSelected(id)
        }}
      />
    </div>
  )
}
