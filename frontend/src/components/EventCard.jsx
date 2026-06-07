import { Link } from 'react-router-dom'
import { categoryLabel, statusStyle, formatDate } from '../lib/format'

export default function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {categoryLabel(event.category)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(event.status)}`}>
          {event.status}
        </span>
        {event.online && (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
            Online
          </span>
        )}
      </div>

      <h3 className="font-semibold text-slate-900">{event.title}</h3>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
        <span>{formatDate(event.startDateTime)}</span>
        {event.organizer && <span>· {event.organizer}</span>}
        {event.location && <span>· {event.location}</span>}
      </div>
    </Link>
  )
}
