import { useEffect, useState } from 'react'
import { getJson } from '../api'
import EventCard from '../components/EventCard'
import Filters from '../components/Filters'
import { buildEventQuery, EMPTY_FILTERS } from '../lib/query'

const PAGE_SIZE = 24

export default function Home() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [events, setEvents] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Reset to the first page whenever filters change (debounced).
  const [debounced, setDebounced] = useState(filters)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(filters)
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [filters])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getJson(`/api/events?${buildEventQuery(debounced, page, PAGE_SIZE)}`)
      .then((data) => {
        if (cancelled) return
        setEvents((prev) => (page === 0 ? data.content : [...prev, ...data.content]))
        setTotalPages(data.totalPages)
        setTotal(data.totalElements)
        setError(null)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debounced, page])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Discover tech events</h2>
        <p className="text-sm text-slate-500">{total} upcoming events</p>
      </div>

      <Filters value={filters} onChange={setFilters} />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load events: {error}
        </div>
      )}

      {!error && events.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No events match your filters.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {loading && <p className="mt-6 text-center text-sm text-slate-400">Loading…</p>}

      {!loading && page + 1 < totalPages && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  )
}
