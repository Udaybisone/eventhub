import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJson } from '../api'
import { categoryLabel, statusStyle, formatDateTime } from '../lib/format'

export default function EventDetails() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getJson(`/api/events/${id}`)
      .then((data) => !cancelled && setEvent(data))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>
  if (error)
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Could not load event: {error}
      </div>
    )
  if (!event) return null

  return (
    <div>
      <Link to="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to events
      </Link>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
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

        <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Starts" value={formatDateTime(event.startDateTime)} />
          <Field label="Ends" value={formatDateTime(event.endDateTime)} />
          <Field label="Organizer" value={event.organizer} />
          <Field label="Location" value={event.location || (event.online ? 'Online' : '—')} />
          <Field label="Source" value={event.source} />
        </dl>

        {event.description && (
          <p className="mt-4 whitespace-pre-line text-slate-700">{event.description}</p>
        )}

        {event.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        {event.registrationUrl && (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Register / Details ↗
          </a>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  )
}
