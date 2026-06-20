import { Link } from 'react-router-dom'
import BookmarkButton from './BookmarkButton'
import { categoryLabel, categoryStyle, countdown, formatDate } from '../lib/format'

export default function EventCard({ event, onUnsave }) {
  const style = categoryStyle(event.category)
  const cd = countdown(event.startDateTime)
  const where = event.online ? 'Online' : event.location || 'In-person'

  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
          {categoryLabel(event.category)}
        </span>
        {cd && (
          <span
            className={`text-xs font-medium ${
              cd.urgent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {cd.label}
          </span>
        )}
      </div>

      <Link
        to={`/events/${event.id}`}
        className="mt-2.5 font-semibold leading-snug text-slate-900 after:absolute after:inset-0 dark:text-slate-100"
      >
        {event.title}
      </Link>

      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {formatDate(event.startDateTime)} · {where}
      </div>

      {event.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {event.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-xs text-slate-400 dark:text-slate-500">via {event.source}</span>
        <div className="relative z-10">
          {onUnsave ? (
            <button
              onClick={() => onUnsave(event.id)}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Remove
            </button>
          ) : (
            <BookmarkButton eventId={event.id} compact />
          )}
        </div>
      </div>
    </div>
  )
}
