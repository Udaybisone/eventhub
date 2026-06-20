import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getJson } from '../api'
import EventCard from '../components/EventCard'
import Filters from '../components/Filters'
import EmptyState from '../components/EmptyState'
import { GridSkeleton } from '../components/Skeleton'
import { CATEGORY_OPTIONS } from '../lib/format'
import { buildEventQuery, EMPTY_FILTERS } from '../lib/query'

const PAGE_SIZE = 24

export default function Explore() {
  const [searchParams] = useSearchParams()

  // Seed filters from the URL (e.g. /explore?category=HACKATHON&q=ai).
  const initial = useMemo(
    () => ({
      ...EMPTY_FILTERS,
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [filters, setFilters] = useState(initial)
  const [events, setEvents] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [debounced, setDebounced] = useState(initial)
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Explore events</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{total} matching events</p>
      </div>

      <Filters value={filters} onChange={setFilters} />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Could not load events: {error}
        </div>
      )}

      {!error && events.length === 0 && !loading && (
        <EmptyState
          title="No events match your filters"
          message="Try a broader search or a different category."
          suggestions={CATEGORY_OPTIONS.slice(0, 4).map((c) => ({
            label: c.label,
            to: `/explore?category=${c.value}`,
          }))}
        />
      )}

      {loading && page === 0 ? (
        <GridSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {loading && page > 0 && <p className="mt-6 text-center text-sm text-slate-400">Loading…</p>}

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
