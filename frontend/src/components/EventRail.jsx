import { Link } from 'react-router-dom'
import EventCard from './EventCard'

/**
 * Horizontally-scrollable row of event cards with a heading and an optional
 * "see all" link. Renders nothing when there are no events (keeps Home clean).
 */
export default function EventRail({ title, events, seeAllTo }) {
  if (!events || events.length === 0) return null

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {seeAllTo && (
          <Link to={seeAllTo} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            See all →
          </Link>
        )}
      </div>
      <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {events.map((event) => (
          <div key={event.id} className="w-72 shrink-0">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  )
}
