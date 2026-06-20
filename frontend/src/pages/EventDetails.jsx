import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJson } from '../api'
import { useAuth } from '../auth/AuthContext'
import BookmarkButton from '../components/BookmarkButton'
import EventRail from '../components/EventRail'
import { recordView } from '../lib/recentlyViewed'
import { categoryLabel, categoryStyle, countdown, statusStyle, formatDateTime } from '../lib/format'

export default function EventDetails() {
  const { id } = useParams()
  const { isAuthenticated, api } = useAuth()
  const [event, setEvent] = useState(null)
  const [related, setRelated] = useState([])
  const [savedKnown, setSavedKnown] = useState(false)
  const [initialSaved, setInitialSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getJson(`/api/events/${id}`)
      .then((data) => {
        if (cancelled) return
        setEvent(data)
        recordView(data)
        // Related: other upcoming events in the same category.
        getJson(`/api/events?upcomingOnly=true&category=${data.category}&size=8`)
          .then((r) => {
            if (cancelled) return
            setRelated(r.content.filter((e) => String(e.id) !== String(id)).slice(0, 4))
          })
          .catch(() => {})
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedKnown(true)
      return
    }
    let cancelled = false
    api
      .get('/api/bookmarks?size=100')
      .then((d) => {
        if (cancelled) return
        setInitialSaved(d.content.some((e) => String(e.id) === String(id)))
        setSavedKnown(true)
      })
      .catch(() => !cancelled && setSavedKnown(true))
    return () => {
      cancelled = true
    }
  }, [id, isAuthenticated, api])

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>
  if (error)
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        Could not load event: {error}
      </div>
    )
  if (!event) return null

  const style = categoryStyle(event.category)
  const cd = countdown(event.startDateTime)

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/explore" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
        ← Back to events
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className={`h-1.5 w-full ${style.bar}`} />
        <div className="p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {categoryLabel(event.category)}
            </span>
            <span className={`rounded-full px-2 py-0.5 ${statusStyle(event.status)}`}>{event.status}</span>
            {cd && (
              <span className={cd.urgent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}>
                {cd.label}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{event.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Aggregated from <span className="font-medium">{event.source}</span>
          </p>

          <dl className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/50 sm:grid-cols-2">
            <Field label="Starts" value={formatDateTime(event.startDateTime)} />
            <Field label="Ends" value={formatDateTime(event.endDateTime)} />
            <Field label="Organizer" value={event.organizer} />
            <Field label="Where" value={event.online ? 'Online' : event.location || 'In-person'} />
          </dl>

          {event.description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
              {event.description}
            </p>
          )}

          {event.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {event.registrationUrl && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Register / View ↗
              </a>
            )}
            {savedKnown && <BookmarkButton eventId={event.id} initialSaved={initialSaved} />}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <div className="mt-10">
          <EventRail title="Related events" events={related} seeAllTo={`/explore?category=${event.category}`} />
        </div>
      )}
    </div>
  )
}

function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  )
}
