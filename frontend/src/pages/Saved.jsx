import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import EventCard from '../components/EventCard'
import EmptyState from '../components/EmptyState'
import { GridSkeleton } from '../components/Skeleton'
import { getJson } from '../api'
import { categoryLabel } from '../lib/format'
import { getRecentlyViewed } from '../lib/recentlyViewed'

const DAY = 86400000

export default function Saved() {
  const { api, session } = useAuth()
  const [saved, setSaved] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const recent = getRecentlyViewed()

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/api/bookmarks?size=100')
      .then(async (d) => {
        setSaved(d.content)
        await loadRecommendations(d.content, setRecommended)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [api])

  const remove = async (eventId) => {
    await api.del(`/api/bookmarks/${eventId}`)
    setSaved((prev) => prev.filter((e) => e.id !== eventId))
  }

  const name = session?.email?.split('@')[0] || 'there'
  const now = Date.now()
  const thisWeek = saved.filter((e) => {
    const t = new Date(e.startDateTime).getTime() - now
    return t > 0 && t <= 7 * DAY
  })
  const endingSoon = saved.filter((e) => {
    const t = new Date(e.startDateTime).getTime() - now
    return t > 0 && t <= 2 * DAY
  })

  // Favorite categories (derived from saves).
  const freq = {}
  saved.forEach((e) => (freq[e.category] = (freq[e.category] || 0) + 1))
  const favorites = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c)

  const tiles = [
    { label: 'Saved events', value: saved.length },
    { label: 'Starting this week', value: thisWeek.length },
    { label: 'Starting within 48h', value: endingSoon.length },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back, {name}</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Your personal opportunity dashboard.</p>

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{t.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t.label}</div>
          </div>
        ))}
      </div>

      {favorites.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Your favorite categories:</span>
          {favorites.map((c) => (
            <Link
              key={c}
              to={`/explore?category=${c}`}
              className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300"
            >
              {categoryLabel(c)}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
          <button onClick={load} className="ml-3 font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <GridSkeleton />
      ) : saved.length === 0 && !error ? (
        <EmptyState
          title="No saved events yet"
          message="Save events you're interested in and they'll show up here with reminders."
          suggestions={[{ label: 'Browse events', to: '/explore' }]}
        />
      ) : (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">Your saved events</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((event) => (
              <EventCard key={event.id} event={event} onUnsave={remove} />
            ))}
          </div>
        </section>
      )}

      {recommended.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">Recommended for you</h2>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Based on the categories you save most.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">Recently viewed</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

async function loadRecommendations(savedEvents, setRecommended) {
  if (savedEvents.length === 0) return
  const savedIds = new Set(savedEvents.map((e) => e.id))
  const freq = {}
  savedEvents.forEach((e) => (freq[e.category] = (freq[e.category] || 0) + 1))
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c)

  const results = await Promise.all(
    top.map((c) => getJson(`/api/events?upcomingOnly=true&category=${c}&size=12`).catch(() => ({ content: [] }))),
  )
  const merged = []
  const seen = new Set()
  for (const r of results) {
    for (const e of r.content) {
      if (!savedIds.has(e.id) && !seen.has(e.id)) {
        seen.add(e.id)
        merged.push(e)
      }
    }
  }
  setRecommended(merged.slice(0, 6))
}
