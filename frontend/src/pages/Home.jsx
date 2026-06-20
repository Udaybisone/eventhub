import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJson } from '../api'
import StatsBar from '../components/StatsBar'
import EventRail from '../components/EventRail'
import CategoryGrid from '../components/CategoryGrid'
import { RailSkeleton } from '../components/Skeleton'
import { CATEGORY_OPTIONS } from '../lib/format'

function weekendRange() {
  const now = new Date()
  const sat = new Date(now)
  sat.setHours(0, 0, 0, 0)
  sat.setDate(sat.getDate() + ((6 - now.getDay() + 7) % 7))
  const sun = new Date(sat)
  sun.setDate(sat.getDate() + 1)
  sun.setHours(23, 59, 59, 0)
  return { from: sat.toISOString(), to: sun.toISOString() }
}

export default function Home() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [rails, setRails] = useState({ soon: [], weekend: [], contests: [], conferences: [] })
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    const wk = weekendRange()
    Promise.all([
      getJson('/api/events?upcomingOnly=true&size=10'),
      getJson(`/api/events?upcomingOnly=true&from=${wk.from}&to=${wk.to}&size=10`),
      getJson('/api/events?upcomingOnly=true&category=CODING_CONTEST&size=10'),
      getJson('/api/events?upcomingOnly=true&category=CONFERENCE&size=10'),
      getJson('/api/stats').catch(() => null),
    ])
      .then(([soon, weekend, contests, conferences, stats]) => {
        setRails({
          soon: soon.content,
          weekend: weekend.content,
          contests: contests.content,
          conferences: conferences.content,
        })
        if (stats) setCounts(stats.categoryCounts || {})
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const search = (e) => {
    e.preventDefault()
    navigate(`/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }

  return (
    <div>
      <section className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-6 py-20 ring-1 ring-white/10 sm:px-14 sm:py-28">
        {/* Muted ambient glows for depth — no neon. */}
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-violet-700/15 blur-[120px]" />

        <div className="relative max-w-2xl">
          <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-indigo-300/80">
            For developers
          </span>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Never miss a tech opportunity again
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-400">
            Hackathons, contests, conferences and meetups from across the web — deduplicated and
            searchable in one place.
          </p>

          <form
            onSubmit={search}
            className="mt-9 flex max-w-xl items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-md"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hackathons, contests, conferences…"
              className="w-full border-0 bg-transparent px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
            />
            <button className="shrink-0 rounded-xl bg-white px-5 py-2.5 font-medium text-slate-900 transition hover:bg-slate-100">
              Search
            </button>
          </form>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500">Popular</span>
            {CATEGORY_OPTIONS.slice(0, 5).map((c) => (
              <button
                key={c.value}
                onClick={() => navigate(`/explore?category=${c.value}`)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <CategoryGrid counts={counts} />

      <div className="mb-10">
        <StatsBar />
      </div>

      {error && (
        <div className="mb-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Could not load events: {error}
          <button onClick={load} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-8">
          <RailSkeleton />
          <RailSkeleton />
        </div>
      ) : (
        <>
          <EventRail title="Starting soon" events={rails.soon} seeAllTo="/explore" />
          <EventRail title="This weekend" events={rails.weekend} seeAllTo="/explore" />
          <EventRail title="Coding contests" events={rails.contests} seeAllTo="/explore?category=CODING_CONTEST" />
          <EventRail title="Conferences" events={rails.conferences} seeAllTo="/explore?category=CONFERENCE" />
        </>
      )}
    </div>
  )
}
