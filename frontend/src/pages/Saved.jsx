import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import EventCard from '../components/EventCard'

export default function Saved() {
  const { api } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/bookmarks?size=100')
      .then((d) => !cancelled && setEvents(d.content))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [api])

  const remove = async (eventId) => {
    await api.del(`/api/bookmarks/${eventId}`)
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-slate-900">Saved events</h2>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {!loading && events.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          You haven&apos;t saved any events yet.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="space-y-2">
            <EventCard event={event} />
            <button
              onClick={() => remove(event.id)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
