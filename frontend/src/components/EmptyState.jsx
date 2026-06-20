import { Link } from 'react-router-dom'

/** Friendly empty state with optional suggestion chips that link into Explore. */
export default function EmptyState({ title, message, suggestions = [] }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 text-3xl">🔍</div>
      <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {message && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>}
      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
