import { CATALOG_JOBS, type CatalogJobId } from '../lib/filters'

interface SearchScopeProps {
  job: CatalogJobId
  onJob: (job: CatalogJobId) => void
}

/** Compact Make / Order / Check job scope sitting with the search field. */
export function SearchScope({ job, onJob }: SearchScopeProps) {
  return (
    <div
      className="flex gap-1 overflow-x-auto"
      role="radiogroup"
      aria-label="Catalog job"
    >
      {CATALOG_JOBS.map((ctx) => (
        <button
          key={ctx.id}
          type="button"
          role="radio"
          aria-checked={job === ctx.id}
          className="chip shrink-0 !min-h-8 !px-2.5 !py-1 !text-xs"
          data-active={job === ctx.id}
          title={ctx.hint}
          onClick={() => onJob(ctx.id)}
        >
          {ctx.shortLabel}
        </button>
      ))}
    </div>
  )
}
