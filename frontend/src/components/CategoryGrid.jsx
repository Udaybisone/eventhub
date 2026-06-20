import { Link } from 'react-router-dom'
import { CATEGORY_OPTIONS, categoryStyle } from '../lib/format'

/** "Browse by category" blocks — restrained: neutral icon tile, a subtle colour
 *  accent dot for identity, hairline border, quiet hover. */
export default function CategoryGrid({ counts = {} }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Browse by category</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORY_OPTIONS.map((c) => {
          const count = counts[c.value]
          return (
            <Link
              key={c.value}
              to={`/explore?category=${c.value}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base dark:bg-slate-800">
                {c.icon}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${categoryStyle(c.value).dot}`} />
                  <span className="truncate">{c.label}</span>
                </span>
                <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                  {count != null ? `${count} upcoming` : 'Explore'}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
