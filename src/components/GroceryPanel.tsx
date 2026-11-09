import { Copy, Trash2 } from 'lucide-react'
import { foodById } from '../data'
import type { CatalogPreferences } from '../types'

interface GroceryPanelProps {
  prefs: CatalogPreferences
  onToggleChecked: (ingredient: string) => void
  onClear: () => void
}

export function GroceryPanel({
  prefs,
  onToggleChecked,
  onClear,
}: GroceryPanelProps) {
  const ingredients = Array.from(
    new Set(
      prefs.groceryIds.flatMap(
        (id) => foodById.get(id)?.groceryIngredients ?? [foodById.get(id)?.name].filter(Boolean) as string[],
      ),
    ),
  ).sort((a, b) => a.localeCompare(b))

  async function copyList() {
    const lines = ingredients.map((item) => {
      const checked = prefs.checkedGroceryIngredients.includes(item)
      return `${checked ? '[x]' : '[ ]'} ${item}`
    })
    const text = [`Flarewise grocery list`, '', ...lines].join('\n')
    await navigator.clipboard.writeText(text)
  }

  if (!prefs.groceryIds.length) {
    return (
      <div className="panel rounded-2xl p-4 text-sm text-[var(--brand-ink)]/70">
        Your grocery cart is empty. Open any food and tap Add to cart.
      </div>
    )
  }

  return (
    <section className="panel rounded-2xl p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-[var(--brand-ink)]">In-aisle checklist</h2>
          <p className="text-sm text-[var(--brand-ink)]/60">
            {ingredients.length} ingredients from {prefs.groceryIds.length} items
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-full p-2 hover:bg-[var(--brand-soft)]"
            aria-label="Copy grocery list"
            onClick={() => void copyList()}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full p-2 hover:bg-[var(--brand-soft)]"
            aria-label="Clear grocery list"
            onClick={onClear}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {ingredients.map((ingredient) => {
          const checked = prefs.checkedGroceryIngredients.includes(ingredient)
          return (
            <li key={ingredient}>
              <label className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-[var(--brand-soft)]/60">
                <input
                  type="checkbox"
                  className="mt-1 accent-[var(--brand)]"
                  checked={checked}
                  onChange={() => onToggleChecked(ingredient)}
                />
                <span
                  className={`text-sm ${checked ? 'text-[var(--brand-ink)]/40 line-through' : 'text-[var(--brand-ink)]'}`}
                >
                  {ingredient}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
