import { useEffect, useState } from 'react'
import { getJson } from '../api'

/** Real platform stats from /api/stats — restrained, foreground numbers, muted labels. */
export default function StatsBar() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getJson('/api/stats')
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  if (!stats) return null

  const items = [
    { value: stats.upcomingEvents, label: 'Upcoming events' },
    { value: stats.startingThisWeek, label: 'Starting this week' },
    { value: Object.keys(stats.categoryCounts || {}).length, label: 'Categories' },
    { value: stats.sourceCount, label: 'Live sources' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{it.value}</div>
          <div className="mt-1 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">{it.label}</div>
        </div>
      ))}
    </div>
  )
}
